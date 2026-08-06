import {hsluvToRgb, rgbToHsluv} from 'hsluv';

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
    export function fromHex(hex: string): RGB {
        const match = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
        if (match != null) {
            return <RGB>{
                r: parseInt(match[1], 16),
                g: parseInt(match[2], 16),
                b: parseInt(match[3], 16)
            };
        } else {
            throw new Error("bad hex string");
        }
    }
    export function toHex(rgb: RGB): string {
        const channel = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
        return `#${channel(rgb.r)}${channel(rgb.g)}${channel(rgb.b)}`;
    }
    export function lerp(a: RGB, b: RGB, t: number): RGB {
        return <RGB>{
            r: a.r + ((b.r - a.r) * t),
            g: a.g + ((b.g - a.g) * t),
            b: a.b + ((b.b - a.b) * t)
        };
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
    export function fromRgb(rgb: RGB): HSLUV {
        const hsl = rgbToHsluv([rgb.r/255.0, rgb.g/255.0, rgb.b/255.0]);
        return <HSLUV>{h: hsl[0], s: hsl[1], l: hsl[2]};
    }
    // Keep hue (and, unless overridden, saturation) but override perceptual
    // lightness -- HSLUV's L is uniform across hues, so this is how
    // Solarized itself keeps all 8 of its accent colors at consistent,
    // guaranteed-legible contrast against its background regardless of hue.
    // An explicit `s` also overrides saturation, keeping only the hue --
    // used to produce a more saturated "Bold" variant from the same
    // extracted colors as the desaturated "Subtle" one.
    export function withLightness(rgb: RGB, l: number, s?: number): RGB {
        const hsl = fromRgb(rgb);
        return toRgb({h: hsl.h, s: s === undefined ? hsl.s : s, l});
    }
    // Keep hue and lightness, scale saturation by a factor (e.g. 0.75 = 25%
    // less saturated). Unlike withLightness this doesn't touch L, since the
    // point is to calm down a color's vividness without shifting how light
    // or dark it reads (and, in turn, without touching contrast ratios that
    // were tuned against its lightness).
    export function desaturate(rgb: RGB, factor: number): RGB {
        const hsl = fromRgb(rgb);
        return toRgb({h: hsl.h, s: hsl.s * factor, l: hsl.l});
    }
}

// CIE L*a*b* (D65). Cartesian and roughly perceptually uniform, so plain
// Euclidean distance between two Lab values (deltaE76) is a meaningful
// "how different do these look" metric -- unlike raw HSLUV/HSL, whose hue
// axis is circular (0 and 359 are adjacent) and whose H/S/L units aren't
// comparable, which silently distorts Euclidean-distance clustering.
export interface Lab {
    l: number;
    a: number;
    b: number;
}

export namespace Lab {
    const D65 = {x: 0.95047, y: 1.0, z: 1.08883};

    function srgbToLinear(c: number): number {
        const v = c / 255;
        return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    }

    function f(t: number): number {
        const delta = 6 / 29;
        return t > Math.pow(delta, 3) ? Math.cbrt(t) : (t / (3 * delta * delta)) + (4 / 29);
    }

    export function fromRgb(rgb: RGB): Lab {
        const rLin = srgbToLinear(rgb.r);
        const gLin = srgbToLinear(rgb.g);
        const bLin = srgbToLinear(rgb.b);

        const x = (rLin * 0.4124564) + (gLin * 0.3575761) + (bLin * 0.1804375);
        const y = (rLin * 0.2126729) + (gLin * 0.7151522) + (bLin * 0.0721750);
        const z = (rLin * 0.0193339) + (gLin * 0.1191920) + (bLin * 0.9503041);

        const fx = f(x / D65.x);
        const fy = f(y / D65.y);
        const fz = f(z / D65.z);

        return <Lab>{
            l: (116 * fy) - 16,
            a: 500 * (fx - fy),
            b: 200 * (fy - fz)
        };
    }

    export function distance(a: Lab, b: Lab): number {
        return Math.sqrt(((a.l - b.l) ** 2) + ((a.a - b.a) ** 2) + ((a.b - b.b) ** 2));
    }
}
