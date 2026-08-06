import * as _ from 'lodash';
import {fetchAggregatedColors} from './shared/color-fetch';
import {Lab, RGB} from './shared/colors';
import {PaletteEntry, computePalette, toBins} from './shared/palette';

const fs = require('fs');

// Fixed for the whole sweep -- only BACKGROUND_DELTA_E varies. See
// extract-palette.ts for why these particular defaults were chosen.
const BIN_SIZE = 16;
const NOISE_FLOOR_RATIO = 0.00004;
const NUM_GROUPS = 16;

// deltaE values to sweep, in half-unit steps across the range we've been
// manually probing (8, 14, 18) by hand.
const DELTA_E_RANGE = _.range(4, 26.5, 0.5);

// Reference colors pulled from the deltaE=14 run, used to track a specific
// perceptual feature's fate (which cluster claims it, and what share that
// cluster ends up with) as deltaE changes -- rather than eyeballing whichever
// groups happen to land in the top 16 at each step.
const PROBES: {name: string, hex: string}[] = [
    {name: 'background (deltaE=14 anchor)', hex: '#c7b9a4'},
    {name: 'highlight/cream', hex: '#f3e6d6'},
    {name: 'ink-dark', hex: '#2e1e11'},
    {name: 'ink-mid', hex: '#4e3b2c'},
    {name: 'blue-accent', hex: '#4e5c6d'},
    {name: 'green-accent', hex: '#6c7e6a'},
    {name: 'gray-accent', hex: '#757b7d'}
];

interface SweepRow {
    deltaE: number;
    probe: string;
    matchedHex: string;
    isBackground: boolean;
    share: number;
    memberBins: number;
    labDistanceToProbe: number;
}

const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
const toCss = (c: {r: number, g: number, b: number}) => `#${toHex(c.r)}${toHex(c.g)}${toHex(c.b)}`;

async function main() {
    const forceRefresh = process.argv.includes('--refresh');
    console.error('Fetching aggregated color counts...');
    const colors = await fetchAggregatedColors(forceRefresh);
    const totalPixels = _.sumBy(colors, 'count');

    const noiseFloor = totalPixels * NOISE_FLOOR_RATIO;
    const bins = toBins(colors, BIN_SIZE).filter((b) => b.count >= noiseFloor);
    console.error(`${bins.length} bins after quantization + noise floor. Sweeping ${DELTA_E_RANGE.length} deltaE values...`);

    const probeLabs = PROBES.map((p) => ({...p, lab: Lab.fromRgb(RGB.fromHex(p.hex))}));

    const rows: SweepRow[] = [];

    for (const deltaE of DELTA_E_RANGE) {
        const {background, groups} = computePalette(bins, totalPixels, {backgroundDeltaE: deltaE, numGroups: NUM_GROUPS});
        const candidates: {entry: PaletteEntry, isBackground: boolean}[] = [
            {entry: background, isBackground: true},
            ...groups.map((g) => ({entry: g, isBackground: false}))
        ];

        for (const probe of probeLabs) {
            const nearest = _.minBy(candidates, (c) => Lab.distance(Lab.fromRgb(c.entry), probe.lab))!;

            rows.push({
                deltaE,
                probe: probe.name,
                matchedHex: toCss(nearest.entry),
                isBackground: nearest.isBackground,
                share: nearest.entry.share,
                memberBins: nearest.entry.memberBins,
                labDistanceToProbe: Lab.distance(Lab.fromRgb(nearest.entry), probe.lab)
            });
        }

        console.error(`  deltaE=${deltaE}: background ${(background.share * 100).toFixed(2)}%, ${groups.length} groups`);
    }

    const csvHeader = 'deltaE,probe,matchedHex,isBackground,sharePercent,memberBins,labDistanceToProbe';
    const csvBody = rows.map((r) =>
        [r.deltaE, `"${r.probe}"`, r.matchedHex, r.isBackground, (r.share * 100).toFixed(4), r.memberBins, r.labDistanceToProbe.toFixed(2)].join(',')
    );
    const csv = [csvHeader, ...csvBody].join('\n');

    fs.mkdirSync(`${__dirname}/palette-runs`, {recursive: true});
    fs.writeFileSync(`${__dirname}/palette-runs/sweep-results.csv`, csv);
    fs.writeFileSync(`${__dirname}/palette-runs/sweep-results.json`, JSON.stringify(rows, null, 2));
    console.error(`Wrote ${__dirname}/palette-runs/sweep-results.csv and .json`);

    // Pivoted summary: share (%) per probe, per deltaE, for a quick console read.
    const probeNames = PROBES.map((p) => p.name);
    const header = ['deltaE', ...probeNames].join('\t');
    const lines = DELTA_E_RANGE.map((deltaE) => {
        const cells = probeNames.map((name) => {
            const r = rows.find((row) => row.deltaE === deltaE && row.probe === name)!;
            return r.isBackground ? `[bg]${(r.share * 100).toFixed(1)}` : `${(r.share * 100).toFixed(2)}`;
        });
        return [deltaE, ...cells].join('\t');
    });
    console.log([header, ...lines].join('\n'));
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
