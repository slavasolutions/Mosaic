# Decision 3 — variant sidecars (LOCKED: sparse)

A variant sidecar (e.g. `team.fr.json`) restates only the fields that differ
from the canonical sidecar (`team.json`). Unchanged fields fall back to the
canonical. This is not a new mechanism — it is cascade applied to the
sidecar axis. Resolution order stays the fixed pipeline at
`ref:cascade/resolution-order`.

See `ref:format/sidecars` for the matching rule.
