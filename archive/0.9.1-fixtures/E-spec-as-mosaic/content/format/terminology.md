# §3. Terminology

- **Root** — the top-level directory of a Mosaic folder.
- **Record** — the addressable unit of content (`ref:format/records`).
- **Collection** — a directory containing records and/or other collections
  (`ref:format/collections`).
- **Structured content** — a `.json` file, whose keys the format reads
  directly.
- **Opaque content** — any non-`.json` file (`.md`, `.pdf`, `.png`, …). The
  format does not parse it for fields; its bytes are the record's payload
  and its structured metadata, if any, comes from a sidecar.
- **Sidecar** — a JSON file supplying metadata for a sibling content file
  (`ref:format/sidecars`).
- **Identity** — the stable, path-derived name of a record
  (`ref:format/naming`).
- **Consumer** — any tool that reads a Mosaic folder.
- **Writer** — any tool that produces or modifies a Mosaic folder.
