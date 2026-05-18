# §8. Sidecars

Sidecars follow from §5 and §7; they are not a separate structural rule.

1. A `.json` file whose `name` **and modifier set** match a sibling content
   file is that file's **sidecar**.
2. A sidecar's top-level object MUST be merged onto the content file's
   metadata; on key collision the sidecar value takes precedence.
3. Merge is shallow at the top level unless a profile specifies otherwise.
4. Modifiers participate in matching: `about.fr.json` is the sidecar for
   `about.fr.md`, not for `about.md`. A modifier sidecar with no matching
   content sibling SHOULD be surfaced as a warning.
