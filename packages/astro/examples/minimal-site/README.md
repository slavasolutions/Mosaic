# mosaic-astro — minimal example site

A tiny Astro site that loads `./content/` as a Mosaic folder via `mosaic-astro`.

## Run

```sh
npm install
npm run dev
```

Then open the four routes the Mosaic Web profile derives:

- `/` (from `content/pages/index.json`)
- `/about` (from `content/pages/about.json`)
- `/blog` (from `content/pages/blog/index.json`)
- `/blog/hello` (from `content/pages/blog/hello.md` + `content/pages/blog/hello.json`)

`content/team/ada.json` is a record but **not** a web route — it sits outside the `pages/` profile root, so the loader emits it without a URL.

## Requirements

This example uses `file:` deps for `mosaic-astro` and `mosaic-core`, so both repos must be present as siblings:

```
/some/parent/
  mosaic-astro/        (this repo)
  mosaic-core/         (sibling — needed for installs to resolve)
```

Once `mosaic-core` publishes to npm, `npm install` will work from a clean checkout without the sibling requirement.
