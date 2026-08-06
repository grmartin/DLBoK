import {HSLUV, RGB} from './shared/colors';
import {AccentRole, RoleSelection, selectRoles} from './shared/theme-roles';
import {auditColorSet} from './shared/theme-audit';
import {PaletteEntry} from './shared/palette';

const fs = require('fs');
const path = require('path');

const hex = RGB.toHex;
const mix = RGB.lerp;

// A near-white paper tone (Solarized's own base3) used only as a lightening
// target for derived UI-chrome tints (selection highlight, "bright" ANSI
// variants) -- not one of the extracted colors, since nothing in the
// manuscript is lighter than the parchment background itself.
const PAPER_WHITE: RGB = {r: 253, g: 246, b: 227};

// The first version of this theme picked each role by hue match alone and
// ended up nearly illegible -- several extracted colors (most severely
// "yellow", at 1.15:1) were close enough in raw lightness to the parchment
// background that they were barely visible against it. Real Solarized's
// actual trick is holding all 8 accents at a consistent, contrast-safe
// lightness regardless of hue; HSLUV's L is perceptually uniform across
// hues, so re-lighting each extracted color to a fixed target via HSLUV
// (keeping its hue/saturation) reproduces that.
const ACCENT_TEXT_L = 30;
const COMMENT_TEXT_L = 36; // deliberately a bit lower-contrast than accents/body text -- comments should read as secondary, just not illegible

// Sidebar "ignored" (gitignored) file names need to read as clearly *more*
// faded than normal sidebar text, not just individually legible against the
// sidebar background -- this is deliberately its own, much higher target
// than COMMENT_TEXT_L (see theme/README.md for the "1.24:1 apart from each
// other" bug this was fixed after).
const SIDEBAR_DIMMED_L = 46;

// "Bold" variant: several extracted hues are quite muted as raw pigment.
// Rather than a flat multiplier -- which would barely move the already-weak
// hues -- Bold targets a single fixed saturation for every accent, the same
// uniformity trick ACCENT_TEXT_L uses for lightness.
const ACCENT_SATURATION_BOLD = 75;

interface PaletteSource {
    slugPrefix: string;
    labelPrefix: string;
    paletteFile: string; // absolute path to a palette.json-shaped file
}

interface Variant {
    label: string;
    fileSlug: string;
    accentSaturation?: number; // undefined = keep each color's own extracted saturation
}

const VARIANTS: Variant[] = [
    {label: 'Subtle', fileSlug: 'subtle'},
    {label: 'Bold', fileSlug: 'bold', accentSaturation: ACCENT_SATURATION_BOLD}
];

const SOURCES: PaletteSource[] = [
    {
        slugPrefix: 'kells-light',
        labelPrefix: 'Kells Light',
        paletteFile: path.join(__dirname, 'palette.json')
    },
    {
        // The 15 rarest, most pixel-share-poor colors (background's top-16
        // most-prominent groups stripped out -- "skimming the cream off the
        // top"), so the accent roles are picked from what's actually rare/
        // distinct in the manuscript rather than the dominant ink/parchment
        // gradient. Same background as the original -- only the pool of
        // colors available for accent roles differs.
        slugPrefix: 'skimmed-kells-light',
        labelPrefix: 'Skimmed Kells Light',
        paletteFile: path.join(__dirname, 'palette-runs', 'palette-32', 'deltaE16-skim17-31.json')
    }
];

