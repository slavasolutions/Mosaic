# Mosaic Spec Changelog

## 0.9.4 (2026-05-19) — adapter ecosystem

Adapters are now first-class in the spec text. Filesystem, S3-compatible object storage, and (planned) git and in-memory backends all conform to the same pipeline contract.

### Added

- **Base format §10 — Adapters (informative).** Defines what makes a consumer a conforming adapter: produce a resolved record tree (`(identity, modifier-set) → Record`) from any backing store while honouring §§5–9. Two reference adapters in the wild today — filesystem (`readFolder`) and S3-compatible object storage (`readBucket`) — share a single `runPipeline` and are interchangeable on every spec fixture. Spec doesn't constrain how an adapter fetches bytes, only what shape it produces.

### Changed

- **Spec headers bumped 0.9.2 → 0.9.4 across `format/01-format.md`, `format/02-references.md`, `profiles/mosaic-web.md`, and `profiles/mosaic-design-tokens.md`.** Includes all 0.9.3 spec work (body field §5.2, sidecar precedence §8.1, mosaic-web meta clause §7, JSON-LD strip rule, SEO + migration explainers, ADRs 0001/0002/0003) plus the new §10 Adapters clause.
- **§11 Out of Scope** was previously §10; renumbered to make room for §10 Adapters.

---

## 0.9.3 (2026-05-19) — body field, meta tags, adopter explainers

Pulls in the format-level `body` field, the mosaic-web meta clause, and the first non-normative explainers (SEO + migration). Three ADRs land alongside.

### Added

- **`profiles/mosaic-web-migration.md` — migration explainer (non-normative).** Pointer doc for adopters moving an existing site (HTML/CMS/SSG/JSX) into Mosaic. Covers HTML bodies (cross-refs ADR 0001 + §5.2), external assets in R2/S3/CDN, block composition (cross-refs ADR 0002), tokens via the design-tokens profile, repeated content via snippets, the `@ssolu/mosaic-migrate` scanner, and explicit non-goals. Cross-linked from `README.md`, `spec/README.md`, and `mosaic-web-seo.md` §1.
- **ADR 0001 — body-format agnosticism.** New `docs/adr/0001-body-format-agnosticism.md` records the decision behind §5.2 + SEO explainer §1: `body` is opaque UTF-8, dispatch is adapter-defined, optional `bodyFormat` discriminator allowed but never required. Cross-linked from `spec/format/01-format.md` §5.2 and `spec/profiles/mosaic-web-seo.md` §1.
- **ADR 0002 — block composition via section refs.** New `docs/adr/0002-block-composition.md` codifies the canonical pattern: each block = its own record under `/snippets/`, page holds an ordered `sections: [ref:…, ref:…]` array, adapter renders each section by `@type`. No spec change — pattern works today with records + refs + cascade + variants. Cross-linked from `spec/profiles/mosaic-web.md` §6 (where the nested-graph remark already lived).
- **Base format §5.2 — the `body` field.** Codifies what §5 already implied: when a record's opaque content file is text (extensions `{.md, .txt, .html, .adoc}`, profile-extensible), a consumer MAY expose its UTF-8 bytes on the merged Record under the reserved field name `body`. Binary payloads (`.pdf`, `.png`, `.csv`, …) MUST NOT populate `body`. Pure-JSON records have no `body`. Variants pair body per `(identity, modifier-set)`. The bytes inside `body` are format-agnostic (markdown, HTML, plaintext, etc.) — the base format assigns them no meaning. Reference reader exports the recognised set as `TEXT_BODY_EXTENSIONS`.
- **Base format §8.1 — sidecar precedence over `body`.** A sidecar's explicit top-level `body` literal MUST override the bytes that would otherwise be read from the paired text content file. Consistent with §8.2 (sidecar wins on collision) applied to the reserved field.
- **mosaic-web §6 — strip `body` from JSON-LD output.** Renderers MUST strip the Mosaic-internal `body` field from JSON-LD blocks; they MAY map it to a schema.org `articleBody`/`text` property when appropriate.
- **`profiles/mosaic-web-seo.md` — SEO explainer (non-normative).** New companion to `mosaic-web.md`. Walks through what the format gives crawlers for free, how §6 JSON-LD and §7 meta tags combine, canonical URLs and locale variants, sitemap synthesis from §3, the static-output advantage, and explicit non-goals. Cross-linked from `README.md`, `spec/README.md`, and `mosaic-web.md` §1.
- **mosaic-web §7 — HTML meta tags (RECOMMENDED).** New normative clause covering page-level `<meta>` / OpenGraph / Twitter Card emission. Reserves the record field name `meta` with sub-fields `description`, `robots`, `canonical`, and nested `og.*` / `twitter.*` groups. Same RECOMMENDED posture as §6 Schema.org: consumers MAY emit or omit and still conform. Includes sensible-defaults guidance (§7.1, informative), a worked `BlogPosting` example (§7.2), and an explicit independence rule against §6 JSON-LD (§7.3).
- **D-web fixture exercises §7 end-to-end.** `pages/index.json` (new home record), `pages/about.json`, `pages/blog/hello.json`, plus a new French sidecar variant `pages/blog/hello.fr.json` now carry `meta` blocks demonstrating OpenGraph, Twitter Card, canonical, robots, and per-variant locale switching.

