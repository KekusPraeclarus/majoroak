---
description: The four vendored typefaces, their pinned versions, the subset rules, and how to rebuild them.
scope: frontend
status: active
last_verified: 2026-08-14
last_edited: 2026-08-14
read_when:
  - You add, replace, or subset a font file.
  - You need the CSS family name for a face.
do_not_read_when:
  - You only apply an existing font token.
---

# Font files

These files are self-hosted. Do not load any face from a font CDN. A settlement
interface must not depend on another domain to render, and a CDN request leaks a
visitor list.

Read [typography.md](../../../../docs/brand/typography.md) for roles, sizes,
settings, and licence rules.

Read [ADR 0030](../../../../docs/decisions/0030-vendored-subset-fonts.md) for why
the files are pinned, subset, and gated.

## Rebuild

```sh
script/brand-fonts.sh              # all four families
script/brand-fonts.sh inter        # one family
```

The script downloads each pinned upstream release, verifies it by SHA-256,
instances the axes this brand uses, subsets, compresses to WOFF2, copies the
licence, and generates `fonts.css`.

It needs `fonttools` and `woff2_compress`:

```sh
pip install fonttools
brew install woff2
```

A hash mismatch stops the build. That is deliberate. A font licence can change
on a new upstream version, so re-audit the licence before you move a pin.

## Pinned versions

| Family | Upstream | Version | Source |
| --- | --- | --- | --- |
| Playfair | clauseggers/Playfair | 2.202, release 2.203 | <https://github.com/clauseggers/Playfair/releases/tag/2.203> |
| Jost | indestructible-type/Jost | 3.7, commit `814c5800` | <https://github.com/indestructible-type/Jost> |
| Inter | rsms/inter | 4.001, release v4.1 | <https://github.com/rsms/inter/releases/tag/v4.1> |
| IBM Plex Mono | IBM/plex | 2.005, release `@ibm/plex-mono@2.5.0` | <https://github.com/IBM/plex> |

Every family is SIL Open Font License 1.1. Each keeps its `OFL.txt` beside its
files. That is a licence obligation, not a courtesy.

## Files

| File | CSS family | Contents | Size |
| --- | --- | --- | --- |
| `playfair/playfair-latin.woff2` | `Playfair` | Variable roman. `opsz` 14 to 144, `wdth` 92 to 100, `wght` 360 to 900 | 123KB |
| `playfair/majoroak-wordmark.woff2` | `MajorOak Wordmark` | Playfair cut to `MAJOR OAK SETTLEMENTS` | 14KB |
| `jost/jost-latin.woff2` | `Jost` | Variable roman. `wght` 100 to 900 | 25KB |
| `inter/inter-latin.woff2` | `Inter` | Variable roman, Latin. `opsz` 14 to 32, `wght` 400 to 700 | 48KB |
| `inter/inter-latin-ext.woff2` | `Inter` | The same, Latin Extended | 62KB |
| `plexmono/majoroak-mono-400.woff2` | `MajorOak Mono` | IBM Plex Mono Regular | 12KB |
| `plexmono/majoroak-mono-500.woff2` | `MajorOak Mono` | IBM Plex Mono Medium | 12KB |

A `.ttf` sits beside each `.woff2`. The browser uses the WOFF2. The TTF is for a
desktop design tool.

A Latin application route loads 222KB, being every file except the Latin
Extended cut and the second mono weight. With both it is 234KB. The budget is
250KB. Read the budget table in
[typography.md](../../../../docs/brand/typography.md).

## Two families are renamed subsets

`MajorOak Wordmark` is Playfair, cut to the letters of the wordmark.

`MajorOak Mono` is IBM Plex Mono. IBM declares the Reserved Font Name `Plex`.
Subsetting is a Modified Version under OFL 1.1 clause 3, and the OFL FAQ 2.6
confirms it, so the subset cannot carry that name. Only the name a user sees
changes. The copyright notice, the IBM trademark notice, and the licence records
stay in the file untouched.

Playfair, Jost, and Inter declare no reserved name, so their subsets keep theirs.

IBM Plex Mono stays the typeface's name in every document. `MajorOak Mono` is
only the CSS family string. Never imply an IBM endorsement. Read
[naming.md](../../../../docs/brand/naming.md).

## Playfair defaults to the minimum of every axis

Upstream Playfair defaults to `opsz` 5, `wdth` 88, and `wght` 360, and records
that position in its family name. Unstyled Playfair therefore renders as Micro
SemiCondensed SemiLight, which looks blunt and slightly condensed.

The build resets the family name to `Playfair`. It cannot reset the default axis
position without discarding the axes.

So always set all three axes when you use Playfair:

```css
font-variation-settings: "opsz" 144, "wdth" 96, "wght" 500;
```

Read the Playfair role table in
[typography.md](../../../../docs/brand/typography.md) for the value per role.

## What each subset keeps

Coverage is Basic Latin, Latin-1, dashes, quotes, bullet, ellipsis, euro, and
pound. Inter adds Latin Extended in a second file, split by `unicode-range`.

Every subset carries `≈`, because a fiat estimate is written `≈ $1,234`. Read
[microcopy.md](../../../../docs/brand/microcopy.md).

| Face | Features kept beyond shaping and kerning |
| --- | --- |
| Playfair | `calt` `liga` `case` |
| Jost | none. It sets one to three tracked capitals |
| Inter | `tnum` `pnum` `zero` `cpsp` `cv05` `cv08` `case` `calt` |
| MajorOak Mono | `zero` `case` |

Dropped on purpose, and why:

- Playfair small caps. No Playfair role uses them, and they cost about 90KB.
  Jost capitals at a smaller size fill that role.
- Playfair figure sets. Playfair never sets a table, and never sets a number a
  user acts on.
- Jost `tnum`. This brand never sets a number in Jost.
- Fractions, numerators, and denominators on every face. No surface sets a
  fraction. The subsetter adds these by default, so the build names its features
  explicitly instead.
- Jost italic. This brand never sets Jost in italic, so the `ital` axis is
  instanced away.
- Inter below 400 and above 700. The weight axis is clamped to 400 to 700, so a
  consumer cannot reach a weight the brand forbids.
- Playfair outside `opsz` 14 to 144 and `wdth` 92 to 100. Upstream runs `opsz` 5
  to 1200 and `wdth` 88 to 113. The role table needs neither extreme, and the
  unused span costs 37KB. Widen a limit here if the role table gains a wider
  value, and rebuild the lockups, which set `opsz` 72 and `wdth` 92.

`cv05` and `cv08` are not cosmetic. They separate `l`, `I`, and `1`, which a
token symbol such as `ILL` or `1INCH` depends on.

## fonts.css is generated

`fonts.css` comes from the build. Do not edit it.

Each `unicode-range` in it is the exact range its file was subset to, so the two
cannot drift. A range wider than its file makes a browser skip the fallback and
paint a missing glyph.

`main.tsx` imports it before `styles.css`.
