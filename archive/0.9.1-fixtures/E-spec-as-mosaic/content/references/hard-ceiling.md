# §11.7 Hard ceiling

The following are permanently **out of scope** and a conforming consumer
MUST reject them rather than interpret them:

- Path expressions, wildcards, globs, or predicates in an identity.
- Selectors other than a single RFC 6901 JSON Pointer.
- References that resolve by querying record *contents* (e.g. "the person
  whose `email` is X"). Such lookups are a consumer concern, never a format
  primitive.

This ceiling is the line that keeps Mosaic from re-deriving XPath.
