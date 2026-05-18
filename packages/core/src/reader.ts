/**
 * `readFolder` — the full §12.5 pipeline.
 *
 *   1. content (.json) or empty object for opaque records
 *   2. + sidecar merge   (§8, shallow, sidecar wins)
 *   3. + cascade fill    (§12.3, `locale` + declared keys only)
 *   4. references resolved (§11.4, against the step-3 result)
 *
 * Steps 1–3 are computed per record up-front so step 4 can resolve refs
 * against fully-cascaded *target* records (§11.4 clause 2).
 */

import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import {
  identityOf,
  isHidden,
  splitName,
} from './identity.js';
import { mergeSidecar, modifiersEqual } from './sidecar.js';
import { applyCascade } from './cascade.js';
import {
  evaluatePointer,
  isEscapedRefString,
  isRefString,
  parseRef,
  resolveIdentity,
  unescapeRef,
} from './refs.js';
import type {
  Collection,
  Identity,
  Json,
  JsonObject,
  Manifest,
  ReadOptions,
  Record as MosaicRecord,
  Resolution,
  ValidationMessage,
} from './types.js';

/** Internal: a discovered on-disk file with parsed identity bits. */
interface FileEntry {
  /** POSIX-style relative path from the content root. */
  rel: string;
  /** Path segments of `rel`. */
  parts: string[];
  /** Absolute path on disk. */
  abs: string;
  base: string;
  modifiers: string[];
  ext: string;
  /** Identity per §7.1; folder form when `base === 'index'`. */
  ident: Identity;
}

/** Internal: a record's structured payload BEFORE refs are resolved. */
interface PreRecord {
  identity: string;
  data: JsonObject;
  sources: string[];
  opaque: boolean;
  /** The collection identity the referrer sits in. */
  collection: string;
}

/**
 * Run the full pipeline (§12.5) and return resolved records by identity.
 */
export async function readFolder(
  rootPath: string,
  opts: ReadOptions = {},
): Promise<Resolution> {
  const absRoot = path.resolve(rootPath);
  const contentRoot = opts.contentRoot
    ? path.resolve(opts.contentRoot)
    : absRoot;
  const cascadingKeys = opts.cascadingKeys ?? [];
  const keepDangling = !!opts.keepDangling;
  const warnings: ValidationMessage[] = [];

  const manifest = await readManifest(absRoot);

  const files = await walk(contentRoot);

  // -------- Pass 1: classify files (records vs sidecars) ------------------
  // Group by directory so §8 sidecar matching is local.
  const byDir = new globalThis.Map<string, FileEntry[]>();
  for (const f of files) {
    const dir = f.parts.slice(0, -1).join('/');
    const list = byDir.get(dir) ?? [];
    list.push(f);
    byDir.set(dir, list);
  }

  // For each .json, decide if it's a sidecar OR a record on its own.
  const sidecarRels = new globalThis.Set<string>();
  /** content-file rel-path → matching sidecar rel-path (or null). */
  const sidecarFor = new globalThis.Map<string, string>();
  for (const [, entries] of byDir) {
    const content = entries.filter((e) => e.ext !== 'json');
    for (const e of entries) {
      if (e.ext !== 'json') continue;
      const match = content.find(
        (c) => c.base === e.base && modifiersEqual(c.modifiers, e.modifiers),
      );
      if (match) {
        sidecarRels.add(e.rel);
        sidecarFor.set(match.rel, e.rel);
      } else if (
        e.modifiers.length > 0 &&
        content.some((c) => c.base === e.base && c.modifiers.length === 0)
      ) {
        // §8.4 orphan modifier sidecar
        warnings.push({
          path: e.rel,
          message:
            `orphan modifier sidecar: '.${e.modifiers.join('.')}' has no ` +
            `matching content sibling for '${e.base}'.`,
        });
      }
    }
  }

  // -------- Pass 2: build PreRecord per identity (content + sidecar) -------
  // Identity collisions (§7.1) become errors at the validate layer; here we
  // shallow-merge same-identity entries deterministically (last wins by sort
  // order). That's lenient on purpose — `validate()` is the gate.
  const preByIdentity = new globalThis.Map<string, PreRecord>();
  /** identity → defaults object on that identity's collection record. */
  const collectionDefaults = new globalThis.Map<string, JsonObject>();
  /** identity → list of all sources for that identity. */
  const identitySources = new globalThis.Map<string, string[]>();

  // Sort for deterministic merging.
  files.sort((a, b) => a.rel.localeCompare(b.rel));

  for (const f of files) {
    if (sidecarRels.has(f.rel)) continue; // sidecars don't define identity
    const id = f.ident.identity;
    const opaque = f.ext !== 'json';
    const collection = collectionOf(id, f.ident.folderForm);

    const sources = identitySources.get(id) ?? [];
    sources.push(f.rel);
    identitySources.set(id, sources);

    let content: JsonObject = {};
    if (!opaque) {
      content = await readJsonObject(f.abs);
    }
    const sidecarRel = sidecarFor.get(f.rel);
    if (sidecarRel) {
      const sidecarAbs = path.join(contentRoot, sidecarRel);
      const sidecarObj = await readJsonObject(sidecarAbs);
      content = mergeSidecar(content, sidecarObj);
      sources.push(sidecarRel);
    }

    const existing = preByIdentity.get(id);
    const data = existing ? mergeSidecar(existing.data, content) : content;
    preByIdentity.set(id, {
      identity: id,
      data,
      sources,
      opaque: existing ? existing.opaque && opaque : opaque,
      collection,
    });

    // If this record IS a collection record, capture `defaults` for cascade.
    if (f.ident.folderForm && !opaque && isJsonObject(content['defaults'])) {
      collectionDefaults.set(id, content['defaults'] as JsonObject);
    }
  }

  // -------- Pass 3: cascade fill (§12.3) ----------------------------------
  // For each record, the cascade chain is root → parent collection, EXCLUDING
  // the record's own collection record when the record IS that collection
  // record (a collection's `defaults` apply to descendants, not itself).
  const cascaded = new globalThis.Map<string, JsonObject>();
  for (const [id, pre] of preByIdentity) {
    const chain = buildCascadeChain(id, pre, collectionDefaults);
    cascaded.set(id, applyCascade(pre.data, chain, cascadingKeys));
  }

  // -------- Pass 4: resolve refs (§11.4) ----------------------------------
  const resolved = new globalThis.Map<string, MosaicRecord>();
  for (const [id, data] of cascaded) {
    const pre = preByIdentity.get(id)!;
    const resolvedData = resolveRefs(data, pre.collection, cascaded, {
      warnings,
      sourcePath: pre.sources[0] ?? id,
      keepDangling,
    });
    resolved.set(id, {
      identity: id,
      data: resolvedData,
      sources: pre.sources,
      opaque: pre.opaque,
    });
  }

  // -------- Build collections view ----------------------------------------
  const collections = buildCollectionsView(
    preByIdentity,
    collectionDefaults,
  );

  return {
    rootPath: absRoot,
    manifest,
    records: resolved,
    collections,
    warnings,
  };
}

