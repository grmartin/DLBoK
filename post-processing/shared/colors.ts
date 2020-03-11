import {hsluvToRgb} from 'hsluv';

export interface RGB {
    r: number;
    g: number;
    b: number;
}

export namespace RGB {
    export function fromInteger(int: number): RGB {
        return <RGB>{
            r:((int & 0xFF0000) >> 16),
            g:((int & 0xFF00) >> 8),
            b:((int & 0xFF))
        };
    }
    export function fromString(rgb: string): RGB {
        var match = /rgb\(([0-9]{1,3}),([0-9]{1,3}),([0-9]{1,3})\)/im.exec(rgb);
        if (match != null) {
            return <RGB>{
                r:Number(match[1]),
                g:Number(match[2]),
                b:Number(match[3])
            };
        } else {
            throw new Error("bad string");
        }
    }
}

export interface HSLUV {
    h: number;
    s: number;
    l: number;
}

export namespace HSLUV {
    export function toRgb(hsl: HSLUV): RGB {
        const rgb = hsluvToRgb([hsl.h, hsl.s, hsl.l]);
        return <RGB>{
            r: Math.round(rgb[0]*255.0),
            g: Math.round(rgb[1]*255.0),
            b: Math.round(rgb[2]*255.0)
        };
    }
}
