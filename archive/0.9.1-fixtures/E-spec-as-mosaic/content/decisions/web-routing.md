# Decision 4 — web profile routing (LOCKED)

The base format never knows about routes. URLs are added by a separate
specification (Mosaic Web) that maps identity → URL using a configurable
root path (default `pages/`).

`pages/index.json` → `/`
`pages/about.json` → `/about` (file form — no folder required)
`pages/blog/index.json` → `/blog`

Records outside the configured root remain valid records but are simply
not routes.

See `ref:format/out-of-scope`. The Mosaic Web spec is not yet written; the
ref `ref:format/web-profile-stub` is intentionally DANGLING — it points at
a future record that does not exist, demonstrating the §11.6 warning
behaviour.
