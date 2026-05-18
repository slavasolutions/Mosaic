# Base format

The base format is the substrate. Three structural rules:

1. **A file is a record** (`ref:format/records`).
2. **A folder is a collection** (`ref:format/collections`).
3. **The filename is the contract** (`ref:format/naming`).

Sidecars (`ref:format/sidecars`) and unknown-field preservation
(`ref:format/unknown-fields`) follow from those rules.

The base format is deliberately web-ignorant. Web-shaped concepts (URLs,
routes, redirects, design tokens) belong in a separate specification built
on top of this one.
