# §11.4 Resolution

To resolve a reference:

1. Compute the target identity (absolute, or relative to the referrer's
   collection).
2. Locate the record with that identity per §7.1 (`ref:format/naming`),
   applying sidecar merge (`ref:format/sidecars`) to obtain the **resolved
   target**: a single JSON object.
3. If a JSON Pointer is present, evaluate it against the resolved target
   and yield that value. Otherwise yield the whole resolved target.

Resolution is **pure**: it depends only on the folder contents, not on
consumer state, time, or order. Two conforming consumers MUST resolve the
same reference to the same value.

Resolution sits at step 4 of the fixed resolution pipeline — see
`ref:cascade/resolution-order`.