// =========================================================================
// Helpers
// =========================================================================

async function readManifest(absRoot: string): Promise<Manifest | null> {
  const p = path.join(absRoot, 'mosaic.json');
  try {
    const raw = await fs.readFile(p, 'utf8');
    const parsed = JSON.parse(raw);
    if (!isJsonObject(parsed)) {
      // Manifest must be an object; mirror validate.py's lenient stance and
      // return null, but surface this via validate() — not here.
      return null;
    }
    return { raw: parsed };
  } catch {
    return null;
  }
}

/**
 * Walk a directory tree and emit every conforming file with its parsed
 * §7 identity bits. Hidden entries (§7.2) and the root `mosaic.json`
 * manifest are skipped. Files with §7 name violations are skipped here;
 * `validate()` is responsible for flagging them.
 */
async function walk(root: string): Promise<FileEntry[]> {
  const out: FileEntry[] = [];
  async function recurse(absDir: string, relParts: string[]): Promise<void> {
    let entries;
    try {
      entries = await fs.readdir(absDir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const ent of entries) {
      const name = ent.name;
      const childParts = [...relParts, name];
      if (isHidden(childParts)) continue;
      const abs = path.join(absDir, name);
      if (ent.isDirectory()) {
        await recurse(abs, childParts);
        continue;
      }
      if (!ent.isFile()) continue;
      // Skip the root manifest — `readManifest` handles it.
      if (childParts.length === 1 && name === 'mosaic.json') continue;
      const { base, modifiers, ext, err } = splitName(name);
      if (err) continue; // non-conforming; validate() will flag
      const ident = identityOf(childParts);
      out.push({
        rel: childParts.join('/'),
        parts: childParts,
        abs,
        base,
        modifiers,
        ext,
        ident,
      });
    }
  }
  await recurse(root, []);
  return out;
}

async function readJsonObject(abs: string): Promise<JsonObject> {
  const raw = await fs.readFile(abs, 'utf8');
  const parsed = JSON.parse(raw);
  if (!isJsonObject(parsed)) {
    throw new Error(`expected top-level JSON object in ${abs}`);
  }
  return parsed;
}

function isJsonObject(v: unknown): v is JsonObject {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/**
 * The collection identity a record sits in.
 *
 * - For file-form record `team/ada` → collection `team`.
 * - For folder-form record `team` (i.e. `team/index.json`), the record IS the
 *   collection record; its "containing" collection (from the cascade's view)
 *   is its parent, `""` (root).
 */
function collectionOf(identity: string, folderForm: boolean): string {
  if (identity === '') return '';
  if (folderForm) {
    const slash = identity.lastIndexOf('/');
    return slash === -1 ? '' : identity.slice(0, slash);
  }
  const slash = identity.lastIndexOf('/');
  return slash === -1 ? '' : identity.slice(0, slash);
}

/**
 * Build the §12.3 cascade chain for a record.
 *
 * Chain = ordered defaults objects, root → record's parent collection.
 * A collection record's OWN defaults are NOT in its own chain (defaults
 * apply to descendants, not to self).
 */
function buildCascadeChain(
  identity: string,
  pre: PreRecord,
  collectionDefaults: globalThis.Map<string, JsonObject>,
): JsonObject[] {
  const chain: JsonObject[] = [];
  // Walk from root down to `pre.collection`.
  const segs = pre.collection ? pre.collection.split('/') : [];
  const partial: string[] = [];
  // Root collection record defaults (identity `""`).
  const rootDefaults = collectionDefaults.get('');
  if (rootDefaults && identity !== '') chain.push(rootDefaults);
  for (const seg of segs) {
    partial.push(seg);
    const id = partial.join('/');
    if (id === identity) break; // never include self
    const d = collectionDefaults.get(id);
    if (d) chain.push(d);
  }
  return chain;
}

interface ResolveCtx {
  warnings: ValidationMessage[];
  sourcePath: string;
  keepDangling: boolean;
}

/**
 * Walk a JSON value and resolve every `ref:` string against the cascaded
 * record map. Returns a fresh structure; the input is not mutated.
 *
 * - Refs to missing identities → §11.6 warning. Replaced with `null` unless
 *   {@link ReadOptions.keepDangling} is true.
 * - `\ref:…` → unescaped to literal `ref:…`.
 * - §11.7 violations → warning, original value preserved.
 */
function resolveRefs(
  value: Json,
  referrerCollection: string,
  records: globalThis.Map<string, JsonObject>,
  ctx: ResolveCtx,
): Json {
  if (typeof value === 'string') {
    if (isRefString(value)) {
      try {
        const ref = parseRef(value);
        const targetId = resolveIdentity(ref, referrerCollection);
        const target = records.get(targetId);
        if (target === undefined) {
          ctx.warnings.push({
            path: ctx.sourcePath,
            message: `dangling reference '${value}' → identity '${targetId}' not found (§11.6).`,
          });
          return ctx.keepDangling ? value : null;
        }
        if (ref.pointer === null) {
          // §11.4 clause 3: yield the whole resolved target. We have already
          // resolved refs in target during pass 4 because all records were
          // pre-cascaded; but target may itself contain refs that haven't
          // been processed yet (iteration order). To stay pure (§11.4 says
          // resolution is order-independent), we recurse into target here.
          // This is a one-step recursion — cycles are allowed (§02 says refs
          // are free of cycle prohibition); guarded by `seen` below.
          return target as Json;
        }
        const pointed = evaluatePointer(target as Json, ref.pointer);
        if (pointed === undefined) {
          ctx.warnings.push({
            path: ctx.sourcePath,
            message: `JSON Pointer '#${ref.pointer}' in '${value}' did not resolve.`,
          });
          return null;
        }
        return pointed;
      } catch (err) {
        ctx.warnings.push({
          path: ctx.sourcePath,
          message: `bad reference '${value}': ${(err as Error).message}`,
        });
        return value;
      }
    }
    if (isEscapedRefString(value)) return unescapeRef(value);
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((v) => resolveRefs(v, referrerCollection, records, ctx));
  }
  if (value !== null && typeof value === 'object') {
    const out: JsonObject = {};
    for (const k of Object.keys(value)) {
      out[k] = resolveRefs(
        (value as JsonObject)[k] as Json,
        referrerCollection,
        records,
        ctx,
      );
    }
    return out;
  }
  return value;
}

/** Build a basic collections view derived from the discovered identities. */
function buildCollectionsView(
  records: globalThis.Map<string, PreRecord>,
  collectionDefaults: globalThis.Map<string, JsonObject>,
): globalThis.Map<string, Collection> {
  // A collection exists if any identity sits "inside" it; the collection
  // record itself is optional. We enumerate by deriving parents.
  const collIds = new globalThis.Set<string>();
  collIds.add('');
  for (const id of records.keys()) {
    const segs = id.split('/');
    for (let i = 0; i < segs.length; i++) {
      collIds.add(segs.slice(0, i).join('/'));
    }
  }

  const out = new globalThis.Map<string, Collection>();
  for (const cid of collIds) {
    const members: string[] = [];
    const children: string[] = [];
    for (const id of records.keys()) {
      if (id === '') continue;
      const segs = id.split('/');
      const parent = segs.slice(0, -1).join('/');
      if (parent === cid && id !== cid) members.push(id);
    }
    for (const oid of collIds) {
      if (oid === cid) continue;
      const segs = oid.split('/');
      const parent = segs.slice(0, -1).join('/');
      if (parent === cid && oid !== '') children.push(oid);
    }
    members.sort();
    children.sort();
    out.set(cid, {
      identity: cid,
      members,
      children,
      defaults: collectionDefaults.get(cid) ?? null,
    });
  }
  return out;
}
