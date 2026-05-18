# §12.3 Minimal definition (proposed, rigid)

Cascade is restricted to a **single, explicit, opt-in mechanism**:

1. A collection record (`index.json` per §6, `ref:format/collections`) MAY
   contain a top-level object field named `defaults`.
2. For a record `R`, its **cascade chain** is the ordered list of collection
   records from the root down to `R`'s own collection.
3. A record's effective value for a key is resolved as: the record's own
   value if present; otherwise the nearest `defaults[key]` walking *up* the
   chain; otherwise absent.
4. Cascade is **shallow and key-level only**. It selects a whole value by
   key. It MUST NOT deep-merge objects or concatenate arrays. A present key
   on the record fully shadows all ancestor defaults for that key.
5. Cascade applies to (a) the single base-blessed key `locale`, and (b) any
   additional keys a profile or schema explicitly declares cascading. No
   other keys cascade. A key that is neither `locale` nor declared cascading
   is never inherited. There is no "cascade everything" mode.
6. References (`ref:references`) are resolved **after** cascade, against the
   effective record. A cascaded value MAY itself be a reference.
