This is the body of a Mosaic record. The structured metadata lives in hello.json (title, publishedAt, author). The prose you are reading is hello.md sitting next to it.

Notice the author field in the JSON sidecar — it is the string "ref:/team/ada". The base spec says any string starting with "ref:" is a reference to another record by its identity. When the Next adapter resolves this page, that ref expands into the full record at /team/ada — name, role, bio — and the byline you see at the top of this post is rendered from those resolved fields.

Move /team/ada.json anywhere in the tree. The ref still resolves. Rename the file from ada.json to ada/index.json. Same identity, same resolution. The filename is the contract.
