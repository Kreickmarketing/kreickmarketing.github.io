# Clearmark Design System

Two sources, in order of authority:
1. **"Website Style Guides.fig"** (Figma, attached directly) — the real token source of truth. `figma-source/fig-tokens.css` holds the actual color/type/spacing Variables (Saira for headings & body, Courier Prime for buttons; a large named color palette — Clay, Midnight, Rogue Cherry, Tidal Azure, etc.). `tokens/*.css` alias onto these real primitives — no more guessing.
2. 14 PNG screenshots the user uploaded directly ("Design Samples"), used for layout/composition reference (hero, pricing cards, footer, etc.) — see `assets/*-ref.png`.

**Correction note:** an earlier pass of this system was built from the screenshots alone (before the Figma file was attached) and guessed at fonts (Anton/Quicksand) and a different orange/navy palette. Those guesses are now replaced by the real Figma tokens above. If any component/guideline card still shows the old orange-500 (#ee7433) navy-900 (#262f3a) palette instead of the real one (Orange Crush, Midnight, etc.), it needs a refresh pass.

**Brand note:** the header/logo in the screenshots reads "CLEARMARK TRAINING," but the footer and mobile nav wordmark still read "KINNEYAI" — the source material appears to be a rebrand-in-progress from "Kinney AI Training" to "Clearmark Training." This system uses **Clearmark** throughout per the user's naming request; flag any remaining "Kinney AI" copy to the user before shipping.

Company appears to be a B2B AI-adoption training/consultancy: sells tiered enterprise training packages ($10K–$100K), cites MIT/Wharton/Harvard/Berkeley speaker credentials, and pitches "visibility into AI usage after deployment" as its core wedge.

## Index
- `styles.css` — root stylesheet, import this one file
- `tokens/` — colors.css, typography.css, spacing.css
- `guidelines/` — foundation specimen cards (colors, type, spacing, radius, brand, imagery)
- `components/core/` — Button, PricingCard, Footer
- `components/navigation/` — NavBar
- `ui_kits/website/index.html` — homepage recreation (Hero → Why It Matters → Core Difference → Pricing → Certifications → Footer)
- `assets/` — reference screenshots + the certifications logo lockup (MIT/Wharton/Harvard/Berkeley)

## Content fundamentals
- Voice: direct, first-person-plural ("We're not a consultancy... We're operators"), confident, slightly blunt — leads with the customer's pain ("Most companies don't fail at AI because of technology...") before the pitch.
- Headlines are short outcome statements ("Turning your AI investment into a visible, predictable, performing asset"); body copy stays conversational, contractions allowed ("it's", "We've").
- No emoji anywhere in the source. Numbers used sparingly but concretely (dollar figures, employee-count tiers, "35,000 savings per employee").
- Section labels are terse all-caps eyebrows ("WHY IT MATTERS," "THE TEAM," "SPEAKER & CERTIFICATIONS:").
- Credibility leans on institutional logos (Ivy/MIT) and specific dollar/percentage stats rather than testimonial quotes.

## Visual foundations
- **Color (real, from Figma Variables):** Primaries/Core Brand — Clay Light `rgb(246,245,242)` (page bg), Clay `rgb(225,221,213)`, Midnight `rgb(28,32,38)` (headings, dark surfaces), Rogue Cherry `rgb(219,31,61)`, Tidal Azure `rgb(0,153,206)`. Neutrals (Human Earth) run Clay Light → Sage Veil → Sage Mist → Dusty Sage → Deep Taupe → Bistre → Mossy Pewter → Iron Pine → Charcoal → Midnight. Secondaries (Brand Support) span a full named spectrum — Aegean, Glacial Cyan, Oxblood, Merlot, Coral Rush, Orange Crush, Burnt Sienna, Tangerine Burst, Honey Brass, Solar Flare, Pine Shadow, Iron Moss, Emerald Tide, Frosted Mint, Deep Aubergine, Magenta Orchid, Amethyst Veil, Lavender Mist — a wide accent palette to pull from, not just one orange. Full list in `figma-source/fig-tokens.css`.
- **Type (real):** heading and body both set in **Saira**; buttons set in monospace **Courier Prime**. Precise scale (desktop): H1 103/92px, H2 74/70.3px, H3 58/58px, H4 43/43px, H5 40/34px, H6 31/27px, Tagline 16/16px (tracked +3px). Text sizes: XL 24/26, LG 22/30, MD 20/28, SM 16/20, XS 12/14. Headings carry tight negative letter-spacing (H1–H3: -4px, H4–H6: -2px); body text -1px; buttons -2px. Full weight set available: Thin/ExtraLight/Light/Regular/Medium/SemiBold/Bold/ExtraBold/Black.
- **Corners are square:** `--radius-large` = 0 in the source Variables — this system does not round cards/buttons by default (differs from the earlier screenshot-only guess).
- **Imagery:** warm, sunlit nature photography (California poppy fields, mountains) as full-bleed hero backgrounds and rounded-corner (20px) photo cards elsewhere — never stock-office photography. One outdoor-adventure photo (rock climber) illustrates the "Why It Matters" section, paired with a dark gradient overlay for text legibility.
- **Cards:** white background, 1px light-gray hairline border (`#e3e6e9`), 12px radius; the single "recommended" pricing tier gets a 2px orange border instead. No drop shadows on pricing cards; soft shadows reserved for elevated cards (e.g. stat overlay tiles).
- **Buttons:** always fully pill-shaped (`radius: 999px`), 2px border, never a soft-rounded rectangle. Primary is solid dark charcoal; secondary is outline (charcoal or white border depending on background).
- **Layout:** generous full-bleed sections, 40–64px section padding, content max-width constrained via a 2-column grid (image + text) on "Core Difference"/testimonial-style sections. Mobile stacks every multi-column section to one column and swaps the desktop nav for a bottom icon tab bar (Solutions/Platforms/The Engine/Pricing icons).
- **Corners:** large radii throughout — 20px on hero/photo cards, 12px on pricing/stat cards, fully round on buttons and the mobile hero image.
- **No animation, gradient-mesh, or glassmorphism observed** in the static screenshots — treat as a static, photography-led brand until told otherwise.

## Iconography
- Minimal: four flat-line stroke icons on the "Why It Matters" cards (workflow, heartbeat/behavior, branch/intervention, bar-chart) and a small dollar-sign badge on the stat overlay card. Style is thin (~1.5px) stroke, white, geometric — closest CDN match is **Lucide** icons; substituted from Lucide since no icon source files were provided. Mobile footer/tab bar uses simple line icons (grid, workflow, network, document) in the same style.
- No icon font, no emoji, no illustration system observed.

## Known gaps / caveats
- No dedicated logo mark (SVG/PNG) exists in the source — the wordmark is always typeset text ("CLEARMARK" + "TRAINING" tracked-out below it). Nothing was drawn to fill this gap; render the brand name in `--font-display` wherever a mark would go.
- Fonts are Google Fonts substitutions (Anton / Quicksand / Nunito Sans), not the brand's real files — confirm with the user and swap in real webfonts if they have them.
- Only static screenshots were available (no Figma/codebase access), so exact spacing/hex values are estimated from the images, not pulled from source of truth. Treat pixel values as close approximations.
- Icons are Lucide substitutions for the four "Why It Matters" glyphs.
