import {Database, DocumentCollection, EdgeCollection} from 'arangojs';

export interface BasicObject {
    [key: string]: boolean | number | string | BasicObject;
}

export namespace Schema {
    export const Constants = {
        Collections: {
            Images: "images",
            Colors: "colors",
            ColorAssociations: "colorAssociations"
        }
    };


    export interface ArangoRecord {
        _key: string,
        _rev?: string,
        _id?: string,
    }

    export interface ImageRecord extends ArangoRecord {
        width: number,
        height: number
    }
}

export function createOrReplaceDocumentCollection(db: Database, name: string): Promise<DocumentCollection> {
    return new Promise<DocumentCollection>(async (res) => {
        const collection = db.collection(name);

        if (!await collection.exists()) {
            await collection.create();
        }

        res(collection);
    });
}

export function createOrReplaceEdgeCollection(db: Database, name: string): Promise<EdgeCollection> {
    return new Promise<EdgeCollection>(async (res) => {
        const collection = db.edgeCollection(name);

        if (!await collection.exists()) {
            await collection.create();
        }

        res(collection);
    });
}