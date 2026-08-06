import {HSLUV, RGB} from './shared/colors';

const fs = require('fs');
const path = require('path');

const palette = JSON.parse(fs.readFileSync(`${__dirname}/palette.json`, 'utf8'));

// The raw extracted parchment average (H=60.5 S=23.4 L=75.5 in HSLUV) reads
// fine printed/IRL but is a bit much as a full-screen background on a
// monitor: 25% less saturated so it stays "parchment" without feeling heavy,
// and 10% lighter (of its own original L) so the UI reads airier and lets
// the accent colors pop rather than sitting "woodsy"/dim against it. This is
// the single source point for `bg`, so every derived chrome color
// (bgHighlight, editor/sidebar/statusBar/tab/panel/terminal backgrounds, etc.)
// inherits both adjustments automatically.
const rawBgHsl = HSLUV.fromRgb(palette.background);
const bg: RGB = HSLUV.withLightness(HSLUV.desaturate(palette.background, 0.75), Math.min(100, rawBgHsl.l * 1.10));
const g = (i: number): RGB => palette.groups[i - 1]; // g(1)..g(15), sorted by pixel share desc

const hex = RGB.toHex;
const mix = RGB.lerp;

// A near-white paper tone (Solarized's own base3) used only as a lightening
// target for derived UI-chrome tints (selection highlight, "bright" ANSI
// variants) -- not one of the 16 extracted colors, since nothing in the
// manuscript is lighter than the parchment background itself.
const PAPER_WHITE: RGB = {r: 253, g: 246, b: 227};

// The first version of this theme picked each role by hue match alone and
// ended up nearly illegible -- several extracted colors (most severely
// "yellow", at 1.15:1) were close enough in raw lightness to the parchment
// background that they were barely visible against it. Real Solarized's
// actual trick is holding all 8 accents at a consistent, contrast-safe
// lightness regardless of hue; HSLUV's L is perceptually uniform across
// hues, so re-lighting each extracted color to a fixed target via HSLUV
// (keeping its hue/saturation) reproduces that -- verified this gives
// ~4.8:1 contrast against our background across every hue tested, comfortably
// past WCAG AA's 4.5:1 for normal text.
const ACCENT_TEXT_L = 30;
const COMMENT_TEXT_L = 36; // deliberately a bit lower-contrast than accents/body text -- comments should read as secondary, just not illegible (was 1.91:1; this is ~3.8:1)

// Sidebar "ignored" (gitignored) file names need to read as clearly *more*
// faded than normal sidebar text, not just individually legible against the
// sidebar background -- reusing `comments` here originally left the two only
// 1.24:1 apart from each other (both landed near the same lightness by
// coincidence), so ignored files stopped looking distinct once the
// background got lighter. This is deliberately its own, much higher target.
const SIDEBAR_DIMMED_L = 46; // ~1.8:1 vs normal sidebar text, ~2.5:1 vs sidebar bg -- clearly faded but still readable

// "Bold" variant: several extracted hues are quite muted as raw pigment
// (blue/green/cyan/violet sit at HSLUV S=7-31%; only yellow/orange/red are
// naturally vivid at S=60-81%). Rather than a flat multiplier -- which would
// barely move the already-weak hues -- Bold targets a single fixed
// saturation for every accent, the same uniformity trick ACCENT_TEXT_L uses
// for lightness, so the boost is consistent across hues instead of
// proportional to however saturated the raw pigment happened to be.
const ACCENT_SATURATION_BOLD = 75;

interface Variant {
    label: string;
    fileSlug: string;
    accentSaturation?: number; // undefined = keep each color's own extracted saturation
}

