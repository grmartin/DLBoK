import arango from 'arangojs';
import * as _ from 'lodash';
import {File} from './pbuff';
import {RGB} from './shared/colors';
import {BasicObject, createOrReplaceDocumentCollection, createOrReplaceEdgeCollection, Schema} from './shared/arango';
import {ChunkSet} from './shared/chunking';

const fs = require('fs');
const settings = require('./settings').arango;
const { workerData, parentPort } = require('worker_threads');

const CollectionNames = Schema.Constants.Collections;

async function main() {
    const db = arango({url: settings.host})
        .useDatabase(settings.db);
    db.useBasicAuth(settings.user, settings.pass);

    const imageCollection = await createOrReplaceDocumentCollection(db, CollectionNames.Images);
    const colorCollection = await createOrReplaceDocumentCollection(db, CollectionNames.Colors);
    const colorAssociations = await createOrReplaceEdgeCollection(db, CollectionNames.ColorAssociations);

    async function procSet(set: ChunkSet<string>): Promise<void> {
        const countKey = '*cnt';
        const chunkingSize = 500;

        for (let fileIdx = 0; set.items.length > fileIdx; fileIdx++) {
            const filePath = set.items[0];
            console.log(`Processing file ${filePath}:`);
            const file = File.decode(fs.readFileSync(filePath));

            const images = file.imgs.map((image) => {
                const fileEntry = image;
                const fileRecKey = fileEntry.path;
                return {doc: {_key: fileRecKey, width: fileEntry.size!.width, height: fileEntry.size!.height}, obj: image};
            });

            await imageCollection.import(images.map((x) => x.doc));

            for (let imgIdx = 0; images.length > imgIdx; imgIdx++) {
                const fileEntry = images[imgIdx].obj;
                const fileRecKey = images[imgIdx].doc._key;
                console.log(`Processing image ${fileRecKey}:`);

                const individualColors = fileEntry.colors!.map((c) => {
                    const color : BasicObject = RGB.fromInteger(c.colorValue as number);
                    color['_key'] = `RGB(${color.r},${color.g},${color.b})`;
                    color[countKey] = Number(c.instanceCount);
                    return color;
                });

                for (let i = 0; i < individualColors.length; i += chunkingSize) {
                    let chunk = individualColors.slice(i, i + chunkingSize);
                    await colorCollection.import(chunk.map(x => _.omit(x, [countKey])), {onDuplicate: 'ignore'});

                    colorAssociations.import(chunk.map((color) => {
                        return {_from:`${CollectionNames.Images}/${fileRecKey}`, _to:`${CollectionNames.Colors}/${color._key}`, count:color[countKey]};
                    })).then();
                }
            }
        }
    }

    procSet(workerData)
        .then(() => parentPort.postMessage({ success: true }))
        .catch((x: any) => parentPort.postMessage({success: false, data: x}));
}

main();
