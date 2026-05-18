# G — Name violations (intentionally non-conforming)

Fixture for the Phase 2 validator fix: prove that names violating §7 are
rejected with explicit errors, not silently accepted.

## Expected validator output

```
RESOLVED RECORDS
  ok-control            <- ok-control.json

ERRORS (4)
  [ERR ] BAD-CAPS.json — invalid record name 'BAD-CAPS' (§7)
  [ERR ] has.bad-modifier.UPPER.md — invalid modifier '.UPPER' (§7)
  [ERR ] noext — missing extension; §7.3 requires .ext
  [ERR ] with_underscore.json — invalid record name 'with_underscore' (§7)

RESULT: FAIL  (4 errors, 0 warnings)
```

## What this fixture covers

- **No-extension files** (§7.3): `noext` has no `.ext`.
- **Uppercase in base** (§7): `BAD-CAPS.json`.
- **Underscore in base** (§7): `with_underscore.json` (`_` is not in the
  base charset; `_`-prefixed names are *hidden* per §7.2 and `_` is not
  allowed elsewhere either).
- **Uppercase in modifier** (§7): `has.bad-modifier.UPPER.md` — `UPPER`
  fails the modifier charset.
- **Control** (`ok-control.json`) resolves cleanly to identity `ok-control`,
  proving the validator surfaces valid records alongside errors.
