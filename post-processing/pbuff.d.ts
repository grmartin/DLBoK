import * as $protobuf from "protobufjs";
/** Properties of a File. */
export interface IFile {

    /** File rootPath */
    rootPath?: (string|null);

    /** File imgs */
    imgs?: (IImage[]|null);
}

/** Represents a File. */
export class File implements IFile {

    /**
     * Constructs a new File.
     * @param [properties] Properties to set
     */
    constructor(properties?: IFile);

    /** File rootPath. */
    public rootPath: string;

    /** File imgs. */
    public imgs: IImage[];

    /**
     * Creates a new File instance using the specified properties.
     * @param [properties] Properties to set
     * @returns File instance
     */
    public static create(properties?: IFile): File;

    /**
     * Encodes the specified File message. Does not implicitly {@link File.verify|verify} messages.
     * @param message File message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: IFile, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified File message, length delimited. Does not implicitly {@link File.verify|verify} messages.
     * @param message File message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: IFile, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a File message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns File
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): File;

    /**
     * Decodes a File message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns File
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): File;

    /**
     * Verifies a File message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a File message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns File
     */
    public static fromObject(object: { [k: string]: any }): File;

    /**
     * Creates a plain object from a File message. Also converts values to other types if specified.
     * @param message File
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: File, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this File to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };
}

/** Properties of a Size. */
export interface ISize {

    /** Size width */
    width?: (number|null);

    /** Size height */
    height?: (number|null);
}

/** Represents a Size. */
export class Size implements ISize {

    /**
     * Constructs a new Size.
     * @param [properties] Properties to set
     */
    constructor(properties?: ISize);

    /** Size width. */
    public width: number;

    /** Size height. */
    public height: number;

    /**
     * Creates a new Size instance using the specified properties.
     * @param [properties] Properties to set
     * @returns Size instance
     */
    public static create(properties?: ISize): Size;

    /**
     * Encodes the specified Size message. Does not implicitly {@link Size.verify|verify} messages.
     * @param message Size message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: ISize, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified Size message, length delimited. Does not implicitly {@link Size.verify|verify} messages.
     * @param message Size message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: ISize, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a Size message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns Size
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): Size;

    /**
     * Decodes a Size message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns Size
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): Size;

    /**
     * Verifies a Size message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates a Size message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns Size
     */
    public static fromObject(object: { [k: string]: any }): Size;

    /**
     * Creates a plain object from a Size message. Also converts values to other types if specified.
     * @param message Size
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: Size, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this Size to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };
}

/** Properties of an Image. */
export interface IImage {

    /** Image path */
    path?: (string|null);

    /** Image size */
    size?: (ISize|null);

    /** Image colors */
    colors?: (number[]|null);
}

/** Represents an Image. */
export class Image implements IImage {

    /**
     * Constructs a new Image.
     * @param [properties] Properties to set
     */
    constructor(properties?: IImage);

    /** Image path. */
    public path: string;

    /** Image size. */
    public size?: (ISize|null);

    /** Image colors. */
    public colors: number[];

    /**
     * Creates a new Image instance using the specified properties.
     * @param [properties] Properties to set
     * @returns Image instance
     */
    public static create(properties?: IImage): Image;

    /**
     * Encodes the specified Image message. Does not implicitly {@link Image.verify|verify} messages.
     * @param message Image message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(message: IImage, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Encodes the specified Image message, length delimited. Does not implicitly {@link Image.verify|verify} messages.
     * @param message Image message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(message: IImage, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes an Image message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns Image
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): Image;

    /**
     * Decodes an Image message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns Image
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): Image;

    /**
     * Verifies an Image message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): (string|null);

    /**
     * Creates an Image message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns Image
     */
    public static fromObject(object: { [k: string]: any }): Image;

    /**
     * Creates a plain object from an Image message. Also converts values to other types if specified.
     * @param message Image
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(message: Image, options?: $protobuf.IConversionOptions): { [k: string]: any };

    /**
     * Converts this Image to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any };
}
