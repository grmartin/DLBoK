import * as _ from 'lodash';
import {HSLUV, RGB} from './colors';
import {PaletteEntry} from './palette';

// Real Solarized accent hex values (see theme/README.md / ethanschoonover.com/
// solarized). Target hues are computed from these at runtime rather than
// hardcoded as numbers, so the mapping stays traceable to an actual color.
const SOLARIZED_ACCENT_HEX = {
    yellow: '#b58900',
    orange: '#cb4b16',
    red: '#dc322f',
    magenta: '#d33682',
    violet: '#6c71c4',
    blue: '#268bd2',
    cyan: '#2aa198',
    green: '#859900'
};

export type AccentRole = keyof typeof SOLARIZED_ACCENT_HEX;
const ACCENT_ROLES = Object.keys(SOLARIZED_ACCENT_HEX) as AccentRole[];

export interface RoleSelection {
    bodyText: PaletteEntry;
    comments: PaletteEntry;
    accents: {[role in AccentRole]: PaletteEntry};
    // true = no genuine hue match existed in this palette; the role borrows
    // another accent's resolved color rather than using its own hue.
    isSubstitute: {[role in AccentRole]: boolean};
    // Leftover groups (not used for bodyText/comments/any unique accent),
    // for secondary UI chrome -- cycle through these if more slots are
    // needed than groups remain.
    spare: PaletteEntry[];
}

function hueDistance(a: number, b: number): number {
    const d = Math.abs(a - b) % 360;
    return d > 180 ? 360 - d : d;
}

// Beyond this hue distance (degrees), a "closest available" match is no
// longer a real match -- e.g. our reddest extracted ink still sits ~15-20
// degrees from Solarized's actual orange, which is a fine match, but
// nothing in a manuscript's ink/parchment gets within 40 degrees of
// magenta or violet.
const POOR_MATCH_THRESHOLD_DEGREES = 40;

// Picks which extracted color serves each Solarized-style role, given ANY
// palette shaped like { groups: PaletteEntry[] } (background is handled
// separately by the caller, since it's never picked from `groups`). This
// replaces hand-picking group indices per palette -- that only worked for
// the one palette it was tuned against; this re-derives sensible picks for
// whatever palette (the original 16-color extraction, the "skimmed"
// rare-colors subset, or any future one) it's given.
export function selectRoles(groups: PaletteEntry[]): RoleSelection {
    const hue = (e: PaletteEntry) => HSLUV.fromRgb(e).h;
    const lightness = (e: PaletteEntry) => HSLUV.fromRgb(e).l;

    const pool = groups.slice();

    // bodyText: darkest available color -- ink is characteristically dark
    // regardless of which palette this is.
    const bodyText = _.minBy(pool, lightness)!;
    _.pull(pool, bodyText);

    // comments: a lighter tone from bodyText's own hue family (reads as "a
    // muted version of the ink"), preferring whichever candidate has the
    // most pixel share. Falls back to "just the lightest remaining color"
    // if nothing shares bodyText's hue family closely enough.
    const bodyHue = hue(bodyText);
    const bodyL = lightness(bodyText);
    const commentCandidates = pool.filter((e) => lightness(e) > bodyL + 12 && hueDistance(hue(e), bodyHue) < 45);
    const comments = (commentCandidates.length ? _.maxBy(commentCandidates, 'share') : _.maxBy(pool, lightness))!;
    _.pull(pool, comments);

    // 8 accent roles: global greedy nearest-hue assignment. Every
    // (role, candidate) pair is scored by hue distance, sorted ascending,
    // and assigned in that order -- so the single best match anywhere gets
    // first pick, not just the best match for whichever role is considered
    // first.
    const targetHue: {[role in AccentRole]: number} = {} as any;
    for (const role of ACCENT_ROLES) {
        targetHue[role] = HSLUV.fromRgb(RGB.fromHex(SOLARIZED_ACCENT_HEX[role])).h;
    }

    const candidates: {role: AccentRole, entry: PaletteEntry, distance: number}[] = [];
    for (const role of ACCENT_ROLES) {
        for (const entry of pool) {
            candidates.push({role, entry, distance: hueDistance(hue(entry), targetHue[role])});
        }
    }
    candidates.sort((a, b) => a.distance - b.distance);

    // Pure "closest to its own target" greedy assignment let two roles both
    // grab near-identical hues from a brown-dominated palette (e.g. "red"
    // and "orange" both landing on nearly the same rust brown) -- neither
    // pick was wrong for its own target, but together they collided. This
    // pass adds a diversity constraint (skip a candidate within
    // MIN_HUE_SEPARATION_DEGREES of an already-assigned role's hue) and
    // caps match quality at POOR_MATCH_THRESHOLD_DEGREES, with no fallback
    // pass that ignores either constraint: Solarized's own orange (20.5 deg)
    // and red (12.6 deg) targets are only ~8 degrees apart, closer together
    // than MIN_HUE_SEPARATION_DEGREES itself, so nothing can force two
    // *good* matches to also stay 20 degrees apart when their targets never
    // were. A role that can't get both a diverse AND genuinely-good match
    // here is deliberately left unassigned, so it correctly falls through
    // to the substitute fallback below -- which produces an honest,
    // clearly-labeled reuse (e.g. "red borrows orange's color") instead of
    // a silent near-duplicate that looks like two independent matches.
    const MIN_HUE_SEPARATION_DEGREES = 20;
    const assigned: {[role in AccentRole]?: PaletteEntry} = {};
    const usedByAccent = new Set<PaletteEntry>();

    for (const c of candidates) {
        if (c.distance > POOR_MATCH_THRESHOLD_DEGREES) continue;
        if (assigned[c.role] || usedByAccent.has(c.entry)) continue;
        const assignedHues = Object.values(assigned).map((e) => hue(e as PaletteEntry));
        if (assignedHues.some((h) => hueDistance(h, hue(c.entry)) < MIN_HUE_SEPARATION_DEGREES)) continue;
        assigned[c.role] = c.entry;
        usedByAccent.add(c.entry);
    }

    // Any role with no assignment (pool ran dry) or only a poor-fit
    // assignment borrows the resolved color from whichever OTHER
    // already-well-matched role sits closest to it on Solarized's own
    // color wheel -- computed from the target hues, not the extracted
    // palette, so the fallback pairing is stable regardless of what
    // palette this runs against.
    const isSubstitute: {[role in AccentRole]?: boolean} = {};
    for (const role of ACCENT_ROLES) {
        const distance = assigned[role] ? hueDistance(hue(assigned[role]!), targetHue[role]) : Infinity;
        isSubstitute[role] = !assigned[role] || distance > POOR_MATCH_THRESHOLD_DEGREES;
    }
    for (const role of ACCENT_ROLES) {
        if (!isSubstitute[role]) continue;
        const wellMatched = ACCENT_ROLES.filter((r) => r !== role && assigned[r] && !isSubstitute[r]);
        const nearest = _.minBy(wellMatched, (r) => hueDistance(targetHue[r], targetHue[role]));
        if (nearest) {
            assigned[role] = assigned[nearest];
        } else if (!assigned[role]) {
            assigned[role] = bodyText; // last resort; shouldn't happen with >= 9 groups
        }
    }

    const usedFinal = new Set(Object.values(assigned));
    const leftover = groups.filter((e) => e !== bodyText && e !== comments && !usedFinal.has(e));

    return {
        bodyText,
        comments,
        accents: assigned as {[role in AccentRole]: PaletteEntry},
        isSubstitute: isSubstitute as {[role in AccentRole]: boolean},
        spare: leftover.length ? leftover : groups
    };
}
