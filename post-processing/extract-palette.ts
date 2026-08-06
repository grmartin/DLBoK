import * as _ from 'lodash';
import {fetchAggregatedColors} from './shared/color-fetch';
import {PaletteEntry, computePalette, toBins} from './shared/palette';

const fs = require('fs');

// --- Tunables ---------------------------------------------------------
const BIN_SIZE = 16;

// Bins whose total pixel count is below this fraction of all observed
// pixels are dropped as noise before clustering.
const NOISE_FLOOR_RATIO = 0.00004;

const BACKGROUND_DELTA_E = 24;

// Number of distinct (non-background) color groups to extract.
const NUM_GROUPS = 16;

const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
const toCss = (c: {r: number, g: number, b: number}) => `#${toHex(c.r)}${toHex(c.g)}${toHex(c.b)}`;

const html = (rows: string) => `
<?xml version="1.0"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN"
	"http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
	<title></title>
	<style type="text/css">
		div.colorBox {
			display: inline-block;
			height: 2em;
			border: black 1px solid;
			width: 2em;
			margin-right: 0.5em;
			vertical-align: middle;
		}
		td, tbody {
		    font-family: monospace;
			line-height: 2.5em;
		}
	</style>
</head>
<body><table>
<thead><tr><td>swatch</td><td>hex</td><td>share</td><td>member bins</td></tr></thead>
<tbody>
${rows}
</tbody></table></body>
</html>`;

const row = (label: string, e: PaletteEntry) =>
    `<tr><td><div style="background-color: ${toCss(e)}" class="colorBox">&nbsp;</div></td><td>${toCss(e)} ${label}</td><td>${(e.share * 100).toFixed(2)}%</td><td>${e.memberBins}</td></tr>`;

async function main() {
    const forceRefresh = process.argv.includes('--refresh');
    console.error('Fetching aggregated color counts...');
    const colors = await fetchAggregatedColors(forceRefresh);
    const totalPixels = _.sumBy(colors, 'count');
    console.error(`${colors.length} distinct colors, ${totalPixels} total pixels observed.`);

    const noiseFloor = totalPixels * NOISE_FLOOR_RATIO;
    const bins = toBins(colors, BIN_SIZE).filter((b) => b.count >= noiseFloor);
    console.error(`Reduced to ${bins.length} bins after ${BIN_SIZE}-unit quantization + noise floor.`);

    const {background, groups} = computePalette(bins, totalPixels, {backgroundDeltaE: BACKGROUND_DELTA_E, numGroups: NUM_GROUPS});
    console.error(`Background isolated as ${toCss(background)} (${(background.share * 100).toFixed(2)}% of pixels, ${background.memberBins} bins).`);

    const palette = {background, groups, totalPixels, generatedAt: new Date().toISOString()};
    fs.writeFileSync(`${__dirname}/palette.json`, JSON.stringify(palette, null, 2));
    console.error(`Wrote ${__dirname}/palette.json`);

    const rows = [
        row('(background)', background),
        ...groups.map((g, i) => row(`(group ${i + 1})`, g))
    ].join('\n');

    console.log(html(rows));
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
