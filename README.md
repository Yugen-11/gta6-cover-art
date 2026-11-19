# Cover Snap — GTA-style cover maker

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Yugen-11/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Yugen-11/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Turn a photo and a caption into GTA-style cover art: the multi-panel poster look
with bold outlined lettering and a Vice City sunset or neon colour grade. It runs
entirely offline in a desktop browser — photos never leave your machine — and
exports the cover as a PNG in the common post sizes.

## Run it

No build step, no network. Serve `app/` with the included static server and open
`index.html` in a desktop browser:

```sh
node serve.ts
# then open http://localhost:8080
```

## How it works

1. **Pick photos** — use the two sample photos (Boulevard, Pier), upload your own,
   or drag images onto the cover. Click a panel to select it, drag to position
   the photo inside it, scroll to zoom, or use the sliders.
2. **Choose a layout** — one, two or three white-framed panels. Fill several
   panels with one photo or several.
3. **Write the caption** — a bold outlined headline plus an optional subtitle,
   placed top, bottom or centre, at any size.
4. **Pick a grade** — Vice City Sunset, Neon Nights, Palm Dusk, or none. Every
   grade is drawn on canvas.
5. **Export** — one click downloads the PNG at 1080 × 1080, 1080 × 1350,
   1920 × 1080 or 1080 × 1920.

Presets do all of that in one click: Sunset Heist, Neon Nights, Boulevard Queen.

## What is original here

Every panel frame, grade, letter and layout is drawn on canvas with system fonts.
There is no Rockstar Games logo, artwork or font anywhere in the app. The two
sample photos were made for make.fun with an image model and are free to use.

## Entry program

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/`
into `/output` and writes `/output/dossier.json` with the vendored
`vendor/makefun-app.ts` library:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## License

MIT — see LICENSE.

<sub>Entered on [make.fun](https://make.fun/?ref=4ab68p3v&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
