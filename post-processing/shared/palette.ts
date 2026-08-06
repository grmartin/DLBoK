import * as _ from 'lodash';
import {agnes} from 'ml-hclust';
import {Lab, RGB} from './colors';

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

export function computePalette(bins: Bin[], totalPixels: number, params: Pick<PaletteParams, 'backgroundDeltaE' | 'numGroups'>): PaletteResult {
    const withShare = (e: PaletteEntry): PaletteEntry => ({...e, share: e.count / totalPixels});

    const {background: rawBackground, remaining} = extractBackground(bins, params.backgroundDeltaE);
    const background = withShare(rawBackground);

    const groups = groupByDistance(remaining, params.numGroups)
        .map(withShare)
        .sort((a, b) => b.count - a.count);

    return {background, groups, totalPixels, binCount: bins.length};
}
