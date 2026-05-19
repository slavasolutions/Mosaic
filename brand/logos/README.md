# Mosaic Logo

24×24 viewBox, single `<svg>` element, `currentColor` (adapts to text colour — works on any background).

## The mark

**`four-corners.svg`** — four blocks of different sizes:

- top-left: 9×9, gradient (95% → 60% opacity)
- top-right: 9×6 wide-short, 55% opacity
- bottom-right: 9×12 tall, 80% opacity
- bottom-left: 9×9, 40% opacity

The disparate sizes give it an irregular silhouette (not a tidy bounding square). Uses `currentColor` so it inherits the surrounding text colour — light theme renders dark, dark theme renders light. No palette colours; the brand stays monochrome at the logo layer.

The repo-root `logo.svg`, the Astro example's `public/logo.svg`, and the Next example's `public/logo.svg` are all copies of this file.

## Brand colour reference

Brand blue `#2b56d4` is **not** used in the logo. It appears only as a UI accent on the explainer page.
