import _ = require('lodash');
import {HSLUV, RGB} from './shared/colors';
import {rgbToHsluv} from 'hsluv';

import kmeans = require('ml-kmeans');

type ColorDatum = { cssColor: string; color: string; hsluv_rgb: RGB; hpluv_rgb: RGB; count: number; hpluv: HSLUV; rgb: RGB; hsluv: HSLUV };
type ColorData = ColorDatum[];
const colorData: ColorData = require(`${__dirname}/expanded_color_data_export.json`);

const K = 50;
const MAX_ITER = 1000;

const html = (content: string[]) => `
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
		h2 { text-align: center; } 
		td { 
		    border: black 1px solid; 
		    width: 210px; 
		} 
		ul { 
		    list-style: none; 
		    padding-left: 0;
		}
	</style>
</head>
<body>
<body>
    <h1>KMeans Hue-Sorted By Color Space (K=${K}, MI=${MAX_ITER})</h1>
    <table>
    <tr>
        ${content.map((x) => `<td>${x}</td>`).join('\n')}
    </tr>
    </table>
</body>
</html>`;

const addHeading = (heading: string, values: string[]) =>
    `<h2>${heading}</h2>
        <ul>
            ${values.join("\n")}
        </ul>`;

const htmlForRGB = (rgb: RGB) => `<li><div style="background-color: RGB(${rgb.r}, ${rgb.g}, ${rgb.b})" class="colorBox">&nbsp;</div>RGB(${rgb.r}, ${rgb.g}, ${rgb.b})</li>`;

type CentroidSet = {centroid: number[];};

const fromHSLUV = () => {
    const colors = colorData.map((x) => [x.hsluv.h, x.hsluv.s, x.hsluv.l]);

    const ans = kmeans(colors, K, {maxIterations: MAX_ITER});
    return _.chain(ans.centroids)
        .map((centroid: CentroidSet) => ({
            h: centroid.centroid[0],
            s: centroid.centroid[1],
            l: centroid.centroid[2],
        }))
        .sortBy((a) => a.h)
        .map((x) => HSLUV.toRgb(x))
        .value() as RGB[];
};

// const fromHPLUV = () => {
//     const colors = colorData.map((x) => [x.hpluv.h, x.hpluv.s, x.hpluv.l]);
//
//     const ans = kmeans(colors, K, {maxIterations: MAX_ITER});
//     return _.chain(ans.centroids)
//         .map((centroid: CentroidSet) => ({
//             h: centroid.centroid[0],
//             s: centroid.centroid[1],
//             l: centroid.centroid[2],
//         }))
//         .sortBy((a) => a.h)
//         .map((x) => HSLUV.toRgb(x) as RGB)
//         .value() as RGB[];
// };

const fromHSLUVRBG = () => {
    const colors = colorData.map((x) => [x.hsluv_rgb.r, x.hsluv_rgb.g, x.hsluv_rgb.b]);

    const ans = kmeans(colors, K, {maxIterations: MAX_ITER});
    return _.chain(ans.centroids)
        .map((centroid: CentroidSet) => ({
            r: Math.round(centroid.centroid[0]),
            g: Math.round(centroid.centroid[1]),
            b: Math.round(centroid.centroid[2]),
        }))
        .sortBy((a) => rgbToHsluv([a.r, a.g, a.b])[0])
        .value();
};

const fromOrigRGB = () => {
    const colors = colorData.map((x) => [x.rgb.r, x.rgb.g, x.rgb.b]);

    const ans = kmeans(colors, K, {maxIterations: MAX_ITER});
    return _.chain(ans.centroids)
        .map((centroid: CentroidSet) => ({
            r: Math.round(centroid.centroid[0]),
            g: Math.round(centroid.centroid[1]),
            b: Math.round(centroid.centroid[2]),
        }))
        .sortBy((a) => rgbToHsluv([a.r, a.g, a.b])[0])
        .value();
};

const wholistic = () => {
    const colors = colorData.map((x) => [x.rgb.r, x.rgb.g, x.rgb.b, x.hsluv.h, x.hsluv.s, x.hsluv.l]);

    const ans = kmeans(colors, K, {maxIterations: 100});
    return _.chain(ans.centroids)
        .map((centroid: CentroidSet) => ({
            h: centroid.centroid[3],
            s: centroid.centroid[4],
            l: centroid.centroid[5],
        }))
        .sortBy((a) => a.h)
        .map((x) => HSLUV.toRgb(x))
        .value() as RGB[];
};

console.log(html([
    addHeading("Original RGB",              fromOrigRGB().map(htmlForRGB)),
    addHeading("HSL Converted RGB",         fromHSLUVRBG().map(htmlForRGB)),
    addHeading("HSLUV",                     fromHSLUV().map(htmlForRGB)),
    addHeading("HSLUV Joint<br/>(MI=100)",  wholistic().map(htmlForRGB)),
    // addHeading("HSLUV (Pastel)",    fromHPLUV().map(htmlForRGB))
]));
