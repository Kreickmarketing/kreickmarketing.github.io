# ClearMark design system: content fields and cards

Most of the ClearMark site is built from **cards**. Every card is filled from the same set of **content fields**, so one piece of content (a course, an offer, a post) can show up as any card at any size.

This document is typed from two notebook pages and the 13 sample card designs. Anything I couldn't read or measure for certain is marked **(?)**.

---

## 1. Content fields

Each field has a short code. The code tells a card which field to show.

| Field | Code | Rule / note |
| --- | --- | --- |
| Content Title 100 | CT100 | Main title |
| Content Title 200 | CT200 | Second title |
| Content Title 300 | CT300 | Third title |
| Content Short | CS | Up to 144 words |
| Content Long | CL | Up to 1,500 words |
| Slug | — | The page address: yoursite.url/cms/[lowercase] |
| Content Button | CB | The button's text |
| Content Button Link | CBL | Where the button goes |
| Content Price | CP | |
| Content Price Title | CPT | |
| Content Price Subtitle | CPS | |
| Content Price Description | CPD | |
| Content Price Dates | CPDT | e.g. "Starting on Wednesday January 28, 2026" |
| Content Image 01, 02 … | CI-01 … | Kept outside the content fields (see below). Add as many as needed. |
| Content Video 01, 02 … | CV-01 … | Kept outside the content fields (see below). Add as many as needed. |
| Hashtags (tags) | Tags | Typed comma-separated. Each tag has a link (see below). |

### Images and videos

Images and videos are **not stored in the database**, so they never interrupt the content fields.

- The content itself is **one row** of text fields that never changes shape.
- **Images** are files in Supabase Storage.
- **Videos** are a Vimeo or YouTube link (or a short file under 50MB in Storage).
- A separate **media list** links each file to its content. Each entry holds:
  - its number (CI-01, CI-02 … or CV-01 …)
  - the file or link
  - a short description for screen readers
  - its order
- Adding one image or thirty adds lines to the media list only.

### Hashtags (tags)

Tags replace the fixed HT100 to HT300 fields, so content can have as many as it needs. The "+" pills on the cards are tags.

1. Type them comma-separated: `Hybrid course, Leadership upskilling`.
2. Each tag is created once and reused across all content.
3. Each tag links to its own page automatically, e.g. `/tags/hybrid-course`, listing everything with that tag.
4. On the Tags screen, any tag can be given a custom link instead, e.g. a Calendly or landing page.

## 2. Grid and card sizes

- **Site grid:** 32px. All spacing (padding, gaps, margins) is 32, 64 or 96. Only small parts inside a component, like tag pills, use 16 or 8.
- **Card widths** go up in steps of 160px: 160 / 320 / 480 / 640 / 800 / 960 / 1120 / 1280 / 1440 / 1600 / 1760 / 1920
- **Phone screen** the mobile cards are designed for: 360px wide

## 3. The 13 cards

**Every card is responsive.** It fills the space it's given, from the next card size down up to its own size, and keeps its shape. For example, Card-800 goes from 640 to 800 wide. **Card-1920** is the exception: it has no maximum, so it stretches to fill its container (it stops getting taller at 960).

### Mobile (3 cards)

| Card | Size (w × h) | Other name in the notes | Padding | How it looks |
| --- | --- | --- | --- | --- |
| **Card-160** | 160 × 240 | Card-Mobile-50% | 16 on all sides (notes said 14; snapped to the grid) | Half the phone's width, so two can sit side by side. Text on top of the photo. |
| **Card-320** | 320 × 480 | Card-Mobile-320 | 32 on all sides | Full phone width. Text on top of the photo, with a 1px white divider above the price. |
| **Card-Image-Text** | 352 wide (?) | — | 32 | Photo on top, with dark text below on a light background. The only card where the text isn't on the photo. |

### Tablet, laptop and desktop (10 cards)

| Card | Size (w × h) | Shape |
| --- | --- | --- |
| Card-480 | 480 × 640 | Tall |
| Card-640 | 640 × 640 | Square |
| Card-800 | 800 × 960 | Tall |
| Card-960 | 960 × 800 | Wide |
| Card-1120 | 1120 × 800 | Wide |
| Card-1280 | 1280 × 800 | Wide |
| Card-1440 | 1440 × 800 | Wide |
| Card-1600 | 1600 × 960 | Wide |
| Card-1760 | 1760 × 960 | Wide |
| Card-1920 | 1920 × 960 | Wide |

In every one of these, the photo (CI-01) fills the whole card, it has rounded corners, and the text is white.

## 4. Which fields each card shows

✓ = the card shows this field. Tags are the five "+" pills (see question 6 below).

