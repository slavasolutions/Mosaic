# Decision 1 — identity forms (LOCKED)

File form (`about.json`) and folder form (`about/index.json`) are two
spellings of one identity. Converting between them is never a rename. Both
present at the same identity is the **one** validator error this rule
introduces.

A folder is never itself a record; `team.json` next to `team/` is fine —
`team.json` describes the record `team`, and `team/` just holds its
children.

See `ref:format/naming` for the §7.1 identity computation and the collision
clause.
