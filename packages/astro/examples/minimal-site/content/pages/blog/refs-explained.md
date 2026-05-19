A reference is a JSON string that starts with the four characters "ref:". The rest is the identity of another record.

Three forms cover everything:

ref:team/ada — absolute. Resolved from the root, regardless of where this post lives in the tree.

ref:./other — relative. Resolved against the folder this record is in. Useful for keeping intra-folder links survivable when the whole folder gets moved as a unit.

ref:/team/ada#/name — an RFC 6901 JSON Pointer after the hash. Resolves to a value inside the target record — the string "Ada Lovelace" instead of the whole person object.

That is the entire grammar. No wildcards. No predicates. No expressions. The spec calls this the hard ceiling — it is the line that keeps Mosaic from re-deriving XPath.