| Card | CI-01 | CT100 | CT200 | CT300 | CS | CB / CBL | Tags | Divider | CP | CPDT |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Mobile** | | | | | | | | | | |
| Card-160 | ✓ | ✓ | ✓ | | ✓ * | | | | ✓ | ✓ |
| Card-320 | ✓ | ✓ | ✓ | | ✓ * | | | 1px white | ✓ | ✓ |
| Card-Image-Text | ✓ on top | ✓ | ✓ | ✓ | ✓ | ✓ blue link | ✓ 4 rows | 1px dark | ✓ | ✓ |
| **Tablet / laptop / desktop** | | | | | | | | | | |
| Card-480 | ✓ | ✓ | ✓ | ✓ | | | | 1px white | ✓ | ✓ |
| Card-640 | ✓ | ✓ | ✓ | ✓ | | | ✓ 3 rows | 1px white | ✓ | ✓ |
| Card-800 | ✓ | ✓ | ✓ | ✓ | | | ✓ 2 rows | 1px white | ✓ | ✓ |
| Card-960 | ✓ | ✓ | ✓ | ✓ | | | ✓ 2 rows | 1px white | ✓ | ✓ |
| Card-1120 | ✓ | ✓ | ✓ | ✓ | | | ✓ 1 row | 1px white | ✓ | ✓ |
| Card-1280 | ✓ | ✓ panel | ✓ panel | ✓ panel | ✓ panel | ✓ panel | ✓ 1 row | | ✓ | ✓ |
| Card-1440 | ✓ | ✓ panel | ✓ panel | ✓ panel | ✓ panel | ✓ panel | ✓ 1 row | | ✓ | ✓ |
| Card-1600 | ✓ | ✓ panel | ✓ panel | ✓ panel | ✓ panel | ✓ panel | ✓ 1 row | | ✓ | ✓ |
| Card-1760 | ✓ | ✓ panel | ✓ panel | ✓ panel | ✓ panel | ✓ panel | ✓ 1 row | | ✓ | ✓ |
| Card-1920 | ✓ | ✓ panel | ✓ panel | ✓ panel | ✓ panel | ✓ panel | ✓ 1 row | | ✓ | ✓ |

\* Your notebook labels the third line on Card-160 and Card-320 as **CS**. In the finished designs that line is "Every Chief People Officer Must Be a CIO…", which the bigger cards treat as **CT300**. See question 7 below.

**"Panel"** means the text sits inside a dark, see-through box with rounded corners on the left side of the card.

In every card the price (CP) and dates (CPDT) sit at the **bottom right**, and the tags sit at the **bottom left**.

## 5. Mobile card drawings

### Card-160 (Card-Mobile-50%): padding 16

```
┌──────────────┐
│ CT100        │
│ CT200        │
│ CS ~~~~~~    │
│ CS ~~~~      │
│              │
│              │
│       2,500  │ ← CP
│      ~~~~~~  │ ← CPDT
└──────────────┘
```

### Card-320 (Card-Mobile-320): padding 32

```
┌────────────────────────┐
│ CT100 ~~~~~~~~~~~~~~   │
│ CT200 ~~~~~~~~~~~~~~   │
│ CS ~~~~~~~~~~          │
│ CS ~~~~~~~~~~          │
│                        │
│                        │
│────────────────────────│ ← Divider line (1px white)
│               $2,500   │ ← CP
│              ~~~~~~~   │ ← CPDT
└────────────────────────┘
```

### Card-Image-Text

```
┌──────────────────────┐
│ ┌──────────────────┐ │
│ │   photo (CI-01)  │ │
│ └──────────────────┘ │
│ CT100  CPO→CIO       │
│ CT200  Leadership…   │
│ CT300  Every Chief…  │
│ CS ~~~~~~~~~~~~~~~~  │
│ CS ~~~~~~~~~~~~~~~~  │
│ CB  Button Text →    │ ← blue link (CBL)
│ ──────────────────── │ ← Divider line (1px dark)
│ (+ tag) (+ tag)      │
│ (+ tag)              │
│ (+ tag)              │
│ (+ tag)              │
│             $2,500   │ ← CP
│            ~~~~~~~~  │ ← CPDT
└──────────────────────┘
```

### Unlabeled square (notebook page 2)

The notebook also has an empty square box with no name or fields. It may be a card you haven't designed yet.

## 6. Sample content (the CPO→CIO card set)

| Code | Sample text |
| --- | --- |
| CT100 | CPO→CIO |
| CT200 | Leadership Track |
| CT300 | Every Chief People Officer Must Be a CIO in 2026 by Kinney AI |
| CS | We're not a consultancy that prescribes in with jargon and leaves you with a deck. We're operation who've lived inside the mass - layoffs, legacy systems, closed teams, unclear metrics. We've felt the pressure of change and built the tools to meet it. |
| CB | Button Text Here → |
| CP | $2,500 |
| CPDT | Starting on Wednesday January 28, 2026 |
| Tags | Hybrid course · Leadership upskilling · Digital transformation · 6-week executive program · Hands-on Execution workshop |
| CI-01 | Woman at a laptop in a field of orange poppies |

---

## Things to check

1. **Card-320 width:** the name says 320, but "340" is written above the drawing. Which one is right?
2. **Card-Image-Text width:** set to 352 (11 × 32) with 32 padding. Your design measured about 368. Is 352 right?
3. **CS or CT300 on mobile:** your drawings mark the third line on Card-160 and Card-320 as CS, but the designs show the CT300 sentence there. Which field should it be?
4. **Devices:** which of the 10 larger cards are for tablet, which for laptop and which for desktop?
5. **Unused fields:** CL, CV-01, CPD, CPS and CPT don't appear on any card yet. Are they for full pages rather than cards?
6. **Sample text typos:** "prescribes in" (perhaps "parachutes in"), "We're operation" ("We're operators") and "the mass" ("the mess").
