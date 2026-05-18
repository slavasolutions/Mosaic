# Decision 2 — cascade scope (LOCKED: PRAGMATIC)

The base format blesses exactly one key as cascading by default: `locale`.
All other cascading keys MUST be declared by a profile or schema. STRICT
(declare-everything) was rejected because forcing every i18n-aware profile
to re-declare `locale` was boilerplate with no upside.

See `ref:cascade/minimal-definition` (clause 5) and `ref:cascade/index` for
the normative restatement.