function buildTheme(background: PaletteEntry, roleSelection: RoleSelection, variant: Variant) {
    const relight = (e: PaletteEntry, l: number) => HSLUV.withLightness(e, l, variant.accentSaturation);
    const accent = (role: AccentRole, lAdjust: number = 0) => relight(roleSelection.accents[role], ACCENT_TEXT_L + lAdjust);

    // Bold's saturation override never applies to core tones (bg/comments/
    // bodyText) or sidebar text -- only the 8 accent roles.
    const rawBgHsl = HSLUV.fromRgb(background);
    const bg: RGB = HSLUV.withLightness(HSLUV.desaturate(background, 0.75), Math.min(100, rawBgHsl.l * 1.10));
    const bgHighlightBase = mix(bg, roleSelection.comments, 0.35);

    // cyan and violet are the two roles most likely to end up near-neutral
    // (weak/no real hue match), which made them collapse into nearly the
    // same color when both re-lit to the same L -- offset them a few L
    // apart so they stay distinguishable from each other, not just from the
    // background. See theme/README.md.
    const roles = {
        bg,
        bgHighlight: HSLUV.withLightness(bgHighlightBase, Math.min(100, HSLUV.fromRgb(bgHighlightBase).l * 1.05)),
        comments: HSLUV.withLightness(roleSelection.comments, COMMENT_TEXT_L),
        bodyText: roleSelection.bodyText as RGB,

        yellow: accent('yellow'),
        orange: accent('orange'),
        blue: accent('blue'),
        green: accent('green'),
        red: accent('red'),
        cyan: accent('cyan', 4),
        violet: accent('violet', -4),
        magenta: accent('magenta')
    };

    const spareAt = (i: number): PaletteEntry => roleSelection.spare[i % roleSelection.spare.length];
    const spare = {
        tan: HSLUV.withLightness(spareAt(0), COMMENT_TEXT_L),
        brown: spareAt(1) as RGB,
        rust: relight(spareAt(2), ACCENT_TEXT_L),
        clay: relight(spareAt(3), ACCENT_TEXT_L),
        ochre: relight(spareAt(4), ACCENT_TEXT_L)
    };

    const bright = (c: RGB) => mix(c, PAPER_WHITE, 0.35);
    const faint = (c: RGB) => mix(bg, c, 0.55);

    const sidebarText = HSLUV.withLightness(roleSelection.bodyText, ACCENT_TEXT_L);
    const sidebarDimmed = HSLUV.withLightness(roleSelection.comments, SIDEBAR_DIMMED_L);

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
            {settings: {foreground: hex(roles.bodyText)}},
            {scope: ['comment', 'punctuation.definition.comment'], settings: {foreground: hex(roles.comments), fontStyle: 'italic'}},
            {scope: ['string', 'string.quoted'], settings: {foreground: hex(roles.green)}},
            {scope: ['constant.numeric', 'constant.language', 'constant.character'], settings: {foreground: hex(spare.rust)}},
            {scope: ['keyword', 'storage', 'storage.type', 'keyword.control'], settings: {foreground: hex(roles.orange)}},
            {scope: ['keyword.operator'], settings: {foreground: hex(roles.bodyText)}},
            {scope: ['entity.name.function', 'support.function'], settings: {foreground: hex(roles.blue)}},
            {scope: ['entity.name.type', 'entity.name.class', 'support.type', 'support.class'], settings: {foreground: hex(roles.yellow)}},
            {scope: ['entity.name.tag'], settings: {foreground: hex(roles.red)}},
            {scope: ['entity.other.attribute-name'], settings: {foreground: hex(spare.ochre)}},
            {scope: ['variable', 'variable.other'], settings: {foreground: hex(roles.bodyText)}},
            {scope: ['variable.parameter'], settings: {foreground: hex(spare.clay)}},
            {scope: ['constant.other', 'variable.other.constant'], settings: {foreground: hex(roles.cyan)}},
            {scope: ['punctuation', 'meta.brace'], settings: {foreground: hex(spare.tan)}},
            {scope: ['markup.bold'], settings: {fontStyle: 'bold'}},
            {scope: ['markup.italic'], settings: {fontStyle: 'italic'}},
            {scope: ['invalid', 'invalid.illegal'], settings: {foreground: hex(PAPER_WHITE), background: hex(roles.red)}}
        ],
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

    return {theme, roles, sidebarText, sidebarDimmed};
}

