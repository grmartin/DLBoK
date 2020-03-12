import {HSLUV, RGB} from './shared/colors';
import * as fs from 'fs';
type ColorDatum = { cssColor: string; color: string; hsluv_rgb: RGB; hpluv_rgb: RGB; count: number; hpluv: HSLUV; rgb: RGB; hsluv: HSLUV };
type ColorData = ColorDatum[];
const colorData: ColorData = require(`${__dirname}/expanded_color_data_export_trim.json`).map((cd) => [cd.hsluv.h, cd.hsluv.s, cd.hsluv.l]);

const em = require('expectation-maximization');

var n_groups = 36;
var groups = em(colorData, n_groups);

fs.writeFileSync(`${__dirname}/em_out.json`, JSON.stringify(groups));
console.log("debug");
