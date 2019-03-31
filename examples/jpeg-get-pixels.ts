import * as Jimp from 'jimp';
import * as _ from 'lodash';
import {IFile, IImage, File, Image} from './pbuff';
const fs = require('fs');
const path = require('path');

interface RGB {
    r: number;
    g: number;
    b: number;
}

async function processFile(prefix: string, file: string): Promise<[string, number[]]> {
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

    console.log(`${prefix}: Number of pixels: ${pixels.length}`);

    const uniq = _
        .chain(pixels)
        .uniq()
        .map((x) => {
            const val = Jimp.intToRGBA(x);
            return (val.r << 16) | (val.g << 8) | (val.b);
        })
        .value();

    console.log(`${prefix}: Unique Number of pixels: ${uniq.length}`);

    return [file, uniq];
}

async function main() {
    const relativeBase = path.resolve(path.join(__dirname, '../'));

    const files = await (<Promise<string[]>>new Promise((resolve, reject) => {
        const basePath = path.resolve(path.join(relativeBase, 'images/trim/content/14/jpeg/'));

        const nonResourceForks = (x: string): boolean => x.match(/^(\._|\.DS_Store)/) === null;
        const hasJpegExtension = (x: string): boolean => x.match(/\.jpe?g$/i) !== null;

        fs.readdir(basePath, function (err: NodeJS.ErrnoException, items: string[]) {
            if (!_.isNil(err)) {
                reject(err);
            } else {
                resolve(items.filter(nonResourceForks).filter(hasJpegExtension).map((x) => path.join(basePath, x)));
            }
        });
    })).then((x) => {
        console.debug('Total Files: ', x.length);
        return x;
    });

    async function procSet(set: {items: string[], idx: number}): Promise<void> {
        const actualI = set.idx + 1;
        console.debug('Processing Set: ', actualI);
        const output = await Promise.all(set.items.map(async (name, idx) => await processFile(`S${set.idx+1}/I${idx+1}`.padEnd(6, ' '), name)));

        // NTS: File is a container for all images and refers to image index file...
        fs.writeFileSync(
            path.resolve(path.join(relativeBase, `output_${actualI}.pb`)),
            File
                .encode(File.create(<IFile>{imgs: output.map((x) => Image.create(<IImage>{path: x[0], colors: x[1]}))}))
                .finish());
    }

    function chunkThrottle<T>(array: T[], chunk: number, throttle: number, promiseFunction: (set:{items:T[], idx:number}[]) => void) {
        _.chain(array)
            .chunk(chunk)
            .map((x, i)=>({items:x, idx:i}))
            .chunk(throttle)
            .value()
            .reduce(async (previousPromise, nextItem) => {
                await previousPromise;
                return promiseFunction(nextItem);
            }, Promise.resolve());
    }

    chunkThrottle(files, 25, 7, (sets) => Promise.all(sets.map(procSet)));
}

main();
