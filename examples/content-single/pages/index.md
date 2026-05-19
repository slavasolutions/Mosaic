Marin Atelier started as a single page on a single domain in 2019 and we have been resisting the pull toward a second page ever since. Hand-marbled paper, mostly. Some smaller bookbinding work on the side. Commissions by appointment.

## What this demo is

This is the smallest Mosaic site that still parses. One page. No `tokens/` folder, so the layout falls back to its inline default theme. No navigation links because there is nowhere to go. The adapter still reads `mosaic.json`, still derives `/` from `pages/index`, still emits `index.html`.

If you want to see Mosaic do more, switch to the **blog** shape (three pages plus a journal) or the **full** shape (ten-plus pages with nav, sub-pages, multiple posts).

## Why a single page is in the matrix

A single-page site is the floor of what Mosaic can do. Everything else is the same idea repeated. The same `pages/<route>.json` convention. The same body file paired by extension. The same ref resolution if you happen to use any. If a one-page site renders correctly, a hundred-page site renders correctly — only the walk takes longer.
