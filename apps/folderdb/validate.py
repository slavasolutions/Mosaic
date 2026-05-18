#!/usr/bin/env python3
"""
Mosaic Format Validator (base format, spec v0.9 draft).

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
    """Return (base, modifiers, ext). 'about.fr.md' -> ('about', ['fr'], 'md')."""
    parts = filename.split(".")
    if len(parts) < 2:
        return parts[0], [], ""
    ext = parts[-1]
    base = parts[0]
    modifiers = parts[1:-1]
    return base, modifiers, ext


def is_hidden(rel_parts):
    """Any path segment beginning with _ or . is hidden/ignored (spec §7.2)."""
    return any(seg.startswith("_") or seg.startswith(".") for seg in rel_parts)


def identity_of(rel_path):
    """
    Compute record identity per spec §7.1:
    strip ext, strip modifiers, strip trailing /index.
    """
    parts = list(rel_path.parts)
    base, _mods, _ext = split_name(parts[-1])
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
        base, mods, ext = split_name(p.name)
        files.append((rel, p, base, mods, ext))

    # Pass 2: per-file checks (naming, encoding, json, frontmatter).
    by_dir = {}  # dir -> list of (rel,p,base,mods,ext)
    for rel, p, base, mods, ext in files:
        # UTF-8 + lowercase + name charset (spec §7)
        if p.name != p.name.lower():
            rep.error(rel, f"name must be lowercase: '{p.name}'")
        if not NAME_RE.match(base):
            rep.error(rel, f"invalid record name '{base}' (lowercase a-z 0-9 - only)")
        for m in mods:
            if not NAME_RE.match(m):
                rep.error(rel, f"invalid modifier '.{m}' in '{p.name}'")

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
    for rel, p, base, mods, ext in files:
        if rel in sidecar_paths:
            continue  # sidecars don't define their own identity
        ident = identity_of(rel)
        rep.records.setdefault(ident, []).append(rel)

    for ident, srcs in sorted(rep.records.items()):
        # Strip pure-variant duplicates (same identity via modifiers is allowed).
        forms = set()
        for s in srcs:
            base, mods, ext = split_name(s.name)
            is_folder_form = s.name.startswith("index.")
            forms.add(("folder" if is_folder_form else "file", s.parent))
        # Collision = same identity reachable as BOTH a file form and a folder
        # form (e.g. about.json AND about/index.json).
        kinds = {f[0] for f in forms}
        if "file" in kinds and "folder" in kinds:
            rep.error(
                srcs[0].parent,
                f"ambiguous identity '{ident}': exists as both a file form and "
                f"a folder (index.*) form. Pick one.",
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
