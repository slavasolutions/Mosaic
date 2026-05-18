# §9. Unknown Fields

A conforming writer MUST round-trip JSON fields it does not recognize, and
MUST NOT drop or destructively rewrite them when saving a record it has read.
This guarantees forward compatibility across tool and profile versions.

The `\ref:` escape (`ref:references/value`) is consistent with this guarantee:
backslashes outside the one escape position MUST be preserved verbatim.
