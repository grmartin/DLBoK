import {Lab, RGB} from './colors';

// WCAG 2.x relative luminance / contrast ratio -- correct for "is this text
// readable against its background" (that's literally a luminance question),
// wrong for "can a human tell these two accent colors apart." All 8 accent
// roles are deliberately re-lit to nearly the same HSLUV lightness (the
// actual Solarized trick: equal lightness, different hues, all equally
// readable against the background), which means WCAG contrast between any
// two of them is *always* going to read as ~1:1 by design regardless of how
// different their hues are -- it's a luminance-only metric and doesn't
// account for hue/chroma at all. Verified: yellow-vs-blue (obviously
// different colors) and the real cyan/violet collision both score ~1:1-1.3:1
// on WCAG contrast; only Lab deltaE76 (which does account for hue/chroma)
// tells them apart (42.2 vs 17.2).
function relativeLuminance(c: RGB): number {
    const channel = (v: number) => {
        const s = v / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    return (0.2126 * channel(c.r)) + (0.7152 * channel(c.g)) + (0.0722 * channel(c.b));
}

export function contrast(a: RGB, b: RGB): number {
    const la = relativeLuminance(a);
    const lb = relativeLuminance(b);
    const [hi, lo] = la > lb ? [la, lb] : [lb, la];
    return (hi + 0.05) / (lo + 0.05);
}

export interface LegibilityRow {
    name: string;
    hex: string;
    contrastVsBg: number;
}

export interface DistinctnessRow {
    a: string;
    b: string;
    deltaE: number;
}

// Legibility: is each named color readable against the given background
// (WCAG contrast -- a luminance/readability question).
// Distinctness: are any two named colors close enough to each other that
// they'd be hard to tell apart at a glance (Lab deltaE76 -- a perceptual
// "how different do these look overall" question, the right tool once
// lightness is deliberately held near-constant across roles). deltaE < ~10
// is "similar," < ~2.3 is the classic just-noticeable-difference threshold;
// 15 is used here as a "should be easy to tell apart while scanning code
// quickly" floor, with some margin above bare JND.
export function auditColorSet(colors: {[name: string]: RGB}, bg: RGB, distinctnessFloor: number = 15): {legibility: LegibilityRow[], distinctnessWarnings: DistinctnessRow[]} {
    const names = Object.keys(colors);

    const legibility: LegibilityRow[] = names.map((name) => ({
        name,
        hex: RGB.toHex(colors[name]),
        contrastVsBg: contrast(colors[name], bg)
    }));

    const distinctnessWarnings: DistinctnessRow[] = [];
    for (let i = 0; i < names.length; i++) {
        for (let j = i + 1; j < names.length; j++) {
            const d = Lab.distance(Lab.fromRgb(colors[names[i]]), Lab.fromRgb(colors[names[j]]));
            if (d < distinctnessFloor) {
                distinctnessWarnings.push({a: names[i], b: names[j], deltaE: d});
            }
        }
    }

    return {legibility, distinctnessWarnings};
}
