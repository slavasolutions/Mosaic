# Example E — Variants of an identity

This fixture exercises the §7.1 variant rule (Path A): a record's matching
key is the pair `(identity, modifier-set)`, not identity alone.

Records here:

```
content/
  mosaic.json
  pages/
    about.json              # identity 'pages/about', modifiers []
    about.fr.json           # identity 'pages/about', modifiers ['fr']
    about.uk.json           # identity 'pages/about', modifiers ['uk']
    blog/
      hello.json            # identity 'pages/blog/hello', modifiers []
      hello.fr.json         # identity 'pages/blog/hello', modifiers ['fr']
  team/
    ada.json                # identity 'team/ada', modifiers []
```

What a conforming reader produces:

- `records.get('pages/about')` returns an array of three variants: the
  canonical one (`modifiers === []`), then the French and Ukrainian
  variants sorted by `modifiers.join('.')` ascending.
- `records.get('pages/blog/hello')` returns two variants — canonical and
  French.
- A `ref:/team/ada` in any variant resolves to the **canonical** Ada
  record (`team/ada.json`). The reference never silently selects a
  non-canonical variant (§11.4 clause 2). If only non-canonical variants
  exist for the target identity, the ref is dangling per §11.6.

The validator (`packages/core/dist/cli.js validate spec/examples/E-variants/content`)
passes this folder clean: no collisions, no warnings.
