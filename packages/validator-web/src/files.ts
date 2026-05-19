/**
 * Browser-side File API → flat rel-path map.
 *
 * Two input shapes are supported:
 *
 *   - DataTransferItemList from a drag-and-drop event (the user dragging
 *     a folder onto the drop zone). We walk it via
 *     `webkitGetAsEntry()` recursively. This is the only way to get
 *     directory contents on Chrome/Edge/Safari/Firefox today; the newer
 *     `FileSystemHandle` API isn't drop-friendly across browsers yet.
 *
 *   - FileList from `<input type="file" webkitdirectory>` for the
 *     keyboard-friendly fallback. Each File carries a
 *     `webkitRelativePath` we can use directly.
 *
 * Both shapes produce a `Map<relPath, text>` with the top-level folder
 * name stripped, so `pages/about.json` becomes the key — matching how the
 * Node validator sees the same tree.
 */

/** Result of {@link readDataTransfer} / {@link readFileList}. */
export interface ReadResult {
  /** rel-path → UTF-8 text. */
  files: globalThis.Map<string, string>;
  /** The original folder name the user dropped, if available. */
  rootName: string;
  /** Files we couldn't decode (binary, too large, or read error). */
  skipped: string[];
}

const MAX_BYTES = 2 * 1024 * 1024; // 2 MB per file — text-only validator.

async function readFileText(file: File): Promise<string | null> {
  if (file.size > MAX_BYTES) return null;
  try {
    return await file.text();
  } catch {
    return null;
  }
}

interface WebkitEntry {
  isFile: boolean;
  isDirectory: boolean;
  name: string;
  fullPath: string;
  file?: (cb: (file: File) => void, errCb: (err: unknown) => void) => void;
  createReader?: () => WebkitDirReader;
}
interface WebkitDirReader {
  readEntries: (
    cb: (entries: WebkitEntry[]) => void,
    errCb: (err: unknown) => void,
  ) => void;
}

function entryFile(entry: WebkitEntry): Promise<File | null> {
  return new Promise((resolve) => {
    if (!entry.file) return resolve(null);
    entry.file(
      (f) => resolve(f),
      () => resolve(null),
    );
  });
}

function readDir(entry: WebkitEntry): Promise<WebkitEntry[]> {
  return new Promise((resolve) => {
    if (!entry.createReader) return resolve([]);
    const reader = entry.createReader();
    const all: WebkitEntry[] = [];
    function next(): void {
      reader.readEntries(
        (entries) => {
          if (entries.length === 0) {
            resolve(all);
            return;
          }
          all.push(...entries);
          next();
        },
        () => resolve(all),
      );
    }
    next();
  });
}

async function walkEntry(
  entry: WebkitEntry,
  prefix: string[],
  files: globalThis.Map<string, string>,
  skipped: string[],
): Promise<void> {
  if (entry.isFile) {
    const f = await entryFile(entry);
    if (!f) {
      skipped.push([...prefix, entry.name].join('/'));
      return;
    }
    const text = await readFileText(f);
    const rel = [...prefix, entry.name].join('/');
    if (text === null) skipped.push(rel);
    else files.set(rel, text);
    return;
  }
  if (entry.isDirectory) {
    const children = await readDir(entry);
    for (const c of children) {
      await walkEntry(c, [...prefix, entry.name], files, skipped);
    }
  }
}

/**
 * Read a `DataTransferItemList` (from a drag-and-drop event) into a
 * rel-path → text map. The top-level folder name is stripped so paths
 * match what the Node validator sees.
 */
export async function readDataTransfer(
  items: DataTransferItemList,
): Promise<ReadResult> {
  const files = new globalThis.Map<string, string>();
  const skipped: string[] = [];
  let rootName = '';
  // Collect top-level entries first so we can strip the folder name.
  const roots: WebkitEntry[] = [];
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    if (!it) continue;
    const entry =
      typeof (it as unknown as { webkitGetAsEntry?: () => WebkitEntry })
        .webkitGetAsEntry === 'function'
        ? (it as unknown as { webkitGetAsEntry: () => WebkitEntry }).webkitGetAsEntry()
        : null;
    if (entry) roots.push(entry);
  }
  if (roots.length === 1 && roots[0]!.isDirectory) {
    rootName = roots[0]!.name;
    // Walk children directly so we drop the top folder.
    const children = await readDir(roots[0]!);
    for (const c of children) {
      await walkEntry(c, [], files, skipped);
    }
  } else {
    for (const r of roots) {
      await walkEntry(r, [], files, skipped);
    }
  }
  return { files, rootName, skipped };
}

/**
 * Read a `FileList` from `<input type="file" webkitdirectory>` into a
 * rel-path → text map.
 */
export async function readFileList(list: FileList): Promise<ReadResult> {
  const files = new globalThis.Map<string, string>();
  const skipped: string[] = [];
  let rootName = '';
  for (let i = 0; i < list.length; i++) {
    const f = list.item(i);
    if (!f) continue;
    const rel =
      (f as File & { webkitRelativePath?: string }).webkitRelativePath ?? f.name;
    if (!rootName) {
      const slash = rel.indexOf('/');
      if (slash > 0) rootName = rel.slice(0, slash);
    }
    const stripped = rootName && rel.startsWith(rootName + '/')
      ? rel.slice(rootName.length + 1)
      : rel;
    const text = await readFileText(f);
    if (text === null) skipped.push(stripped);
    else files.set(stripped, text);
  }
  return { files, rootName, skipped };
}
