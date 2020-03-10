import * as Jimp from 'jimp';
import * as _ from 'lodash';
import './shared/colors';
import {IFile, IImage, File, Image, ISize} from './pbuff';
import {Paths} from './shared/paths';
const fs = require('fs');
const path = require('path');
const process_unique = false;

const NUM_CONCUR_SETS = 2;
const NUM_PER_SET = 2;

const START_TIME = new Date();

async function processFile(prefix: string, file: string): Promise<[string, number, number, number[]]> {
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

    const toNumCode = (x: number) => {
        const val = Jimp.intToRGBA(x);
        return (val.r << 16) | (val.g << 8) | (val.b);
    };

    doubleLoop(img.getWidth(), img.getHeight(), (w, h) => pixels.push(toNumCode(img.getPixelColor(w, h))));

    console.log(`${prefix}: Number of pixels: ${pixels.length}`);

    let pixCode = pixels;

    if (process_unique) {
        pixCode = _.uniq(pixCode);
        console.log(`${prefix}: Unique Number of pixels: ${pixCode.length}`);
    }

    return [file, img.getWidth(), img.getHeight(), pixCode];
}

type ChunkSet<T> = {items: T[], idx: number}

function chunkThrottle<T>(array: T[], chunk: number, throttle: number, promiseFunction: (set:ChunkSet<T>[]) => void) {
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

async function main() {
    const basePath = Paths.getInputPath();

    const files = await (<Promise<string[]>>new Promise((resolve, reject) => {
        const nonResourceForks = Paths.Filters.nonResourceForks;
        const hasJpegExtension = Paths.Filters.hasJpegExtension;

        fs.readdir(basePath, function (err: NodeJS.ErrnoException, items: string[]) {
            if (!_.isNil(err)) {
                reject(err);
            } else {
                resolve(items.filter(nonResourceForks).filter(hasJpegExtension).map((x) => path.join(basePath, x)));
            }
        });
    })).then((x) => {
        console.debug('Total Files: ', x.length);
        console.debug('Total Sets: ',  x.length/NUM_PER_SET);
        console.debug(`Concurrency: Concurrent Sets: ${NUM_CONCUR_SETS}, Per Set: ${NUM_PER_SET}`);
        console.debug('Destination: ', Paths.getOutputPath());
        console.debug('Start: ', START_TIME);
        return x;
    });

    async function procSet(set: ChunkSet<string>): Promise<void> {
        return new Promise<void>((res) => {
            const actualI = set.idx + 1;
            console.debug('Processing Set: ', actualI);

            Promise.all(set.items.map((name, idx) => processFile(`S${set.idx + 1}/I${idx + 1}`.padEnd(6, ' '), name)))
                .then(output => {
                    // NTS: File is a container for all images and refers to image index file...
                    fs.writeFileSync(
                        path.resolve(path.join(Paths.getOutputPath(), `${process_unique ? '' : 'actual_'}output_${actualI.toString().padStart(3, '0')}.pb`)),
                        File
                            .encode(File.create(<IFile>{
                                rootPath: basePath,
                                imgs: output.map((x) => Image.create(<IImage>{
                                    path: x[0].replace(basePath, '').replace(/^\/*/, ''),
                                    size: <ISize>{width: x[1], height: x[2]},
                                    colors: x[3]
                                }))
                            }))
                            .finish());
                })
                .then(res);
        });
    }

    chunkThrottle(files, NUM_PER_SET, NUM_CONCUR_SETS, (sets) => Promise.all(sets.map(procSet)));
}

process.on('beforeExit', (code) => {
    console.debug(`Running Time: ${(START_TIME.getMilliseconds()/1000) - (new Date().getMilliseconds()/1000)} secs`);
    console.debug(`Terminating With Code: ${code}`);
});

main();
