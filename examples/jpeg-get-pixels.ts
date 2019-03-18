import * as Jimp from 'jimp';
import * as _ from 'lodash';
import {IFile, IImage, File, Image} from './pbuff';
// const BSON = require('bson');
// const msgpak = require('msgpack5');
// const cbor = require('cbor');
const fs = require('fs');
const path = require('path');

interface RGB {
    r: number;
    g: number;
    b: number;
}

async function processFile(file: string): Promise<[string, number[]]> {
    const doubleLoop = (aMax: number, bMax: number, execute: (a: number, b: number) => void) => {
        var a: number;
        var b: number;
        for (a = 0; a < aMax; a++) {
            for (b = 0; b < bMax; b++) {
                execute(a, b);
            }
        }
    };

    const img = await Jimp.read(file);
    const pixels: number[] = [];

    doubleLoop(img.getWidth(), img.getHeight(), (w, h) => pixels.push(img.getPixelColor(w, h)));

    console.log('Number of pixels: ' + pixels.length);

    const uniq = _
        .chain(pixels)
        .uniq()
        .map((x) => {
            const val = Jimp.intToRGBA(x);
            return (val.r << 16) | (val.g << 8) | (val.b);
        })
        .value();

    console.log('Unique Number of pixels: ' + uniq.length);

    return [file, uniq];
}

async function main() {
    const files = await <Promise<string[]>>new Promise((resolve, reject) => {
        const basePath = path.join(__dirname, 'trim/content/14/jpeg/');

        fs.readdir(basePath, function (err: NodeJS.ErrnoException, items: string[]) {
            if (!_.isNil(err)) {
                reject(err);
            } else {
                resolve(items.map((x) => path.join(basePath, x)));
            }
        });
    });
    // const files: string[] = [
    //     "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_001r_LO.jpg",
    //     "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_001v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_002r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_002v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_003r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_003v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_004r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_004v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_005r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_005v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_006r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_006v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_007r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_007v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_008r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_008v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_009r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_009v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_010r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_010v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_011r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_011v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_012r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_012v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_013r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_013v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_014r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_014v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_015r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_015v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_016r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_016v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_017r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_017v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_018r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_018v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_019r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_019v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_020r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_020v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_021r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_021v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_022r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_022v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_023r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_023v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_024r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_024v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_025r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_025v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_026r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_026v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_027r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_027v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_028r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_028v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_029r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_029v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_030r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_030v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_031r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_031v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_032r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_032v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_033r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_033v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_034r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_034v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_035r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_035v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_036ar_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_036av_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_036br_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_036bv_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_037r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_037v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_038r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_038v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_039r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_039v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_040r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_040v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_041r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_041v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_042r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_042v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_043r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_043v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_044r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_044v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_045r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_045v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_046r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_046v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_047r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_047v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_048r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_048v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_049r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_049v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_050r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_050v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_051r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_051v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_052r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_052v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_053r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_053v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_054r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_054v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_055r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_055v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_056r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_056v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_057r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_057v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_058r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_058v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_059r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_059v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_060r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_060v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_061r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_061v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_062r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_062v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_063r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_063v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_064r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_064v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_065r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_065v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_066r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_066v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_067r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_067v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_068r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_068v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_069r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_069v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_070r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_070v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_071r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_071v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_072r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_072v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_073r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_073v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_074r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_074v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_075r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_075v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_076r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_076v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_077r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_077v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_078r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_078v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_079r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_079v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_080r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_080v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_081r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_081v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_082r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_082v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_083r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_083v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_084r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_084v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_085r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_085v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_086r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_086v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_087r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_087v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_088r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_088v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_089r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_089v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_090r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_090v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_091r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_091v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_092r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_092v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_093r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_093v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_094r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_094v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_095r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_095v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_096r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_096v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_097r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_097v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_098r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_098v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_099r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_099v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_100r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_100v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_328r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_328v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_329r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_329v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_330r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_330v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_331r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_331v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_332r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_332v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_333r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_333v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_334r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_334v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_335r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_335v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_336r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_336v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_337r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_337v_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_338r_LO.jpg",
    //     // "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_338v_LO.jpg",
    //     "/Volumes/Data/Play/DLBoK/images/trim/content/14/jpeg/MS58_339r_LO.jpg"];

    const output = await Promise.all(files.map(async (name) => await processFile(name)));


    // fs.writeFileSync("./int_output.bson", BSON.serialize(output));
    // fs.writeFileSync("./int_output.msgpack", msgpak().encode(output));
    // fs.writeFileSync("./int_output.json", JSON.stringify(output));
    //
    // const enc = new cbor.Encoder({highWaterMark: 1 << 30});
    // enc.write(output);
    // fs.writeFileSync("./int_output.cbor", enc.read());

    fs.writeFileSync(
        "./int_output.pb",
        File
            .encode(File.create(<IFile>{imgs: output.map((x) => Image.create(<IImage>{path: x[0], colors: x[1]}))}))
            .finish());

}

main();