### Changed

- **Resolution pipeline diagram (§1.2) includes body extraction.** The pipeline gains an explicit body-from-text-payload step between content load and sidecar merge. Order is now: content → body → sidecar merge → cascade → refs. Documents what the reference reader has been doing post-#12.
- **Appendix B summary references §5.2.** "Sidecars (§8), the `body` field (§5.2), and unknown-field preservation (§9) follow from these three."
- **mosaic-web profile renumbered.** Old §7 (out of scope) → §8. Old §8 (relationship to base) → §9. Old §9 (status) → §10. Internal §10 cross-ref to deferred-items section updated. §6 gains a forward-pointer to §7 noting the two surfaces are complementary, plus an explicit rule that the `meta` field MUST be stripped from JSON-LD output.

## 0.9.2 (2026-05-18) — clean cut

A subtractive release. Same rules as 0.9.1; smaller repository.

### What changed

- **Reorganised root.** Old session artefacts (`HANDOFF.md`, `STATE.md`, `STATE.html`, `VIEWER.html`, `REVIEW-BUNDLE.md`), pre-0.9 example sites (`examples/{astro-test, complex-site, hromada-community, minimal-site, v0.9}/`), and legacy top-level directories (`tools/`, `skills/`, `tests/`, `docs/`) moved into an archive that was then **relocated outside this repository** to the sibling folder `../mosaic-archive/`. The main worktree contains only forward-looking material; every relocated path is also recoverable from git history.
- **Reference validator renamed and repositioned.** Moved from `apps/folderdb/validate.py` to `spec/tools/validate.py`. It is now framed as the spec's executable companion, not as a seed for a separate product.
- **Removed the `apps/` directory entirely.** Any browser / editor / packaged-binary work belongs in its own repository going forward.
- **Lighter fixture set.** Spec examples shrunk from seven to four — `A-identity`, `B-sidecars`, `C-cascade`, `D-web`. The three heavier fixtures (`E-spec-as-mosaic`, `F-opaque-payloads`, `G-name-violations`) are preserved in the sibling `../mosaic-archive/0.9.1-fixtures/` folder and can be restored when a consumer needs them.
- **Rolled back the 0.9.1 Phase 5 profile mechanism clauses.** §5.2 (profile extraction rule) and §7.2 (profile-visible directory carve-out) are NOT part of 0.9.2. They will return when the first concrete profile lands and demands them. The `profiles/claude-code.md` draft is preserved in the `0.9.1-spec` git branch history; it is not in 0.9.2.

### What did NOT change

- The base format rules — §§5, 6, 7, 7.1, 7.2 (the three-bullet hidden-name rule, no carve-out), 7.3, 8, 9.
- The reference grammar (§11) and cascade (§12).
- The five locked decisions in `format/DECISIONS-locked.md`.
- The validator behaviour — same output, same fixtures pass/fail to the same counts.

### Where to find earlier work

The `0.9.1-spec` git branch has the full hardening pass (Phases 1–5), including the profile-mechanism additions, the spec-as-Mosaic dogfood, the Claude Code profile draft, and the opaque-payload / name-violation fixtures. Nothing is lost — just not loaded by default in 0.9.2.

The `0.9.1-folderdb-app` git branch has the in-progress FolderDB browser app (web + PWA + partial Tauri wrap). Stays available as a starting point for a separate FolderDB repository if and when that work resumes.

## 0.9.1 (2026-05-17/18) — format lock + hardening pass

See the `0.9.1-spec` git branch for full detail. Five-phase hardening: cascade-scope contradiction resolved, validator implemented §7 directly, `\ref:` escape pinned in §11.2, spec-as-Mosaic dogfood, README pain-first rewrite, profile-mechanism clauses (rolled back in 0.9.2).

## 0.9 (earlier 2026-05) — realignment

Pre-rewrite. See `../mosaic-archive/0.9-old-mips/` (sibling folder) for the 14 MIPs and `../mosaic-archive/0.9-old-spec.md` for the 0.8.x-style monolithic spec that fed into the 0.9.1 lock. Also recoverable from git history.

## 0.8.1 and earlier

See `../mosaic-archive/0.8.1/` for snapshots.
