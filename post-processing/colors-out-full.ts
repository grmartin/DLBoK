import _ = require('lodash');
import {HSLUV, RGB} from './shared/colors';

type ColorDatum = { cssColor: string; color: string; hsluv_rgb: RGB; hpluv_rgb: RGB; count: number; hpluv: HSLUV; rgb: RGB; hsluv: HSLUV };
type ColorData = ColorDatum[];
const colorData: ColorData = require(`${__dirname}/expanded_color_data_export.json`);

const html = (content: string) => `
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
		}
		li, tbody {
		    font-family: monospace;
			line-height: 2.5em;
		}
	</style>
</head>
<body><table>
<thead><tr><td>rgb</td><td>hsluv</td><td>hpluv</td><td>name</td><td>count</td></tr></thead>
<tbody>
${content}
</tbody></table></body>
</html>`;

const numPixels = 2795185667;

const betweenIncl = (a: number, b: number, x: number) => x >= a && x <= b;
const betweenExcl = (a: number, b: number, x: number) => x > a && x < b;

const countThresh = (c: ColorDatum) => betweenExcl(0, Math.round(numPixels*.75), c.count);
const likelyVellum = (c: ColorDatum) => betweenIncl(54, 69, Math.round(c.hsluv.h));

const colors = colorData.filter((c) => (!likelyVellum(c)) && (countThresh(c)));

const enBox = (color: RGB, inpl: string = '&nbsp;') => `<div style="background-color: RGB(${color.r}, ${color.g}, ${color.b})" class="colorBox">${inpl}</div>`;

console.log(html(_.map(colors, (x) => `<tr><td>${enBox(x.rgb)}</td><td>${enBox(x.hsluv_rgb, `${Math.round(x.hsluv.h)}`)}</td><td>${enBox(x.hpluv_rgb, `${Math.round(x.hpluv.h)}`)}</td><td>${x.color}</td><td>${x.count}</td></tr>`).join("\n")));