function buildTheme(variant: Variant) {
    const relight = (rgb: RGB, l: number) => HSLUV.withLightness(rgb, l, variant.accentSaturation);

    // --- Role mapping -------------------------------------------------
    // See theme/README.md for the full rationale. Short version:
    // background/comments/body-text and yellow/orange/blue/green are
    // genuine perceptual matches (closest CIE Lab hue to Solarized's role
    // of the same name, computed from post-processing/palette.json), re-lit
    // per above for legibility (and, in the Bold variant, saturation).
    // red/magenta/violet have no true match -- centuries-old ink and
    // parchment pigments don't cover that part of the hue wheel -- so those
    // three are FUNCTIONAL substitutes, not hue matches.
    const blueAccent = relight(g(11), ACCENT_TEXT_L);
    const bgHighlightBase = mix(bg, g(1), 0.35); // derived tint from raw g(1) -- sidebar/activity-bar background

    const roles = {
        // Core tones -- never saturation-boosted, Bold only affects accents
        bg,                                          // background parchment average
        bgHighlight: HSLUV.withLightness(bgHighlightBase, Math.min(100, HSLUV.fromRgb(bgHighlightBase).l * 1.05)), // 5% lighter still, per user request
        comments: HSLUV.withLightness(g(1), COMMENT_TEXT_L),   // #948269 raw -- muted tan, re-lit for legibility
        bodyText: g(2),                              // #4e3b2c -- most-represented ink brown, already high-contrast as extracted

        // Perceptual hue matches (closest Lab hue angle to Solarized's own), re-lit for legibility
        yellow: relight(g(13), ACCENT_TEXT_L),       // raw #cea859
        orange: relight(g(15), ACCENT_TEXT_L),       // raw #a45a2d -- our reddest color is still hue-wise closer to orange than red
        blue: blueAccent,
        green: relight(g(14), ACCENT_TEXT_L),        // raw #6a7c69

        // Functional substitutes -- no matching pigment exists in this palette
        red: relight(g(5), ACCENT_TEXT_L),           // raw #2e1e11, darkest ink -- borrows red's *emphasis* role, not its hue
        // cyan and violet are both near-neutral grays as extracted (barely any
        // hue at all), so re-lighting both to the same L made them collapse
        // into nearly the same color -- offset them a few L apart so they stay
        // distinguishable from each other, not just from the background.
        cyan: relight(g(10), ACCENT_TEXT_L + 4),     // raw #757b7d -- weakly cool neutral, nearest thing to a cyan we have
        violet: relight(g(7), ACCENT_TEXT_L - 4),    // raw #3b3e3d -- neutral charcoal stand-in
        magenta: blueAccent                          // reuses blue -- no warm-toward-purple pigment exists at all
    };

    // Leftover extracted colors, used for secondary UI chrome / ANSI "bright"
    // variants rather than left on the cutting-room floor. brown is used as a
    // background wash (raw is fine there); the rest are used as token-color
    // foregrounds below, so -- same legibility fix as the main accent roles --
    // they're re-lit rather than used raw.
    const spare = {
        tan: HSLUV.withLightness(g(3), COMMENT_TEXT_L),   // raw #776248 -- punctuation, meant to read as subtle like comments
        brown: g(6),                                      // #624122 -- used as a background wash, kept raw
        rust: relight(g(8), ACCENT_TEXT_L),                // raw #87572c
        clay: relight(g(9), ACCENT_TEXT_L),                // raw #a4764f
        ochre: relight(g(12), ACCENT_TEXT_L)               // raw #a27f3f
    };

    const bright = (c: RGB) => mix(c, PAPER_WHITE, 0.35);
    const faint = (c: RGB) => mix(bg, c, 0.55);

    // Sidebar/activity-bar rows render against `bgHighlight` (#b5a58e), which is
    // darker than the editor background `bg` -- using raw bodyText there (meant
    // for the lighter editor bg) read as too dark/harsh, while the ignored-file
    // color below was blended toward the wrong (too-light) background and ended
    // up nearly invisible (1.6:1) against the sidebar. Both are dedicated,
    // sidebar-specific tones tuned against the sidebar's actual background
    // rather than reusing the editor-context roles.
    const sidebarText = HSLUV.withLightness(g(2), ACCENT_TEXT_L);          // bodyText's hue, a touch lighter than editor body text
    const sidebarDimmed = HSLUV.withLightness(g(1), SIDEBAR_DIMMED_L);    // comments' hue, but deliberately much lighter than sidebarText so ignored files read as distinct, not just individually legible

    const theme = {
        name: variant.label,
        type: 'light',
        colors: {
            'foreground': hex(roles.bodyText),
            'descriptionForeground': hex(roles.comments),
            'errorForeground': hex(roles.red),
            'focusBorder': hex(roles.blue),

            'editor.background': hex(roles.bg),
            'editor.foreground': hex(roles.bodyText),
            'editorLineNumber.foreground': hex(faint(roles.comments)),
            'editorLineNumber.activeForeground': hex(roles.bodyText),
            'editor.lineHighlightBackground': hex(roles.bgHighlight),
            'editor.selectionBackground': hex(mix(roles.bg, roles.blue, 0.3)),
            'editor.inactiveSelectionBackground': hex(mix(roles.bg, roles.blue, 0.15)),
            'editor.wordHighlightBackground': hex(mix(roles.bg, roles.cyan, 0.2)),
            'editorCursor.foreground': hex(roles.red),
            'editorIndentGuide.background': hex(roles.bgHighlight),
            'editorIndentGuide.activeBackground': hex(roles.comments),
            'editorIndentGuide.background1': hex(roles.bgHighlight),
            'editorIndentGuide.activeBackground1': hex(roles.comments),
            'editorWhitespace.foreground': hex(faint(roles.comments)),
            'editorBracketMatch.background': hex(mix(roles.bg, roles.orange, 0.2)),
            'editorBracketMatch.border': hex(roles.orange),
            // VSCode's bracket-pair colorization is a separate feature from
            // tokenColors below -- without these keys it falls back to its own
            // default (vivid, un-themed) rainbow palette.
            'editorBracketHighlight.foreground1': hex(spare.tan),
            'editorBracketHighlight.foreground2': hex(spare.clay),
            'editorBracketHighlight.foreground3': hex(spare.ochre),
            'editorBracketHighlight.foreground4': hex(spare.rust),
            'editorBracketHighlight.foreground5': hex(roles.comments),
            'editorBracketHighlight.foreground6': hex(spare.tan),
            'editorBracketHighlight.unexpectedBracket.foreground': hex(roles.red),

            'sideBar.background': hex(roles.bgHighlight),
            'sideBar.foreground': hex(sidebarText),
            'sideBarTitle.foreground': hex(sidebarText),
            'sideBarSectionHeader.background': hex(roles.bgHighlight),
            'sideBarSectionHeader.foreground': hex(sidebarDimmed),

            'activityBar.background': hex(roles.bgHighlight),
            'activityBar.foreground': hex(sidebarText),
            'activityBar.inactiveForeground': hex(sidebarDimmed),
            'activityBarBadge.background': hex(roles.blue),
            'activityBarBadge.foreground': hex(roles.bg),

            'statusBar.background': hex(roles.bodyText),
            'statusBar.foreground': hex(roles.bg),
            'statusBar.noFolderBackground': hex(spare.brown),
            'statusBar.debuggingBackground': hex(roles.orange),

            'titleBar.activeBackground': hex(roles.bgHighlight),
            'titleBar.activeForeground': hex(roles.bodyText),
            'titleBar.inactiveBackground': hex(roles.bgHighlight),
            'titleBar.inactiveForeground': hex(roles.comments),

            'tab.activeBackground': hex(roles.bg),
            'tab.activeForeground': hex(roles.bodyText),
            'tab.inactiveBackground': hex(roles.bgHighlight),
            'tab.inactiveForeground': hex(roles.comments),
            'tab.border': hex(roles.bgHighlight),
            'tab.activeBorderTop': hex(roles.blue),

            'panel.background': hex(roles.bgHighlight),
            'panel.border': hex(roles.comments),
            'panelTitle.activeForeground': hex(roles.bodyText),
            'panelTitle.inactiveForeground': hex(roles.comments),

            'input.background': hex(PAPER_WHITE),
            'input.foreground': hex(roles.bodyText),
            'input.border': hex(roles.comments),
            'inputOption.activeBorder': hex(roles.blue),
            'dropdown.background': hex(PAPER_WHITE),
            'dropdown.foreground': hex(roles.bodyText),

            'button.background': hex(roles.blue),
            'button.foreground': hex(roles.bg),
            'button.hoverBackground': hex(mix(roles.blue, {r: 0, g: 0, b: 0}, 0.15)),

            'badge.background': hex(roles.blue),
            'badge.foreground': hex(roles.bg),

            'list.activeSelectionBackground': hex(mix(roles.bg, roles.blue, 0.25)),
            'list.activeSelectionForeground': hex(roles.bodyText),
            'list.inactiveSelectionBackground': hex(roles.bgHighlight),
            'list.hoverBackground': hex(mix(roles.bg, roles.blue, 0.12)),
            'list.highlightForeground': hex(roles.blue),

            'scrollbarSlider.background': hex(mix(roles.bg, roles.comments, 0.4)),
            'scrollbarSlider.hoverBackground': hex(mix(roles.bg, roles.comments, 0.6)),
            'scrollbarSlider.activeBackground': hex(mix(roles.bg, roles.comments, 0.8)),

            'diffEditor.insertedTextBackground': hex(mix(roles.bg, roles.green, 0.2)),
            'diffEditor.removedTextBackground': hex(mix(roles.bg, roles.red, 0.15)),

            'gitDecoration.modifiedResourceForeground': hex(roles.orange),
            'gitDecoration.deletedResourceForeground': hex(roles.red),
            'gitDecoration.untrackedResourceForeground': hex(roles.green),
            'gitDecoration.ignoredResourceForeground': hex(sidebarDimmed),

            'terminal.background': hex(roles.bg),
            'terminal.foreground': hex(roles.bodyText),
            'terminal.ansiBlack': hex(roles.bodyText),
            'terminal.ansiRed': hex(roles.red),
            'terminal.ansiGreen': hex(roles.green),
            'terminal.ansiYellow': hex(roles.yellow),
            'terminal.ansiBlue': hex(roles.blue),
            'terminal.ansiMagenta': hex(roles.magenta),
            'terminal.ansiCyan': hex(roles.cyan),
            'terminal.ansiWhite': hex(roles.comments),
            'terminal.ansiBrightBlack': hex(bright(roles.bodyText)),
            'terminal.ansiBrightRed': hex(bright(roles.red)),
            'terminal.ansiBrightGreen': hex(bright(roles.green)),
            'terminal.ansiBrightYellow': hex(bright(roles.yellow)),
            'terminal.ansiBrightBlue': hex(bright(roles.blue)),
            'terminal.ansiBrightMagenta': hex(bright(roles.magenta)),
            'terminal.ansiBrightCyan': hex(bright(roles.cyan)),
            'terminal.ansiBrightWhite': hex(PAPER_WHITE)
        },
        tokenColors: [
            {
                settings: {foreground: hex(roles.bodyText)}
            },
            {
                scope: ['comment', 'punctuation.definition.comment'],
                settings: {foreground: hex(roles.comments), fontStyle: 'italic'}
            },
            {
                scope: ['string', 'string.quoted'],
                settings: {foreground: hex(roles.green)}
            },
            {
                scope: ['constant.numeric', 'constant.language', 'constant.character'],
                settings: {foreground: hex(spare.rust)}
            },
            {
                scope: ['keyword', 'storage', 'storage.type', 'keyword.control'],
                settings: {foreground: hex(roles.orange)}
            },
            {
                scope: ['keyword.operator'],
                settings: {foreground: hex(roles.bodyText)}
            },
            {
                scope: ['entity.name.function', 'support.function'],
                settings: {foreground: hex(roles.blue)}
            },
            {
                scope: ['entity.name.type', 'entity.name.class', 'support.type', 'support.class'],
                settings: {foreground: hex(roles.yellow)}
            },
            {
                scope: ['entity.name.tag'],
                settings: {foreground: hex(roles.red)}
            },
            {
                scope: ['entity.other.attribute-name'],
                settings: {foreground: hex(spare.ochre)}
            },
            {
                scope: ['variable', 'variable.other'],
                settings: {foreground: hex(roles.bodyText)}
            },
            {
                scope: ['variable.parameter'],
                settings: {foreground: hex(spare.clay)}
            },
            {
                scope: ['constant.other', 'variable.other.constant'],
                settings: {foreground: hex(roles.cyan)}
            },
            {
                scope: ['punctuation', 'meta.brace'],
                settings: {foreground: hex(spare.tan)}
            },
            {
                scope: ['markup.bold'],
                settings: {fontStyle: 'bold'}
            },
            {
                scope: ['markup.italic'],
                settings: {fontStyle: 'italic'}
            },
            {
                scope: ['invalid', 'invalid.illegal'],
                settings: {foreground: hex(PAPER_WHITE), background: hex(roles.red)}
            }
        ],
        // TypeScript (and other languages with a semantic-token provider) colors
        // many identifiers -- notably type parameters like the "TValue" in
        // `interface Foo<TValue>` -- via semantic highlighting, which overrides
        // tokenColors above for the scopes it covers. Without this block those
        // fall back to VSCode's own default semantic palette instead of ours.
        // Mirrors the same role choices as the tokenColors scopes above.
        semanticTokenColors: {
            'type': hex(roles.yellow),
            'class': hex(roles.yellow),
            'interface': hex(roles.yellow),
            'enum': hex(roles.yellow),
            'struct': hex(roles.yellow),
            'typeParameter': hex(roles.yellow),
            'function': hex(roles.blue),
            'method': hex(roles.blue),
            'parameter': hex(spare.clay),
            'property': hex(roles.bodyText),
            'variable': hex(roles.bodyText),
            'enumMember': hex(roles.cyan),
            'namespace': hex(spare.ochre),
            'decorator': hex(roles.orange)
        }
    };

    return {theme, roles};
}

