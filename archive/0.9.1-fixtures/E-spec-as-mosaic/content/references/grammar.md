# §11.3 Identity grammar for references

`<identity>` is one of:

| Form | Meaning |
|------|---------|
| `team/ada` | **Absolute.** Resolved from the root, regardless of where the reference appears. |
| `./ada` or `../team/ada` | **Relative.** Resolved against the *collection* containing the referring record. |

There are exactly two anchor forms: absolute and relative. There is no third
("cascade") anchor form for references — see `ref:cascade/what-was-cut`.
Absolute is RECOMMENDED; relative is permitted for intra-collection links
that should survive the collection being moved as a whole.
