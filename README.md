# DLBoK

This project is a play project. Its intent is to download all the pages of an old book. Process all the pixels (after some manual cropping ot the page content) then assist in analysis of the colors in the pages to allow for the creation of a color pallet for what i hope to replace my `Old Book` IDE Color Scheme.

Because the book in question's content is public and it is an item of world heritage i feel somewhat free doing it, but since i havent permission and dont wish to tax the organization's website i will not specify the Organization nor the Book in question.

## Requirements

- Node (12)
- TypeScript (3, via NPM)
- Posix OS (Mac or Linux)
    - cURL

### Post Processing

- Google Protobuff (3, via NPM)
- ArangoDB (driver via NPM, DB Service on another LAN computer)

## Scripts

### Download Images: `index.ts` and `data.js`

`index.ts` is the primary download handling loop. It simply imports the `data.js` file as a living object and processes the files by downloading them via `cURL`. You will have to find this file yourself (once youve fogured out the book and its source).

### Post Processing Scripts

All post processing scripts are found in the `post-processing/` directory.

#### Compile Google Protobuff: `proc.sh` and `pixels.proto`

Process the Google Protobuff specification (`pixels.proto`) in to `pbuff.js` and `pbuff.d.ts`. These structures are used in the intermediate step where we decompile the JPEG images in to raw color data.

#### Convert JPEG files to protobuff intermediates: `jpeg-get-pixels.ts`/`jpeg-get-pixels-service.ts`

Process the JPEG image data in to protobuff intermediate files.

#### Import Protobuff intermediate data format in to ArangoDB: `add-to-arango.ts`/`add-to-arango-service.ts`

Import all of the protobuff data in to the graph database (ArangoDB) for future processing.

> Note: these scripts, and the `extract-palette*` scripts below, all read connection
> settings from `post-processing/settings.js` (gitignored, not checked in). It should
> export:
> ```js
> module.exports.arango = {host: 'http://your-arango-host:8529', db: 'your-db', user: '...', pass: '...'};
> ```

#### Extract a background-aware color palette directly from ArangoDB: `extract-palette.ts`

Queries `colorAssociations` directly (no manual JSON export step needed) and produces
a small, perceptually-distinct color palette in two stages:

