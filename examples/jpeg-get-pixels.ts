import * as Jimp from 'jimp';
import * as _ from 'lodash';
import {IFile, IImage, File, Image} from './pbuff';
const fs = require('fs');
const path = require('path');

const flatbuffers = require('flatbuffers').flatbuffers;

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

    const output = await Promise.all(files.map(async (name) => await processFile(name)));

    // NTS: File is a container for all images and refers to image index file...
    fs.writeFileSync(
        "./int_output.pb",
        File
            .encode(File.create(<IFile>{imgs: output.map((x) => Image.create(<IImage>{path: x[0], colors: x[1]}))}))
            .finish());

}

main();
