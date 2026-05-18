# §6. Collections (Rule 2)

A **collection** is a directory.

1. Any directory under the root is a collection. Collections MAY nest to any
   depth.
2. A file named `index` (with any permitted extension) within a directory
   represents that directory itself as a record — the **collection record**.
3. A collection MAY exist without a collection record. A collection record
   MAY exist without sibling members. Neither implies the other.
4. There is no reserved parent directory for collections; a collection is
   any directory, anywhere in the tree.
