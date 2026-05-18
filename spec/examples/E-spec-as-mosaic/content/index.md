# Mosaic Base Format Specification

This folder *is* the spec, stored in the format it describes.

Mosaic is a convention for using an ordinary directory tree as a structured
content store. It defines what a *Mosaic folder* is and nothing more. It does
not define queries, routing, rendering, transport, or storage engines. A
conforming Mosaic folder is readable with nothing but a filesystem and a JSON
parser.

This document is deliberately small: three structural rules plus naming
constraints. Sidecars (§8) and unknown-field preservation (§9) follow from
those rules. References (§11) and cascade (§12) are defined as a companion
document because they describe how records *relate*, not what records *are*.

## Read order

1. `format/` — the three structural rules and their consequences (§1–§10)
2. `references/` — content references and their resolution (§11)
3. `cascade/` — the minimal inheritance mechanism (§12)
4. `decisions/` — the five forks resolved on 2026-05-17

## Meta-note

The very folder you are reading was generated to prove a point: if the spec
cannot describe its own document shape, the spec is incomplete. This folder
validates as a conforming Mosaic — see `EXPECTED.md` for the resolved-records
listing and the one intentional warning.
