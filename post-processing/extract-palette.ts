import * as _ from 'lodash';
import {fetchAggregatedColors} from './shared/color-fetch';
import {RGB} from './shared/colors';
import {computePalette, renderPaletteHtml, toBins} from './shared/palette';

const fs = require('fs');

// --- Tunables ---------------------------------------------------------
const BIN_SIZE = 16;

// Bins whose total pixel count is below this fraction of all observed
// pixels are dropped as noise before clustering.
const NOISE_FLOOR_RATIO = 0.00004;

// 16 landed as the best-looking split after visually comparing 14-18 with
// the background-kickout behavior below: background share climbs sensibly
// and all three rare accent colors (blue/gray/green) are still intact,
// vs. 18 where the kick-out starts eating an accent instead of just the
// transitional tan/background-adjacent tones.
const BACKGROUND_DELTA_E = Number(process.argv[2]) || 16;

// Total colors desired, background included (see computePalette in
// shared/palette.ts: the cluster nearest the background centroid gets
// folded back into it, so this no longer needs hand-tuning via
// BACKGROUND_DELTA_E to avoid a background-adjacent group sneaking in).
const NUM_GROUPS = 16;

const toCss = RGB.toHex;

async function main() {
    const forceRefresh = process.argv.includes('--refresh');
    console.error('Fetching aggregated color counts...');
    const colors = await fetchAggregatedColors(forceRefresh);
    const totalPixels = _.sumBy(colors, 'count');
    console.error(`${colors.length} distinct colors, ${totalPixels} total pixels observed.`);

    const noiseFloor = totalPixels * NOISE_FLOOR_RATIO;
    const bins = toBins(colors, BIN_SIZE).filter((b) => b.count >= noiseFloor);
    console.error(`Reduced to ${bins.length} bins after ${BIN_SIZE}-unit quantization + noise floor.`);

    const result = computePalette(bins, totalPixels, {backgroundDeltaE: BACKGROUND_DELTA_E, numGroups: NUM_GROUPS});
    console.error(`Background isolated as ${toCss(result.background)} (${(result.background.share * 100).toFixed(2)}% of pixels, ${result.background.memberBins} bins).`);

    const palette = {...result, generatedAt: new Date().toISOString()};
    fs.writeFileSync(`${__dirname}/palette.json`, JSON.stringify(palette, null, 2));
    console.error(`Wrote ${__dirname}/palette.json`);

    console.log(renderPaletteHtml(result));
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
