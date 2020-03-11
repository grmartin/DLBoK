import {HSLUV, RGB} from './shared/colors';
import {rgbToHpluv, rgbToHsluv} from 'hsluv';
import {util} from 'protobufjs';
import fs = util.fs;

type ColorData = {"color": string; "count": number}[];
const colorData: ColorData = require(`${__dirname}/color_data_export.json`);

type ColorDataHSL = {"color": string; "count": number; rgb: RGB; hsluv: HSLUV; hpluv: HSLUV;}[];

const outData = colorData.map((d) => {
    const rgb = RGB.fromString(d.color);
    const convHSL = (vals : [number, number, number]) => <HSLUV>{
        h: vals[0],
        s: vals[1],
        l: vals[2]
    };
    return (x => ({
        ...x,
        hsluv_rgb : HSLUV.toRgb(x.hsluv),
        hpluv_rgb : HSLUV.toRgb(x.hpluv),
    }))({
        ...d,
        rgb: rgb,
        hsluv: convHSL(rgbToHsluv([rgb.r/255, rgb.g/255, rgb.b/255])),
        hpluv: convHSL(rgbToHpluv([rgb.r/255, rgb.g/255, rgb.b/255])),
        cssColor: d.color.replace(/colors\//, ''),
    });
});

fs.writeFileSync(`${__dirname}/expanded_color_data_export.json`, JSON.stringify(outData));

console.log("done");
