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
