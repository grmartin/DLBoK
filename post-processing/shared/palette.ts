import * as _ from 'lodash';
import {agnes} from 'ml-hclust';
import {Lab, RGB} from './colors';

const toCss = RGB.toHex;

export interface AggregatedColor {
    r: number;
    g: number;
    b: number;
    count: number;
}

export interface Bin {
    r: number;
    g: number;
    b: number;
    count: number;
    lab: Lab;
}

export interface PaletteEntry {
    r: number;
    g: number;
    b: number;
    count: number;
    share: number;
    memberBins: number;
}

export interface PaletteParams {
    binSize: number;
    noiseFloorRatio: number;
    backgroundDeltaE: number;
    // Total colors desired, including background -- see computePalette.
    numGroups: number;
}

export interface PaletteResult {
    background: PaletteEntry;
    groups: PaletteEntry[];
    totalPixels: number;
    binCount: number;
}

// RGB quantization applied before clustering. Without this, ~700k
// distinct-but-near-duplicate colors (JPEG noise, paper texture, anti-
// aliasing) get clustered as individual points, so clustering optimizes
// for "density of unique colors" instead of "density of pixels".
export function toBins(colors: AggregatedColor[], binSize: number): Bin[] {
    const grouped = new Map<string, {rSum: number, gSum: number, bSum: number, count: number}>();

    for (const c of colors) {
        const key = [
            Math.floor(c.r / binSize),
            Math.floor(c.g / binSize),
            Math.floor(c.b / binSize)
        ].join(',');

        const entry = grouped.get(key) || {rSum: 0, gSum: 0, bSum: 0, count: 0};
        entry.rSum += c.r * c.count;
        entry.gSum += c.g * c.count;
        entry.bSum += c.b * c.count;
        entry.count += c.count;
        grouped.set(key, entry);
    }

    return Array.from(grouped.values()).map((e) => {
        const rgb: RGB = {r: e.rSum / e.count, g: e.gSum / e.count, b: e.bSum / e.count};
        return {r: rgb.r, g: rgb.g, b: rgb.b, count: e.count, lab: Lab.fromRgb(rgb)};
    });
}

function weightedCentroid(members: Bin[]): PaletteEntry {
    const count = _.sumBy(members, 'count');
    return {
        r: Math.round(_.sumBy(members, (m) => m.r * m.count) / count),
        g: Math.round(_.sumBy(members, (m) => m.g * m.count) / count),
        b: Math.round(_.sumBy(members, (m) => m.b * m.count) / count),
        count,
        share: 0,
        memberBins: members.length
    };
}

// Lab-space (deltaE76) radius swept out around the single most prominent
// bin to capture the whole parchment/background color cloud.
export function extractBackground(bins: Bin[], backgroundDeltaE: number): {background: PaletteEntry, remaining: Bin[]} {
    const seed = _.maxBy(bins, 'count')!;
    const isBackground = (b: Bin) => Lab.distance(b.lab, seed.lab) <= backgroundDeltaE;

    return {
        background: weightedCentroid(bins.filter(isBackground)),
        remaining: bins.filter((b) => !isBackground(b))
    };
}

export function groupByDistance(bins: Bin[], numGroups: number): PaletteEntry[] {
    if (bins.length === 0) {
        return [];
    }

    const tree = agnes(bins.map((b) => [b.lab.l, b.lab.a, b.lab.b]), {method: 'ward'});
    const top = tree.group(Math.min(numGroups, bins.length));

    return top.children.map((cluster) => weightedCentroid(cluster.indices().map((i) => bins[i])));
}

function mergeEntries(a: PaletteEntry, b: PaletteEntry): PaletteEntry {
    const count = a.count + b.count;
    return {
        r: Math.round(((a.r * a.count) + (b.r * b.count)) / count),
        g: Math.round(((a.g * a.count) + (b.g * b.count)) / count),
        b: Math.round(((a.b * a.count) + (b.b * b.count)) / count),
        count,
        share: 0,
        memberBins: a.memberBins + b.memberBins
    };
}

// params.numGroups is the *total* colors desired, background included. The
// remaining bins are clustered into numGroups groups, then whichever one is
// perceptually nearest the background centroid is folded back into the
// background rather than kept as a "distinct" color -- this is what the
// deltaE sweep was chasing by hand (a background-adjacent shading/vignette
// cluster sneaking into the top groups); doing it as a post-clustering step
// means BACKGROUND_DELTA_E no longer has to be tuned to catch it.
export function computePalette(bins: Bin[], totalPixels: number, params: Pick<PaletteParams, 'backgroundDeltaE' | 'numGroups'>): PaletteResult {
    const withShare = (e: PaletteEntry): PaletteEntry => ({...e, share: e.count / totalPixels});

    const {background: rawBackground, remaining} = extractBackground(bins, params.backgroundDeltaE);

    const clustered = groupByDistance(remaining, params.numGroups);
    const backgroundLab = Lab.fromRgb(rawBackground);
    const nearestToBackground = _.minBy(clustered, (g) => Lab.distance(Lab.fromRgb(g), backgroundLab));

    const background = withShare(nearestToBackground ? mergeEntries(rawBackground, nearestToBackground) : rawBackground);
    const groups = clustered
        .filter((g) => g !== nearestToBackground)
        .map(withShare)
        .sort((a, b) => b.count - a.count);

    return {background, groups, totalPixels, binCount: bins.length};
}

const paletteRow = (label: string, e: PaletteEntry) =>
    `<tr><td><div style="background-color: ${toCss(e)}" class="colorBox">&nbsp;</div></td><td>${toCss(e)} ${label}</td><td>${(e.share * 100).toFixed(2)}%</td><td>${e.memberBins}</td></tr>`;

export function renderPaletteHtml(result: PaletteResult): string {
    const rows = [
        paletteRow('(background)', result.background),
        ...result.groups.map((g, i) => paletteRow(`(group ${i + 1})`, g))
    ].join('\n');

    return `
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
}
