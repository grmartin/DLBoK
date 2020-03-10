import * as Jimp from 'jimp';
import * as _ from 'lodash';
import {Paths} from './shared/paths';
import {File, IColorData, IFile, IImage, Image, ISize} from './pbuff';
import {ChunkSet} from './shared/chunking';
import * as fs from 'fs';
import * as path from 'path';

const basePath = Paths.getInputPath();

const process_unique = true;

const { workerData, parentPort } = require('worker_threads');

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

async function processFile(prefix: string, file: string): Promise<[string, number, number, IColorData[]]> {
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

    let pixCode: IColorData[] = [];

    if (process_unique) {
        pixCode = _.chain(pixels)
                    .reduce((coll, it) => {
                        if (coll[it] === undefined) {
                            coll[it] = 1;
                        } else {
                            coll[it] = coll[it] + 1;
                        }
                        return coll;
                    }, <{[k: number]: number}>{})
                    .map((v: number, k: number) => <IColorData>{colorValue: k, instanceCount: v})
                    .value() as IColorData[];

        console.log(`${prefix}: Unique Number of pixels: ${pixCode.length}`);
    } else {
        pixCode = pixels.map((p) => <IColorData>{colorValue: p, instanceCount:1});
    }

    return [file, img.getWidth(), img.getHeight(), pixCode];
}

procSet(workerData)
    .then(() => parentPort.postMessage({ success: true }))
    .catch((x: any) => parentPort.postMessage({success: false, data: x}));
