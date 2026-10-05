import type { CardContent } from "@/components/Card";

// Color groups, in the order of the Figma "Primitive Variables" sheet.
// Names match the variables in styles/colors.css.
export const COLOR_GROUPS: { title: string; colors: string[] }[] = [
  { title: "Primaries (Core Brand)", colors: ["white", "clay-light", "clay", "midnight", "rogue-cherry", "tidal-azure"] },
  { title: "Neutrals (Human Earth Colors)", colors: ["white", "clay-light", "clay", "sage-veil", "sage-mist", "dusty-sage", "deep-taupe", "bistre", "mossy-pewter", "iron-pine", "charcoal", "midnight"] },
  { title: "Secondaries (Brand Support)", colors: ["cobalt-wave", "aegean", "tidal-azure", "glacial-cyan", "oxblood", "merlot", "rogue-cherry", "coral-rush", "orange-crush", "burnt-sienna", "tangerine-burst", "honey-brass", "solar-flare", "pine-shadow", "iron-moss", "emerald-tide", "frosted-mint", "deep-aubergine", "magenta-orchid", "amethyst-veil", "lavender-mist"] },
];

// Headline sizes from text-styles.md: [desktop size, line height] and [phone size, line height].
export const HEADINGS = [
  { tag: "h1", desktop: [112, 100], phone: [88, 79], ls: -4 },
  { tag: "h2", desktop: [96, 88], phone: [72, 65], ls: -4 },
  { tag: "h3", desktop: [80, 72], phone: [60, 54], ls: -4 },
  { tag: "h4", desktop: [64, 56], phone: [48, 43], ls: -3 },
  { tag: "h5", desktop: [52, 48], phone: [40, 36], ls: -2 },
  { tag: "h6", desktop: [40, 36], phone: [32, 29], ls: -2 },
] as const;

export const BODY_SIZES = [
  { key: "xl", label: "XL", size: "28px / 32px" },
  { key: "lg", label: "LG", size: "24px / 28px" },
  { key: "md", label: "MD", size: "20px / 24px" },
  { key: "sm", label: "SM", size: "16px / 20px" },
  { key: "xs", label: "XS", size: "12px / 14px" },
  { key: "xxs", label: "XXS", size: "8px / 10px" },
] as const;

export const BODY_WEIGHTS = [
  { key: "extra-bold", label: "Extra bold" },
  { key: "bold", label: "Bold" },
  { key: "semi-bold", label: "Semi bold" },
  { key: "medium", label: "Medium" },
  { key: "normal", label: "Normal" },
  { key: "light", label: "Light" },
] as const;

export const FIELDS: [string, string, string][] = [
  ["Content Title 100", "CT100", "Main title"],
  ["Content Title 200", "CT200", "Second title"],
  ["Content Title 300", "CT300", "Third title"],
  ["Content Short", "CS", "Up to 144 words"],
  ["Content Long", "CL", "Up to 1,500 words"],
  ["Slug", "—", "Page address: yoursite.url/cms/[lowercase]"],
  ["Content Button", "CB", "The button's text"],
  ["Content Button Link", "CBL", "Where the button goes"],
  ["Content Price", "CP", ""],
  ["Content Price Title", "CPT", ""],
  ["Content Price Subtitle", "CPS", ""],
  ["Content Price Description", "CPD", ""],
  ["Content Price Dates", "CPDT", "e.g. Starting on Wednesday January 28, 2026"],
  ["Content Image 01, 02 …", "CI-01 …", "Kept outside the content fields: files in storage, listed in order. Add as many as needed."],
  ["Content Video 01, 02 …", "CV-01 …", "Kept outside the content fields: a Vimeo or YouTube link (or a short file). Add as many as needed."],
  ["Hashtags (tags)", "Tags", "Typed comma-separated. Each tag links to its own page, or to a link you choose."],
];

// Which fields each card shows: [card, device, CI, CT100, CT200, CT300, CS, CB, Tags, Divider, CP+CPDT]
export const FIELD_MAP: string[][] = [
  ["Card-160", "Mobile", "✓", "✓", "✓", "✓", "", "", "", "", "✓"],
  ["Card-320", "Mobile", "✓", "✓", "✓", "✓", "", "", "", "White", "✓"],
  ["Card-Image-Text", "Mobile", "On top", "✓", "✓", "✓", "✓", "✓", "✓", "Dark", "✓"],
  ["Card-480", "Tablet / laptop / desktop", "✓", "✓", "✓", "✓", "", "", "", "White", "✓"],
  ["Card-640", "Tablet / laptop / desktop", "✓", "✓", "✓", "✓", "", "", "✓", "White", "✓"],
  ["Card-800 to 1120", "Tablet / laptop / desktop", "✓", "✓", "✓", "✓", "", "", "✓", "White", "✓"],
  ["Card-1280 to 1920", "Tablet / laptop / desktop", "✓", "Panel", "Panel", "Panel", "Panel", "Panel", "✓", "", "✓"],
];

// Sample content: the CPO→CIO Leadership Track card set.
export const SAMPLE: CardContent = {
  ct100: "CPO→CIO",
  ct200: "Leadership Track",
  ct300: "Every Chief People Officer Must Be a CIO in 2026 by Kinney AI",
  cs: "We're not a consultancy that prescribes in with jargon and leaves you with a deck. We're operation who've lived inside the mass - layoffs, legacy systems, closed teams, unclear metrics. We've felt the pressure of change and built the tools to meet it.",
  cb: "Button Text Here",
  cbl: "#cards",
  cp: "$2,500",
  cpdt: ["Starting on Wednesday", "January 28, 2026"],
  tags: ["Hybrid course", "Leadership upskilling", "Digital transformation", "6-week executive program", "Hands-on Execution workshop"],
  image: "/design-system/poppies.webp",
  imageAlt: "A woman working at a laptop in a field of orange poppies",
};
