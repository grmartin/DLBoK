# Kells (Light)

Four VSCode color themes generated from colors extracted from a scanned illuminated
manuscript (see `post-processing/generate-vscode-theme.ts` and, upstream of that,
`post-processing/extract-palette.ts` / `extract-palette-32.ts`). Built on Solarized
Light's structure (background / bg-highlight / comments / body text + 8 accent
roles), with each role's color picked algorithmically from whichever extracted
palette is fed in — not hand-chosen per palette, so the same generator produces
sensible themes from any palette shaped like `{background, groups}`.

**Two palette sources**, each in **Subtle** and **Bold** saturation variants (4
themes total):

- **Kells Light** — the full 16-color extraction (`post-processing/palette.json`):
  background + the 15 most pixel-prominent distinct colors.
- **Skimmed Kells Light** — background + the 15 *least* prominent of a 32-color
  extraction (`palette-runs/palette-32/deltaE16-skim17-31.json`), i.e. the top 16
  most-common colors ("the cream") skimmed off, leaving mostly rare accent pigments
  rather than dominant ink/parchment tones. Same background as Kells Light — only
  the pool of colors available for accent roles differs.

And independently:

- **Subtle** — accents keep each extracted color's own (often quite muted) saturation.
- **Bold** — every accent's saturation is also normalized to a fixed, higher target
  (`ACCENT_SATURATION_BOLD`), so blue/green/cyan/etc. read as vivid rather than
  muted.

## Regenerating

```
npx tsc -p tsconfig.json
node post-processing/generate-vscode-theme.js
```

Reads both palette sources listed in `SOURCES` in `generate-vscode-theme.ts` and
rewrites all four `theme/themes/*-color-theme.json` + `theme/package.json`. Prints,
per theme: which extracted colors got picked for which role, which roles ended up
as functional substitutes (no genuine hue match), and an audit report (see below).
Re-run after re-extracting a palette to pick up new colors, or add another entry to
`SOURCES` to generate a theme from a different palette entirely.

## Previewing

```
code --extensionDevelopmentPath="$(pwd)/theme" "$(pwd)"
```

Opens an Extension Development Host window with all four themes installed. Select
one via `Cmd+K Cmd+T` (or "Preferences: Color Theme").

## How role selection works (`shared/theme-roles.ts`)

Earlier versions hand-picked which extracted color (by index) served each role --
that only made sense for the one palette it was tuned against. `selectRoles()`
re-derives sensible picks for *any* palette:

1. **bodyText**: the darkest available color (ink is characteristically dark).
2. **comments**: a lighter color from bodyText's own hue family (reads as "a muted
   version of the ink"), preferring the most pixel-prominent candidate.
3. **8 accent roles** (yellow/orange/red/magenta/violet/blue/cyan/green): matched
   against real Solarized hex values (hue computed at runtime, not hardcoded) via
   global greedy nearest-hue assignment -- every (role, candidate) pair is scored by
   hue distance and assigned in ascending-distance order, so the single best match
   anywhere gets first pick. A diversity constraint (`MIN_HUE_SEPARATION_DEGREES`,
   20°) skips a candidate that would land too close to an already-assigned role's
   hue, so two roles don't both grab the same dominant hue family (this palette is
   ~70% warm ink-brown; without this, "red" and "orange" both grabbed nearly the
   same rust brown). A role that can't get both a diverse *and* genuinely close
   (`POOR_MATCH_THRESHOLD_DEGREES`, 40°) match is left unassigned here.
4. **Substitute fallback**: any unassigned role borrows the resolved color from
   whichever *other*, already-well-matched role sits closest to it on Solarized's
   own color wheel (computed from the target hues, not the extracted palette, so
   the fallback pairing is stable across palettes). This is why `magenta` and
   `violet` (and, in the full Kells palette, `red` too) show up flagged with `*` in
   the generator's console output -- centuries-old ink/parchment pigments don't
   cover the full hue wheel Solarized's synthetic palette does, so some roles are
   always going to be honest compromises rather than real matches.

Lightness/saturation normalization (re-lighting every role to a fixed HSLUV
lightness for legibility, Bold's saturation boost, the sidebar-specific tones, the
5%/10%/25% background tuning) works exactly as before, just applied to whichever
color `selectRoles()` picked instead of a hardcoded group index -- see the comments
in `generate-vscode-theme.ts` for the specific constants and why each exists.

## Audit (`shared/theme-audit.ts`)

Run automatically for every generated theme; two checks:

- **Legibility**: WCAG contrast of body/comments/each accent against the editor
  background (and sidebar text against the sidebar background). Correct tool for
  "is this text readable."
- **Distinctness**: Lab deltaE76 between every pair of roles. This is *not* the same
  question as legibility -- WCAG contrast is a luminance-only metric, and all 8
  accents are deliberately re-lit to nearly the same lightness (the actual
  Solarized trick), so WCAG contrast between any two accents is always going to
  read as ~1:1 regardless of how different their hues are. Only deltaE (which
  accounts for hue/chroma) can tell "yellow vs blue" (obviously different, deltaE
  42) apart from "cyan vs violet" (a real collision found during development,
  deltaE 17) or worse. Pairs where one role is a known substitute are excluded from
  the warning list -- `red == orange` because red is *documented* as reusing
  orange's color is expected, not a bug; the audit only flags collisions between two
  roles that were each supposed to get their own genuine match.

Bold variants generally come out more distinct than Subtle (more saturation moves
colors further apart in Lab space) -- Skimmed Kells Light Bold currently reports
zero distinctness warnings; Subtle variants keep some residual closeness among the
naturally low-saturation cool hues (blue/cyan/green), which is an expected
consequence of what "Subtle" means, not a bug Bold-style saturation-forcing would
fix without contradicting the point of having a Subtle variant at all.
