# §12.4 What was cut (and why)

| Cut | Reason |
|-----|--------|
| Cascade as a reference *anchor* (`ref:foo` searching ancestors) | Two mechanisms doing one job. References are absolute/relative only (`ref:references/grammar`). Cascade is inheritance, not addressing. Keeping them separate is the rigidity win. |
| Deep merge / array concat | That is a merge language. Shallow key-level only. |
| Implicit "all fields cascade" | Action-at-a-distance with no opt-in. Only `locale` is base-blessed; all other cascading keys MUST be profile/schema-declared. |
| Sidecar participation in cascade | Sidecars override locally (`ref:format/sidecars`); mixing them into the chain creates a 2-axis resolution order. Sidecar first, then cascade — never interleaved. |
| Cascading into opaque content | Cascade is JSON-only; opaque payloads have no keys to inherit. |
