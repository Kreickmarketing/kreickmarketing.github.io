# Text styles: Kreick Marketing and ClearMark

Both sites use the same text sizes. Only the font is different, and it is left out here.
Source: `styles/typography.css` in each repo.

**How to read it**
- **size:** how big the text is
- **lh (line height):** how much space each line takes up
- **ls (letter spacing):** the gap between letters. A negative value pulls letters closer together.

## Body text

| Name | Size | Line height | Letter spacing |
| --- | --- | --- | --- |
| xxs | 8px | 10px | -1px |
| xs | 12px | 14px | -1px |
| sm | 16px | 20px | -1px |
| md | 20px | 24px | -1px |
| lg | 24px | 28px | -1px |
| xl | 28px | 32px | -1px |

Body text is the same size on desktop and phone.

## Headlines

| Name | Desktop size / line height | Phone size / line height | Letter spacing |
| --- | --- | --- | --- |
| h1 | 112px / 100px | 88px / 79px | -4px |
| h2 | 96px / 88px | 72px / 65px | -4px |
| h3 | 80px / 72px | 60px / 54px | -4px |
| h4 | 64px / 56px | 48px / 43px | -3px |
| h5 | 52px / 48px | 40px / 36px | -2px |
| h6 | 40px / 36px | 32px / 29px | -2px |

"Phone" means screens 767px wide or narrower. On phones, each heading's line height is 0.9 × its size, rounded to the nearest pixel.

## Tagline

| | Size | Line height | Letter spacing |
| --- | --- | --- | --- |
| Desktop | 16px | 16px | 3px |
| Phone | 12px | 12px | 3px |

## Weights

| Name | Value |
| --- | --- |
| thin | 100 |
| light | 300 |
| normal | 400 |
| medium | 500 |
| semi-bold | 600 |
| bold | 700 |
| extra-bold | 800 |

## The CSS

```css
:root {
  /* Body text */
  --text-xxs-size: 8px;   --text-xxs-lh: 10px;   --text-xxs-ls: -1px;
  --text-xs-size: 12px;   --text-xs-lh: 14px;    --text-xs-ls: -1px;
  --text-sm-size: 16px;   --text-sm-lh: 20px;    --text-sm-ls: -1px;
  --text-md-size: 20px;   --text-md-lh: 24px;    --text-md-ls: -1px;
  --text-lg-size: 24px;   --text-lg-lh: 28px;    --text-lg-ls: -1px;
  --text-xl-size: 28px;   --text-xl-lh: 32px;    --text-xl-ls: -1px;

  /* Headlines (desktop) */
  --text-h6-size: 40px;   --text-h6-lh: 36px;    --text-h6-ls: -2px;
  --text-h5-size: 52px;   --text-h5-lh: 48px;    --text-h5-ls: -2px;
  --text-h4-size: 64px;   --text-h4-lh: 56px;    --text-h4-ls: -3px;
  --text-h3-size: 80px;   --text-h3-lh: 72px;    --text-h3-ls: -4px;
  --text-h2-size: 96px;   --text-h2-lh: 88px;    --text-h2-ls: -4px;
  --text-h1-size: 112px;  --text-h1-lh: 100px;   --text-h1-ls: -4px;

  /* Tagline */
  --text-tagline-size: 16px; --text-tagline-lh: 16px; --text-tagline-ls: 3px;

  /* Weights */
  --font-weight-thin: 100;
  --font-weight-light: 300;
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semi-bold: 600;
  --font-weight-bold: 700;
  --font-weight-extra-bold: 800;
}

/* Phones (767px and narrower): headings and tagline only. Body text stays the same. */
@media (max-width: 767px) {
  h1, .as-h1 { font-size: 88px; line-height: 79px; letter-spacing: -4px; }
  h2, .as-h2 { font-size: 72px; line-height: 65px; letter-spacing: -4px; }
  h3, .as-h3 { font-size: 60px; line-height: 54px; letter-spacing: -4px; }
  h4, .as-h4 { font-size: 48px; line-height: 43px; letter-spacing: -3px; }
  h5, .as-h5 { font-size: 40px; line-height: 36px; letter-spacing: -2px; }
  h6, .as-h6 { font-size: 32px; line-height: 29px; letter-spacing: -2px; }
  .tagline   { font-size: 12px; line-height: 12px; letter-spacing: 3px; }
}
```

## The one difference between the sites

- **Kreick Marketing:** the phone sizes also apply to the `.as-h1` to `.as-h6` classes, which give any text a heading's size.
- **ClearMark:** the phone sizes apply only to real `h1` to `h6` headings. Text using `.as-h*` keeps its desktop size on phones.