const VARIANTS: Variant[] = [
    {label: 'Kells Light Subtle', fileSlug: 'kells-light-subtle'},
    {label: 'Kells Light Bold', fileSlug: 'kells-light-bold', accentSaturation: ACCENT_SATURATION_BOLD}
];

const themeDir = path.join(__dirname, '..', 'theme');
const themesSubdir = path.join(themeDir, 'themes');
fs.mkdirSync(themesSubdir, {recursive: true});

for (const variant of VARIANTS) {
    const {theme, roles} = buildTheme(variant);
    const outPath = path.join(themesSubdir, `${variant.fileSlug}-color-theme.json`);
    fs.writeFileSync(outPath, JSON.stringify(theme, null, 2));
    console.log(`Wrote ${outPath}`);
    console.log(`  Role -> color mapping (${variant.label}):`);
    Object.entries(roles).forEach(([name, c]) => console.log(`    ${name.padEnd(12)} ${hex(c as RGB)}`));
}

const manifest = {
    name: 'kells-color-themes',
    displayName: 'Kells',
    description: 'VSCode themes built from colors extracted from a scanned illuminated manuscript (see post-processing/generate-vscode-theme.ts).',
    version: '0.0.1',
    publisher: 'dlbok',
    engines: {vscode: '^1.60.0'},
    categories: ['Themes'],
    contributes: {
        themes: VARIANTS.map((variant) => ({
            label: variant.label,
            uiTheme: 'vs',
            path: `./themes/${variant.fileSlug}-color-theme.json`
        }))
    }
};

fs.writeFileSync(path.join(themeDir, 'package.json'), JSON.stringify(manifest, null, 2));
console.log(`Wrote ${path.join(themeDir, 'package.json')}`);
