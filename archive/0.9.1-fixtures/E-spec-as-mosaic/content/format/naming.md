# §7. Naming and Identity (Rule 3)

Every record name MUST match:

```
name[.modifier]*.ext
```

1. **`name`** — the local identifier. MUST consist only of lowercase ASCII
   letters, digits, and hyphen (`-`), and MUST NOT begin with `_` or `.`.
2. **`.modifier`** — zero or more variant selectors (e.g. a language tag).
   Their meaning is defined by the consumer or a profile; the base format
   only reserves the slot and its syntax.
3. **`.ext`** — the content extension.
4. All path segments MUST be UTF-8 and MUST be lowercase.

## §7.1 Identity

A record's **identity** is its path from the root, normalized in order:
remove the trailing `.ext`, remove all `.modifier` segments, remove a
trailing `/index` segment. Therefore `about.json`, `about.fr.json`, and
`about/index.json` all resolve to the same identity `about`.

Folder form is REQUIRED only when the record must contain nested members.
A single identity reachable as **both** a file form and a folder form is an
error.

## §7.2 Reserved Names

`index` is reserved (`ref:format/collections`). `mosaic.json` at the root is
the manifest. Any name beginning with `_` or `.` is hidden/consumer-private
and MUST be ignored by conforming consumers when enumerating records.

## §7.3 Permitted Extensions

`.json` (structured) and `.md` (opaque text) are defined here. Any other
extension is permitted as opaque content and MUST carry its structured
metadata, if any, in a sidecar.
