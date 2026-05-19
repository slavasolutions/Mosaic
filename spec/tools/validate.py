#!/usr/bin/env python3
"""
Mosaic Format Validator (base format, spec v0.9.1 draft).

Implements only the base format: records, collections, naming/identity,
sidecars, hidden files, frontmatter (inert/warning), unknown-field preservation.
No web/refs/cascade/manifest semantics.

Usage:
    python3 validate.py <folder>
    python3 validate.py content/

Exit code 0 if no ERRORs, 1 if any ERROR found. WARNINGs do not fail.
Stdlib only. Python 3.8+.
"""

import json
import re
import sys
from pathlib import Path

# Base name + modifier charset, per spec §7: lowercase ascii, digits, hyphen.
NAME_RE = re.compile(r"^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$")
STRUCTURED_EXT = {"json"}
TEXT_EXT = {"md"}  # readable opaque; everything else is opaque too


class Report:
    def __init__(self):
        self.errors = []
        self.warnings = []
        self.records = {}  # identity -> list of source paths

    def error(self, path, msg):
        self.errors.append((str(path), msg))

    def warn(self, path, msg):
        self.warnings.append((str(path), msg))


def split_name(filename):
    """
    Split filename per §7 of 01-format.md.

    Returns (base, modifiers, ext, err). err is None when the name is valid;
    otherwise a string describing the §7 violation. When err is not None the
    returned (base, modifiers, ext) is best-effort and the file MUST be
    treated as non-conforming.

    Rules enforced (§7):
    - The extension is the FINAL dot-segment. Names with no dot are rejected
      because §7.3 requires .ext.
    - The base name is the FIRST dot-segment.
    - Modifiers are every dot-segment between base and ext.
    - The base and every modifier MUST match the §7 charset
      (lowercase a-z, digits, hyphen; not starting or ending with hyphen).
    """
    if "." not in filename:
        return filename, [], "", (
            f"missing extension; §7.3 requires .ext (got '{filename}')"
        )
    parts = filename.split(".")
    base = parts[0]
    ext = parts[-1]
    modifiers = parts[1:-1]
    if not NAME_RE.match(base):
        return base, modifiers, ext, (
            f"invalid record name '{base}' (§7: lowercase a-z 0-9 hyphen, "
            f"no leading/trailing hyphen)"
        )
    for m in modifiers:
        if not NAME_RE.match(m):
            return base, modifiers, ext, (
                f"invalid modifier '.{m}' in '{filename}' "
                f"(§7: same charset as base name)"
            )
    return base, modifiers, ext, None


def is_hidden(rel_parts):
    """Any path segment beginning with _ or . is hidden/ignored (spec §7.2)."""
    return any(seg.startswith("_") or seg.startswith(".") for seg in rel_parts)


def identity_of(rel_path):
    """
    Compute record identity per spec §7.1:
    strip ext, strip modifiers, strip trailing /index.
    """
    parts = list(rel_path.parts)
    base, _mods, _ext, _err = split_name(parts[-1])
    parts[-1] = base
    if parts[-1] == "index":
        parts = parts[:-1]
    return "/".join(parts) if parts else "(root)"


def has_frontmatter(text):
    return text.lstrip().startswith("---")


