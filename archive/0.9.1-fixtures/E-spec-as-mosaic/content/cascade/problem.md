# §12.1 The problem cascade solves

Some values are shared by every record in a subtree: a default `theme`, a
`locale`, an owning `org`. Without cascade, every record repeats them, and
changing one means editing all. Cascade lets a record inherit a value from
an ancestor instead of restating it.
