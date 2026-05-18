# §11.6 Dangling references

A reference whose target identity does not resolve is **dangling**.

1. A dangling reference MUST NOT, by itself, make a folder non-conforming.
2. A conforming validator MUST report a dangling reference as a **warning**.
3. A consumer MAY treat a dangling reference as null, omit it, or surface
   it; the format does not prescribe behaviour, only that it is not an error.

Rationale: enforcement requires a process that watches every write. The
filesystem never guaranteed symlink validity and remained useful. Promising
integrity here would re-introduce the engine the format exists to avoid.