def validate(root: Path):
    rep = Report()
    root = root.resolve()
    if not root.is_dir():
        rep.error(root, "not a directory")
        return rep

    # Pass 1: collect every non-hidden file with its parsed name parts.
    files = []
    for p in sorted(root.rglob("*")):
        if not p.is_file():
            continue
        rel = p.relative_to(root)
        if is_hidden(rel.parts):
            continue  # spec §7.2: silently ignored, not an error
        if rel.parts == ("mosaic.json",):
            # Root manifest: preserved verbatim, contents out of scope.
            try:
                json.loads(p.read_text(encoding="utf-8"))
            except Exception as e:
                rep.error(rel, f"manifest mosaic.json is not valid JSON: {e}")
            continue
        base, mods, ext, name_err = split_name(p.name)
        files.append((rel, p, base, mods, ext, name_err))

    # Pass 2: per-file checks (naming, encoding, json, frontmatter).
    by_dir = {}  # dir -> list of (rel,p,base,mods,ext)
    conforming = []  # files that survived split_name
    for rel, p, base, mods, ext, name_err in files:
        if name_err:
            rep.error(rel, name_err)
            continue  # non-conforming filename: skip downstream checks

        # Whole-name lowercase check (catches uppercase EXT, which split_name
        # does not validate against the §7 charset — only base + modifiers do).
        if p.name != p.name.lower():
            rep.error(rel, f"name must be lowercase: '{p.name}'")

        if ext == "json":
            try:
                p.read_text(encoding="utf-8")
            except UnicodeDecodeError:
                rep.error(rel, "file is not valid UTF-8")
            try:
                json.loads(p.read_text(encoding="utf-8"))
            except json.JSONDecodeError as e:
                rep.error(rel, f"invalid JSON: {e}")
        elif ext == "md":
            try:
                txt = p.read_text(encoding="utf-8")
                if has_frontmatter(txt):
                    rep.warn(
                        rel,
                        "markdown frontmatter present; base format treats it as "
                        "inert text (not metadata). Folder remains valid.",
                    )
            except UnicodeDecodeError:
                rep.error(rel, "file is not valid UTF-8")
        # any other ext = opaque payload, no content check

        by_dir.setdefault(rel.parent, []).append((rel, p, base, mods, ext))
        conforming.append((rel, p, base, mods, ext))

    # Pass 3: sidecar matching + orphan modifier sidecars (spec §8).
    sidecar_paths = set()
    for d, entries in by_dir.items():
        content = [(r, b, m) for (r, p, b, m, e) in entries if e != "json"]
        for rel, p, base, mods, ext in entries:
            if ext != "json":
                continue
            key = (base, tuple(mods))
            content_keys = {(b, tuple(m)) for (r, b, m) in content}
            if key in content_keys:
                sidecar_paths.add(rel)  # valid sidecar
            elif mods and (base, ()) in content_keys:
                # has a base content sibling but modifier doesn't match anything
                rep.warn(
                    rel,
                    f"orphan modifier sidecar: '.{'.'.join(mods)}' has no "
                    f"matching content sibling for '{base}'.",
                )
            # else: standalone .json record (the degenerate structured case)

    # Pass 4: identity resolution + collision (spec §7.1).
    #
    # The §7.1 collision rule applies per (identity, modifier-set). Variants
    # that share an identity but carry different modifier-sets are separate
    # variants, not a collision. `about.json` + `about.fr/index.json` is two
    # variants; `about.json` + `about/index.json` is the same canonical
    # variant reached two ways → error.
    by_variant = {}  # (identity, sorted-modifier-tuple) -> [sources]
    for rel, p, base, mods, ext in conforming:
        if rel in sidecar_paths:
            continue  # sidecars don't define their own identity
        ident = identity_of(rel)
        rep.records.setdefault(ident, []).append(rel)
        mod_key = tuple(sorted(mods))
        by_variant.setdefault((ident, mod_key), []).append(rel)

    for (ident, mod_key), srcs in sorted(
        by_variant.items(), key=lambda kv: (kv[0][0], kv[0][1])
    ):
        forms = set()
        for s in srcs:
            is_folder_form = s.name.startswith("index.")
            forms.add(("folder" if is_folder_form else "file", s.parent))
        # Collision = same (identity, modifier-set) reachable as BOTH a file
        # form and a folder form (e.g. about.json AND about/index.json).
        kinds = {f[0] for f in forms}
        if "file" in kinds and "folder" in kinds:
            variant_note = "" if not mod_key else f" (modifier-set '{'.'.join(mod_key)}')"
            rep.error(
                srcs[0].parent,
                f"ambiguous identity '{ident}'{variant_note}: exists as both a "
                f"file form and a folder (index.*) form for the same "
                f"modifier-set. Pick one.",
            )

    return rep


def main():
    if len(sys.argv) != 2:
        print("usage: python3 validate.py <folder>")
        sys.exit(2)
    rep = validate(Path(sys.argv[1]))

    print("=" * 64)
    print("RESOLVED RECORDS")
    print("=" * 64)
    for ident, srcs in sorted(rep.records.items()):
        print(f"  {ident:<28} <- {', '.join(str(s) for s in srcs)}")

    if rep.warnings:
        print("\n" + "=" * 64)
        print(f"WARNINGS ({len(rep.warnings)})  — folder still conforms")
        print("=" * 64)
        for path, msg in rep.warnings:
            print(f"  [warn] {path}\n         {msg}")

    if rep.errors:
        print("\n" + "=" * 64)
        print(f"ERRORS ({len(rep.errors)})  — folder is NON-conforming")
        print("=" * 64)
        for path, msg in rep.errors:
            print(f"  [ERR ] {path}\n         {msg}")

    print("\n" + "-" * 64)
    if rep.errors:
        print(f"RESULT: FAIL  ({len(rep.errors)} error(s), "
              f"{len(rep.warnings)} warning(s))")
        sys.exit(1)
    print(f"RESULT: PASS  (0 errors, {len(rep.warnings)} warning(s))")
    sys.exit(0)


if __name__ == "__main__":
    main()
