# §12.2 Why it is dangerous

Cascade makes a record's effective value depend on its *position* in the tree
and on the *contents of its ancestors*. This is the hierarchical model's
original brittleness (the XPath problem) re-entering through a side door:

- Resolution is no longer local — you cannot understand a record by reading
  it.
- Moving a record can silently change its values.
- Unbounded cascade (any field, any depth, any merge) is indistinguishable
  from a small inheritance language.

The same XPath-pressure that §11.7 (`ref:references/hard-ceiling`) keeps out
of references applies to cascade: every loosening of the rules below is one
step closer to a re-derived query language.