function auditAndReport(label: string, roles: ReturnType<typeof buildTheme>['roles'], sidebarText: RGB, sidebarDimmed: RGB, isSubstitute: {[role in AccentRole]: boolean}) {
    const editorAudit = auditColorSet(
        {comments: roles.comments, bodyText: roles.bodyText, yellow: roles.yellow, orange: roles.orange, red: roles.red, magenta: roles.magenta, violet: roles.violet, blue: roles.blue, cyan: roles.cyan, green: roles.green},
        roles.bg
    );
    const sidebarAudit = auditColorSet({normal: sidebarText, dimmed: sidebarDimmed}, roles.bgHighlight);

    console.log(`  Audit (${label}):`);
    const belowAA = editorAudit.legibility.filter((r) => r.contrastVsBg < 4.5 && r.name !== 'comments');
    if (belowAA.length) {
        console.log(`    LOW CONTRAST vs bg (< 4.5:1): ${belowAA.map((r) => `${r.name} ${r.hex} ${r.contrastVsBg.toFixed(2)}:1`).join(', ')}`);
    } else {
        console.log('    All accent/body colors >= 4.5:1 vs background.');
    }

    // A substitute role (e.g. "magenta reuses red") is *expected* to be
    // indistinct from whatever it reused -- that's already reported via the
    // "*" line above, so only pairs where BOTH roles got a genuine hue
    // match are worth surfacing here as an actual, unexpected collision.
    const isKnownRole = (name: string): boolean => name in isSubstitute;
    const genuineWarnings = [...editorAudit.distinctnessWarnings, ...sidebarAudit.distinctnessWarnings]
        .filter((w) => !((isKnownRole(w.a) && isSubstitute[w.a as AccentRole]) || (isKnownRole(w.b) && isSubstitute[w.b as AccentRole])));

    if (genuineWarnings.length) {
        console.log(`    NOT DISTINCT from each other (deltaE < 15, both genuine matches): ${genuineWarnings.map((w) => `${w.a}/${w.b} dE=${w.deltaE.toFixed(1)}`).join(', ')}`);
    } else {
        console.log('    All genuinely-matched roles pairwise distinct (deltaE >= 15), including sidebar normal/dimmed.');
    }
}

const themeDir = path.join(__dirname, '..', 'theme');
const themesSubdir = path.join(themeDir, 'themes');
fs.mkdirSync(themesSubdir, {recursive: true});

const allThemeEntries: {label: string, fileSlug: string}[] = [];

for (const source of SOURCES) {
    const palette = JSON.parse(fs.readFileSync(source.paletteFile, 'utf8'));
    const roleSelection = selectRoles(palette.groups);

    console.log(`\n=== ${source.labelPrefix} (from ${path.relative(themeDir, source.paletteFile)}) ===`);
    console.log(`  bodyText: ${hex(roleSelection.bodyText)}  comments: ${hex(roleSelection.comments)}`);
    const substitutes = Object.entries(roleSelection.isSubstitute).filter(([, v]) => v).map(([k]) => k);
    console.log(`  accents: ${Object.entries(roleSelection.accents).map(([role, e]) => `${role}=${hex(e as RGB)}${roleSelection.isSubstitute[role as AccentRole] ? '*' : ''}`).join(' ')}`);
    console.log(`  (* = functional substitute, no genuine hue match: ${substitutes.join(', ') || 'none'})`);

    for (const variant of VARIANTS) {
        const {theme, roles, sidebarText, sidebarDimmed} = buildTheme(palette.background, roleSelection, variant);
        const fileSlug = `${source.slugPrefix}-${variant.fileSlug}`;
        const label = `${source.labelPrefix} ${variant.label}`;
        theme.name = label;

        const outPath = path.join(themesSubdir, `${fileSlug}-color-theme.json`);
        fs.writeFileSync(outPath, JSON.stringify(theme, null, 2));
        console.log(`  Wrote ${path.relative(themeDir, outPath)}`);
        auditAndReport(label, roles, sidebarText, sidebarDimmed, roleSelection.isSubstitute);

        allThemeEntries.push({label, fileSlug});
    }
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
        themes: allThemeEntries.map((entry) => ({
            label: entry.label,
            uiTheme: 'vs',
            path: `./themes/${entry.fileSlug}-color-theme.json`
        }))
    }
};

fs.writeFileSync(path.join(themeDir, 'package.json'), JSON.stringify(manifest, null, 2));
console.log(`\nWrote ${path.join(themeDir, 'package.json')} (${allThemeEntries.length} themes)`);
