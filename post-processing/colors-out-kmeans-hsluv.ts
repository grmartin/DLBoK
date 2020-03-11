import _ = require('lodash');
import {HSLUV, RGB} from './shared/colors';
const kmeans = require('ml-kmeans');
type ColorDatum = { cssColor: string; color: string; hsluv_rgb: RGB; hpluv_rgb: RGB; count: number; hpluv: HSLUV; rgb: RGB; hsluv: HSLUV };
type ColorData = ColorDatum[];
const colorData: ColorData = require(`${__dirname}/expanded_color_data_export.json`);

const K = 36;

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
<body><h1>HSLUV KMeans (K=${K})</h1><ul>
${content}
</ul></body>
</html>`;

const colors = colorData.map((x) => [x.hsluv.h, x.hsluv.s, x.hsluv.l]);

const ans = kmeans(colors, K);
const centroidColors = _.chain(ans.centroids)
    .map((centroid: {centroid: number[];}) => ({
        h: centroid.centroid[0],
        s: centroid.centroid[1],
        l: centroid.centroid[2],
    }))
    .sortBy((a, b) => a.h)
    .map((x) => HSLUV.toRgb(x))
    .value();

console.log(html(_.map(centroidColors, (x) => `<li><div style="background-color: RGB(${x.r}, ${x.g}, ${x.b})" class="colorBox">&nbsp;</div>RGB(${x.r}, ${x.g}, ${x.b})</li>`).join("\n")));
