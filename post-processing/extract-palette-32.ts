import * as _ from 'lodash';
import {fetchAggregatedColors} from './shared/color-fetch';
import {computePalette, renderPaletteHtml, toBins} from './shared/palette';
import {RGB} from './shared/colors';

const fs = require('fs');

// A finer quantization than extract-palette.ts's default (16). BG+15 only
// had ~250-290 non-background bins to build 15 groups from at BIN_SIZE=16 --
// enough, but not much headroom. BG+31 needs meaningfully more raw material
// to carve into 31 *distinct* groups rather than just subdividing the same
// few dominant blobs; halving the bin size to 8 nearly triples the surviving
// bin count (311 -> 856 at the same noise floor), verified against the
// cached fetch before writing this script.
const BIN_SIZE = 8;

// Half of extract-palette.ts's 0.00004. The noise floor is evaluated
// per-bin, so halving BIN_SIZE fragments every color's pixel mass across
// ~2-5x more, smaller bins -- rare accent hues (e.g. the green from the
// BG+15 palette) mostly fell *below* the unchanged floor and vanished
// entirely rather than just losing clustering priority: at BIN_SIZE=8,
// green-hued (H 90-160) surviving bins dropped from 22 (at BIN_SIZE=16,
// same floor) to 4. Halving the floor here restores that headroom (54
// green bins survive) without letting total bin count get out of hand for
// clustering (1223 vs 856 -- still trivial for agnes).
const NOISE_FLOOR_RATIO = 0.00002;
const NUM_GROUPS = 32; // total colors including background -- see computePalette in shared/palette.ts

const DELTA_E_RANGE = _.range(12, 18.5, 1);

const toCss = RGB.toHex;

async function main() {
    const forceRefresh = process.argv.includes('--refresh');
    console.error('Fetching aggregated color counts...');
    const colors = await fetchAggregatedColors(forceRefresh);
    const totalPixels = _.sumBy(colors, 'count');
    console.error(`${colors.length} distinct colors, ${totalPixels} total pixels observed.`);

    const noiseFloor = totalPixels * NOISE_FLOOR_RATIO;
    const bins = toBins(colors, BIN_SIZE).filter((b) => b.count >= noiseFloor);
    console.error(`Reduced to ${bins.length} bins after ${BIN_SIZE}-unit quantization + noise floor (vs 311 at BIN_SIZE=16).`);

    const outDir = `${__dirname}/palette-runs/palette-32`;
    fs.mkdirSync(outDir, {recursive: true});

    for (const deltaE of DELTA_E_RANGE) {
        const result = computePalette(bins, totalPixels, {backgroundDeltaE: deltaE, numGroups: NUM_GROUPS});
        console.error(`deltaE=${deltaE}: background ${toCss(result.background)} (${(result.background.share * 100).toFixed(2)}%), ${result.groups.length} groups`);

        const palette = {...result, backgroundDeltaE: deltaE, binSize: BIN_SIZE, generatedAt: new Date().toISOString()};
        fs.writeFileSync(`${outDir}/deltaE${deltaE}.json`, JSON.stringify(palette, null, 2));
        fs.writeFileSync(`${outDir}/deltaE${deltaE}.html`, renderPaletteHtml(result));
    }

    console.error(`Wrote ${outDir}/deltaE{12..18}.{json,html}`);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
