# §12.5 Resolution order (normative)

For any record, the effective JSON is computed in exactly this order, once:

```
1. content (.json) or empty object for opaque records
2. + sidecar merge            (§8, shallow, sidecar wins)
3. + cascade fill             (§12.3, only for `locale` or declared keys,
                               only if absent)
4. references resolved        (§11.4, against the result of step 3)
```

No step may be re-entered. This fixed pipeline is what keeps resolution
predictable and prevents the spec from growing an evaluator.

See `ref:format/sidecars`, `ref:cascade/minimal-definition`, and
`ref:references/resolution` for the rules feeding each step.
