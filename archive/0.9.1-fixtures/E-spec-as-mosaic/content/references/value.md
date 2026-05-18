# §11.2 Reference value

A **reference** is a JSON string of the form:

```
ref:<identity>[#<json-pointer>]
```

1. The string MUST begin with the sentinel `ref:`.
2. `<identity>` MUST be a record identity as defined in §7.1
   (`ref:format/naming`). It is the path-derived, form-independent name of
   the target — never a file path, file name, array index, or position.
3. `<json-pointer>`, if present, MUST be a JSON Pointer (RFC 6901) evaluated
   against the *resolved* target record (`ref:references/resolution`).
4. A reference MUST NOT contain any expression, wildcard, predicate, or
   axis. The grammar is exactly: sentinel, identity, optional JSON Pointer.
   Nothing else is permitted (`ref:references/hard-ceiling`).

A consumer MUST treat a string beginning with `ref:` as a reference. A
literal string value that must begin with the characters `ref:` MUST be
escaped as `\ref:`. A leading `\` is treated as an escape **only** when it
immediately precedes the literal token `ref:` at the start of a string
value, in which case the stored value is the string with that one backslash
removed; in every other position `\` is an ordinary character and MUST be
preserved verbatim (consistent with the §9 unknown-field round-trip
guarantee at `ref:format/unknown-fields`).
