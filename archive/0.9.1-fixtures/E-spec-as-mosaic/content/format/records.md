# §5. Records (Rule 1)

A **record** is a content file together with OPTIONAL structured metadata.

1. The content file MAY be of any type. A `.json` file is *structured
   content*: the format reads its keys, and it is the degenerate case where
   the metadata *is* the content.
2. Any non-`.json` file is *opaque content*. Consumers MUST NOT attempt to
   interpret opaque content as structured data.
3. Structured metadata for an opaque content file, if any, is carried by a
   sidecar (`ref:format/sidecars`). JSON is the single source of truth for
   structured fields.
4. A consumer MAY derive convenience values from opaque content (for
   example, a display title from a Markdown file's first heading). Such
   derived values MUST NOT override explicit JSON fields and are not part of
   this format.
5. A consumer that does not understand a record's content type MUST still
   be able to address the record and read its sidecar metadata.

## §5.1 Markdown frontmatter

The base format assigns **no meaning** to frontmatter (a leading `---` block)
in Markdown content. A conforming consumer MUST NOT interpret frontmatter as
record metadata; it is inert text. Writers SHOULD NOT emit frontmatter;
structured fields belong in a JSON sidecar.
