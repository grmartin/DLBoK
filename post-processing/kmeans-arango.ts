import arango, {aql, Database, DocumentCollection, EdgeCollection} from 'arangojs';
import {Schema} from './shared/arango';
import ImageRecord = Schema.ImageRecord;
import {RGB} from './shared/colors';
const CollectionNames = Schema.Constants.Collections;

const settings = require('./settings').arango;

async function main() {
    const db = arango({url: settings.host})
        .useDatabase(settings.db);
    db.useBasicAuth(settings.user, settings.pass);

    const images =
        (<ImageRecord[]>
            await (
                await db.collection(CollectionNames.Images)
                .all({batchSize: 1000})
            ).all()
        )
        .map(x => x._key);

    for (let imgIdx = 0; images.length > imgIdx; imgIdx++) {
        const imageName = images[imgIdx];

        const uniqueColors = <number[][]> (await (await db.query(aql`
            FOR doc1 IN ${db.collection(CollectionNames.ColorAssociations)}
              FILTER doc1._from == ${`${CollectionNames.Images}/${imageName}`}
              FOR doc2 IN ${db.collection(CollectionNames.Colors)}
                FILTER doc1._to == doc2._id
                SORT doc2.r DESC, doc2.g DESC, doc2.b DESC
                COLLECT r = doc2.r, g = doc2.g, b = doc2.b
                RETURN [ r, g, b ]
            `)).all());

        console.log(`items: ${uniqueColors}`);
    }



    console.log(`images: ${images}`);
}

main();