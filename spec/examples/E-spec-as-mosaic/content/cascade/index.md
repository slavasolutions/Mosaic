# §12. Cascade

Cascade is the spec's most dangerous mechanism — it is what tempts a format
to grow an inheritance language. This section is deliberately scrutinised and
tightly restricted.

The base format blesses exactly one key as cascading by default: `locale`.
This single exception exists so every i18n-aware profile inherits the active
locale without having to re-declare it. All other cascading keys MUST be
declared by a profile or schema (`ref:cascade/minimal-definition`). There is
no other base-blessed key, and none will be added.