1. **Isolate the background/parchment color.** Naively clustering all ~700k distinct
   colors observed treats JPEG noise and paper-texture variation as real signal, and
   count-weighted clustering lets a handful of dominant page-background shades crowd
   out rare-but-visually-distinct colors (e.g. a single blue or green accent). Instead,
   colors are first quantized into RGB bins (`BIN_SIZE`) and rare bins are dropped as
   noise (`NOISE_FLOOR_RATIO`), then the single most prominent bin is used as a seed:
   every bin within `BACKGROUND_DELTA_E` of it in CIE Lab space (see
   `shared/colors.ts`'s `Lab` namespace — Cartesian and perceptually uniform, unlike
   HSLUV's circular hue) is swept into the background group and removed from further
   consideration.
2. **Cluster what's left by perceptual distance.** The remaining bins are grouped with
   Ward-linkage hierarchical clustering (`ml-hclust`) into `NUM_GROUPS` clusters, each
   collapsed to a pixel-count-weighted centroid.
3. **Fold the background-adjacent cluster back in.** Of those `NUM_GROUPS` clusters,
   whichever one is perceptually nearest the background centroid (e.g. a parchment
   highlight/glare tone) is merged into the background rather than kept as a
   "distinct" color, so `NUM_GROUPS` is the *total* color count including background
   (background + `NUM_GROUPS - 1` groups) rather than background-plus-`NUM_GROUPS`.
   This is what actually solves the leak that hand-tuning `BACKGROUND_DELTA_E` alone
   was chasing.

Writes `post-processing/palette.json` (background + groups, each with hex/RGB, pixel
share, and member-bin count) and an HTML swatch render to STDOUT. The Arango
aggregation query is slow (~70s over 64M `colorAssociations` rows), so its result is
cached at `post-processing/.aggregated-colors-cache.json` (gitignored) and reused
across runs — pass `--refresh` to force a re-fetch after re-importing data.

`BACKGROUND_DELTA_E` (optionally overridden as `node extract-palette.js <deltaE>`)
still matters — it decides which bins are even eligible to be considered "near
background" before the kick-out step runs — but is far less sensitive now that the
kick-out step handles the main failure mode. Default is 16, picked by eye comparing
14 through 18: background share climbs sensibly and all three rare accent colors
(blue/gray/green) survive, whereas 18 starts costing an accent instead of just
background-adjacent tan. See `extract-palette-sweep.ts` for how the range was
narrowed down before the final visual call.

#### Sweep `BACKGROUND_DELTA_E` to find where signal starts eroding: `extract-palette-sweep.ts`

Runs the same background/clustering logic across a range of `BACKGROUND_DELTA_E`
values (reusing the cached fetch, so this is fast — a few seconds for dozens of
values) and tracks a fixed set of reference "probe" colors (background, ink tones,
known accent colors) across the sweep: for each `deltaE`, which cluster ends up
closest to each probe, and what pixel share that cluster has. This turns "does this
value look right?" from eyeballing single runs into watching a probe's share curve
for the point it collapses into the background cluster — i.e. where it stops being
a distinct color.

Writes `post-processing/palette-runs/sweep-results.{csv,json}`.

#### Extract a larger, higher-fidelity palette: `extract-palette-32.ts`

Like `extract-palette.ts`, but background + 31 colors instead of background + 15,
swept across `BACKGROUND_DELTA_E` 12-18 in one run (writes one JSON+HTML pair per
value to `palette-runs/palette-32/`). Getting real fidelity out of 31 groups
instead of 15 needed two changes, not just a bigger `NUM_GROUPS`: a finer
`BIN_SIZE` (8 instead of 16, ~3x the surviving bins) so clustering has more than
"the same few dominant blobs" to carve up, and a correspondingly *lower*
`NOISE_FLOOR_RATIO` -- halving `BIN_SIZE` fragments every color's pixel mass across
more, smaller bins, which was silently dropping rare accent hues (the green
accent's surviving bins went from 22 to 4 at the same noise floor) below the floor
entirely rather than just deprioritizing them in clustering. Even with both fixes,
most of the extra fidelity is *tonal* (more distinguishable shades of the dominant
ink-brown family), not more hue variety -- the manuscript itself doesn't contain a
richer hue palette than the original 15 colors already found.

One derived artifact worth knowing about: `palette-runs/palette-32/deltaE16-skim17-31.json`
is background + groups 17-31 (by pixel share) from the deltaE=16 run -- i.e. the top
16 *most* prominent colors stripped out, leaving mostly rare pigments rather than
dominant ink/parchment tones ("skimming the cream off the top"). Used as an
alternate input to the theme generator below.

#### Generate VSCode themes from an extracted palette: `generate-vscode-theme.ts`

Turns any palette shaped like `{background, groups}` into an installable VSCode
color theme extension under `theme/`. Currently generates four themes -- **Kells
Light** (from the full 16-color extraction) and **Skimmed Kells Light** (from the
skimmed 16-color set above), each in **Subtle** (each accent keeps its own,
often quite muted, extracted saturation) and **Bold** (every accent's saturation
normalized to a shared, higher target) variants -- built on Solarized Light's role
structure (background, background-highlight, comments, body text, plus 8 accent
hues), with each role picked *algorithmically* (nearest-hue matching against real
Solarized colors, with a diversity constraint and an honest substitute-fallback for
roles with no real match) rather than hand-chosen per palette. Also runs a
legibility + distinctness audit on every generated theme. See `theme/README.md` for
the full mechanism -- the short version is centuries-old ink/parchment pigments
don't cover the full hue wheel Solarized's synthetic palette does, so a few accent
roles per palette end up as documented functional substitutes rather than true hue
matches.

#### `palette-runs/`

Snapshots of `extract-palette.ts`/`extract-palette-sweep.ts` output kept for
comparing different `BACKGROUND_DELTA_E` settings, plus `all-colors.json`, a flat
array combining every saved run's background + group colors (tagged with `run`,
`backgroundDeltaE`, and `role`) for ad-hoc analysis.

#### Requiring `color_data_out.json`

Some processing files require dumps from the resulting Arango DB. This can be exported from Arango via the JSON export functionality using the following AQL:

```arangodb
FOR doc IN @@collection
  COLLECT name = doc._to
  AGGREGATE cnt = SUM(doc.count)
  SORT cnt DESC
  RETURN {color: name, count: cnt}
```

> Note: You can speed up this query by adding an index to `colorAssociations._to`

This file should have JSON content that matches the interface:

```typescript
type colorData = {"color": string; "count": number}[]
```

##### Expand the color export: `expand-color-data-export.ts`

Reads `color_data_export.json` and, for each color, computes its RGB, HSLUV, and
HPLUV representations (plus the corresponding RGB conversions of the latter two),
writing the result to `expanded_color_data_export.json`. This expanded file is the
input for all of the `colors-out-*` analysis scripts below except `colors-out.ts`.

##### Generate a Color "contact" list: `colors-out.ts`

Dumps an HTML render of colors to STDOUT based on the `color_data_out.json` file data.

##### Generate a filtered color "contact" list: `colors-out-full.ts`

Like `colors-out.ts`, but reads the expanded export, filters out colors that are
likely page/vellum background (by hue range) or too rare/common by pixel count, and
renders RGB, HSLUV, and HPLUV swatches side by side per color.

##### Compare K-Means clustering across color spaces: `colors-out-kmeans-joint.ts`

Runs K-Means (K=50) over the expanded color export in four different feature spaces —
original RGB, HSLUV-derived RGB, HSLUV, and a joint RGB+HSLUV space — and renders the
resulting palettes side by side to STDOUT for visual comparison.

##### `colors-out-em.ts`

Reserved for an Expectation-Maximization based clustering comparison. Currently an
empty placeholder file.
