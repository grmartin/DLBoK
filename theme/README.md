# Kells (Light)

Two VSCode color themes generated from colors extracted from a scanned illuminated
manuscript (see `post-processing/generate-vscode-theme.ts` and, upstream of that,
`post-processing/extract-palette.ts`). Built on Solarized Light's structure
(background / bg-highlight / comments / body text + 8 accent roles), with each
role's color swapped for the closest available manuscript ink or parchment tone.

- **Kells Light Subtle** — accents keep each extracted color's own (often quite
  muted) saturation, only lightness is normalized for legibility.
- **Kells Light Bold** — same hues, but every accent's saturation is also
  normalized to a fixed, higher target (`ACCENT_SATURATION_BOLD`), so blue/green/
  cyan/etc. read as vivid rather than muted. Background/comments/body text are
  unchanged between the two — only the 8 accent roles differ.

## Regenerating

```
npx tsc -p tsconfig.json
node post-processing/generate-vscode-theme.js
```

Reads `post-processing/palette.json` (produced by `extract-palette.ts`) and
rewrites both `theme/themes/kells-light-{subtle,bold}-color-theme.json` +
`theme/package.json`. Re-run after re-extracting the palette to pick up new colors.

## Previewing

```
code --extensionDevelopmentPath="$(pwd)/theme" "$(pwd)"
```

Opens an Extension Development Host window with both themes installed. Select one
via `Cmd+K Cmd+T` (or "Preferences: Color Theme") -> "Kells Light Subtle" / "Kells
Light Bold".

## Role mapping

Each role's *hue* comes from the extracted color named below, but not its raw
lightness (and, in Bold, not its raw saturation either): the first version of this
theme used raw extracted lightness and was nearly illegible (several roles, worst
case `yellow` at 1.15:1, were too close in brightness to the parchment background
to read at all). Real Solarized's actual trick is holding all 8 accents at a
consistent, contrast-safe lightness regardless of hue, so each role below is re-lit
to a fixed HSLUV lightness (Subtle keeps the extracted color's own saturation; Bold
also fixes saturation to a shared target) before use — accents target L=30 (~4.8:1
against the background), comments/punctuation deliberately a bit lower at L=36
(~3.8:1, so they read as secondary without being unreadable). See
`ACCENT_TEXT_L`/`COMMENT_TEXT_L`/`ACCENT_SATURATION_BOLD`/`buildTheme()` in
`generate-vscode-theme.ts`.

| Role | Source (raw hue) | Subtle hex | Bold hex | Basis |
|---|---|---|---|---|
| background | `background` (parchment average) | `#c7b8a2` | `#c7b8a2` | the whole point of the exercise; never re-lit |
| bg-highlight | derived (35% toward raw group 1) | `#b5a58e` | `#b5a58e` | nothing in the palette is lighter than background itself |
| comments | group 1 (`#948269`) | `#5f5342` | `#5f5342` | re-lit lighter than body text -> reads as de-emphasized, still readable; unaffected by Bold |
| body text | group 2 (`#4e3b2c`) | `#4e3b2c` | `#4e3b2c` | most-represented ink brown (5.7% of all pixels); already high-contrast raw; unaffected by Bold |
| yellow | group 13 (`#cea859`) | `#564421` | `#56441f` | closest Lab hue angle to Solarized yellow |
| orange | group 15 (`#a45a2d`) | `#6c391a` | `#6a3a1f` | closest Lab hue angle to Solarized orange (also the reddest color we have) |
| blue | group 11 (`#4e5c6d`) | `#3c4855` | `#254969` | closest Lab hue angle to Solarized blue |
| green | group 14 (`#6a7c69`) | `#3e4a3e` | `#23501f` | closest Lab hue angle to Solarized green |
| red | group 5, darkest ink (`#2e1e11`) | `#5d4129` | `#613f1f` | **functional, not hue, match** — no red pigment exists in this palette; borrows red's *emphasis* role instead |
| cyan | group 10 (`#757b7d`) | `#4d5152` | `#285661` | weakly cool neutral gray as extracted; L nudged +4 off violet so the two near-neutrals stay distinguishable |
| violet | group 7 (`#3b3e3d`) | `#3b3e3d` | `#1c443a` | neutral charcoal stand-in — no violet pigment exists; L nudged -4 off cyan |
| magenta | reuses blue | `#3c4855` | `#254969` | no warm-toward-purple pigment exists at all; shares blue's color rather than inventing one |

Centuries-old ink and parchment simply don't cover the red/magenta/violet part of
the hue wheel the way Solarized's synthetic palette does, so three of the eight
accent roles above are honest compromises rather than real hue matches — flagged
here rather than hidden, so token colors can be re-picked by hand if this bothers
you in practice (`generate-vscode-theme.ts`'s `roles` object is where to change it).

One thing Bold makes more visible than Subtle did: `violet`'s source color (group
7, a near-neutral charcoal) turns out to sit at HSLUV hue ≈165° once you actually
push its saturation up — that's a teal/green hue, not violet/purple at all. It read
as fine, unremarkable gray in Subtle; boosted, it looks like a second green rather
than a violet. Known, not yet fixed — a real violet-leaning substitute doesn't
exist in this palette either, so fixing it means picking a different kind of
compromise, not finding a better match.
