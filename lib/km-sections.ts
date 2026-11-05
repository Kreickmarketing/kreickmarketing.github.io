// Kreick Marketing templates (km-*): the second set of Studio templates, for rebuilding
// kreickmarketing.com in Studio (Oct 21, 2026). Built from two sources: the Claude artifact
// "Andrew K AI Work" (https://claude.ai/artifact/2yeY17WpNETVpjiraB9zUm) and the live page
// https://kreickmarketing.com/gigs. Look: mustard cover, charcoal interior, gold titles,
// red pill buttons, Barlow (styles/brands/kreick.css, scoped under .brand-km).
//
// This file is the one source for:
//   - KM_TEMPLATES: the templates in the builder's own format (labels, limits, spots).
//     scripts/sync-kreick.mjs copies them into the builder (studio-builder.html, km-data block).
//   - KM_PAGES + KM_CONTENT: the two page templates (AI Work, Gigs) and their starting words.
//   - drawKm(): the live drawing of each km section. The builder has its own copy with
//     editing marks (KM_HTML in studio-builder.html): keep the two in step.
// Screen sizes follow the site's breakpoints: desktop over 1000px, tablet 701–1000px,
// phone up to 700px (@container rules in kreick.css). Canvas boards: 1280 / 768 / 390.
//
// No imports, so Node can run it directly (scripts/sync-kreick.mjs builds the canvas boards).

export type KmCol = { key: string; label: string; limit?: number; long?: boolean; kind?: "image" };
export type KmSlot = {
  key: string; label: string; kind: "text" | "link" | "image" | "list" | "logos";
  limit?: number; max?: number; cols?: KmCol[]; long?: boolean; optional?: boolean; axis?: "x";
  about?: string; source?: string; def?: string;
};
export type KmTemplate = { id: string; name: string; type: string; group: string; about: string; bgChoice?: string[]; site: "kreick"; slots: KmSlot[] };

const GROUND = ["charcoal", "black", "mustard"];
const t = (id: string, name: string, type: string, group: string, about: string, slots: KmSlot[], bgChoice: string[] | null = GROUND): KmTemplate =>
  ({ id, name, type, group, about, ...(bgChoice ? { bgChoice } : {}), site: "kreick", slots });

export const KM_GROUPS = [
  { id: "km-bands", name: "Covers & bands", tpls: ["km-cover", "km-cta-bar", "km-ignite"] },
  { id: "km-work", name: "Work", tpls: ["km-case", "km-steps", "km-projects"] },
  { id: "km-folio", name: "Portfolio", tpls: ["km-project", "km-gallery"] },
  { id: "km-text", name: "Titles & numbers", tpls: ["km-title", "km-stats", "km-principles", "km-columns", "km-groups"] },
  { id: "km-logos", name: "Logos", tpls: ["km-logo-strip", "km-logo-wall"] },
  { id: "km-cards", name: "Cards", tpls: ["km-edu"] },
  { id: "km-foot", name: "Footer", tpls: ["km-footer"] },
];

export const KM_TEMPLATES: KmTemplate[] = [
  t("km-cover", "Cover hero", "kmcover", "km-bands", "Big picture (the matchbox) beside the pitch: headline with one red word, three short points, the Book a call button and contact line.", [
    { key: "image", label: "Cover image", kind: "image", source: "Images · Matchbox" },
    { key: "headline", label: "Headline", kind: "text", limit: 140, long: true, source: "One sentence" },
    { key: "highlight", label: "Red word", kind: "text", limit: 20, optional: true, about: "A word from the headline to show in red.", source: "e.g. “three”" },
    { key: "three", label: "Three points", kind: "list", max: 3, axis: "x", cols: [{ key: "num", label: "Number", limit: 10 }, { key: "text", label: "Point", limit: 40 }], source: "e.g. One: / Own the Creative Vision" },
    { key: "button", label: "Button text", kind: "text", limit: 22, source: "Usually “Book a call”" },
    { key: "link", label: "Button link", kind: "link", source: "Your Calendly link" },
    { key: "resume", label: "Second link text", kind: "text", limit: 30, optional: true, source: "e.g. “Download My Résumé”" },
    { key: "resumeLink", label: "Second link", kind: "link", optional: true, source: "Google Drive link" },
    { key: "contact", label: "Contact line", kind: "list", max: 3, axis: "x", optional: true, cols: [{ key: "item", label: "Item", limit: 40 }], source: "Email, phone, title" },
  ], ["mustard", "charcoal", "black"]),
  t("km-cta-bar", "Call bar", "kmbar", "km-bands", "A full-width red bar with one call to action. Use it between sections.", [
    { key: "button", label: "Bar text", kind: "text", limit: 30, source: "Usually “Book a call”" },
    { key: "link", label: "Bar link", kind: "link", source: "Your Calendly link" },
  ], null),
  t("km-ignite", "Ignite band", "kmignite", "km-bands", "A looping video or photo behind a short headline and up to three buttons.", [
    { key: "image", label: "Video or photo", kind: "image", about: "A short MP4 loops silently; a photo works too.", source: "Images & video · Match" },
    { key: "headline", label: "Headline", kind: "text", limit: 40, source: "e.g. “ignite your team”" },
    { key: "buttons", label: "Buttons", kind: "list", max: 3, axis: "x", optional: true, cols: [{ key: "label", label: "Text", limit: 24 }, { key: "link", label: "Link", limit: 300 }], about: "The first is red, the rest are outlined.", source: "Links to sections or pages" },
  ], null),
  t("km-case", "Case study", "kmcase", "km-work", "One wide case (16:9 video or image) or two side by side (tall 9:16). Client, title, gold hook, text, tool chips and role.", [
    { key: "cases", label: "Cases", kind: "list", max: 2, cols: [
      { key: "media", label: "Video or image", kind: "image" }, { key: "client", label: "Client", limit: 40 }, { key: "title", label: "Title", limit: 60 },
      { key: "hook", label: "Hook", limit: 120, long: true }, { key: "text", label: "Text", limit: 600, long: true },
      { key: "tools", label: "Tools (commas)", limit: 120 }, { key: "role", label: "Role", limit: 90 }], about: "One case fills the row; two sit side by side (stacked on phones).", source: "Your case studies" },
  ]),
  t("km-steps", "How I made it", "kmsteps", "km-work", "Up to four numbered steps, each with a screenshot, a title and a short text.", [
    { key: "label", label: "Label", kind: "text", limit: 30, optional: true, def: "How I made it", source: "One short line" },
    { key: "steps", label: "Steps", kind: "list", max: 4, axis: "x", cols: [{ key: "image", label: "Screenshot", kind: "image" }, { key: "title", label: "Title", limit: 40 }, { key: "text", label: "Text", limit: 220, long: true }], about: "Numbered One to Four in this order.", source: "Workflow screenshots" },
  ]),
  t("km-projects", "Project cards", "kmprojects", "km-work", "Image cards with a name, an arrow and optional years, three across. Each card links to its project.", [
    { key: "title", label: "Title", kind: "text", limit: 60, optional: true, source: "Optional" },
    { key: "cards", label: "Cards", kind: "list", max: 9, axis: "x", cols: [{ key: "image", label: "Image", kind: "image" }, { key: "title", label: "Name", limit: 30 }, { key: "years", label: "Years", limit: 20 }, { key: "link", label: "Link", limit: 300 }], source: "Your projects" },
  ]),
  // Portfolio pages (kreickmarketing.com/work/…, Oct 21): the story, then the work.
  t("km-project", "Project intro", "kmproject", "km-folio", "A portfolio page's opening: the project name, years and a short line, then Challenge, Solution and Results (or one summary paragraph).", [
    { key: "title", label: "Project name", kind: "text", limit: 60, source: "e.g. “INV Canada”" },
    { key: "years", label: "Years", kind: "text", limit: 20, optional: true, source: "e.g. 2017-2019" },
    { key: "tagline", label: "Short line", kind: "text", limit: 60, optional: true, source: "e.g. “Branding Canada globally”" },
    { key: "summary", label: "Summary", kind: "text", limit: 400, long: true, optional: true, about: "Use this, or the three below, or both.", source: "One or two sentences" },
    { key: "challenge", label: "Challenge", kind: "text", limit: 700, long: true, optional: true, source: "What needed solving" },
    { key: "solution", label: "Solution", kind: "text", limit: 900, long: true, optional: true, source: "What you did" },
    { key: "results", label: "Results", kind: "text", limit: 700, long: true, optional: true, source: "What changed" },
  ]),
  t("km-gallery", "Media gallery", "kmgallery", "km-folio", "The work itself: images and short videos, full width, one under the other, each with an optional caption.", [
    { key: "items", label: "Images and videos", kind: "list", max: 12, cols: [{ key: "media", label: "Video or image", kind: "image" }, { key: "caption", label: "Caption", limit: 120 }], about: "In this order. Videos loop silently.", source: "Sources → Images & video" },
  ]),
  t("km-title", "Section title", "kmtitle", "km-text", "A big gold title (with an optional white second part) and a short intro.", [
    { key: "title", label: "Title", kind: "text", limit: 80, source: "e.g. “AI Case Studies”" },
    { key: "accent", label: "White words after the title", kind: "text", limit: 40, optional: true, source: "e.g. “The suite does.”" },
    { key: "lede", label: "Intro", kind: "text", limit: 500, long: true, optional: true, source: "One or two sentences" },
  ]),
  t("km-stats", "Big numbers", "kmstats", "km-text", "Up to three big gold numbers with a short line each, in a filled box.", [
    { key: "stats", label: "Numbers", kind: "list", max: 3, axis: "x", cols: [{ key: "number", label: "Number", limit: 12 }, { key: "text", label: "Line", limit: 80 }], source: "Proof points" },
  ]),
  t("km-principles", "Principle cards", "kmprinciples", "km-text", "Up to four short cards (optional small label, title, text) in a filled box with thin dividers.", [
    { key: "cards", label: "Cards", kind: "list", max: 4, axis: "x", cols: [{ key: "label", label: "Small label", limit: 20 }, { key: "title", label: "Title", limit: 50 }, { key: "text", label: "Text", limit: 200, long: true }], source: "How you work" },
  ]),
  t("km-columns", "Experience columns", "kmcolumns", "km-text", "Up to six columns: a name, a small line, a rule, then a list (one item per line).", [
    { key: "cols", label: "Columns", kind: "list", max: 6, axis: "x", cols: [{ key: "head", label: "Name", limit: 30 }, { key: "sub", label: "Small line", limit: 40 }, { key: "lines", label: "List (one per line)", limit: 300, long: true }], source: "Roles, years, results" },
  ]),
  t("km-groups", "Skills & tools", "kmgroups", "km-text", "Groups of short items (skills, industries, languages). Write “Name: description” on a line to show a tool with its description.", [
    { key: "title", label: "Title", kind: "text", limit: 60, optional: true, source: "e.g. “Skills”" },
    { key: "groups", label: "Groups", kind: "list", max: 12, cols: [{ key: "head", label: "Group", limit: 30 }, { key: "items", label: "Items (one per line)", limit: 900, long: true }], source: "Skills, clients by industry, tools" },
  ]),
  t("km-logo-strip", "Logo strip", "kmstrip", "km-logos", "One row of white logos sliding sideways on a dark band.", [
    { key: "logos", label: "Logos", kind: "logos", max: 20, axis: "x", source: "Images · Client logos (white)" },
  ], ["black", "charcoal", "mustard"]),
  t("km-logo-wall", "Logo wall", "kmwall", "km-logos", "A title and a grid of logos: five across, three on phones.", [
    { key: "title", label: "Title", kind: "text", limit: 60, optional: true, source: "e.g. “More Experience”" },
    { key: "logos", label: "Logos", kind: "logos", max: 20, axis: "x", source: "Images · Client or tool logos" },
  ]),
  t("km-edu", "Education cards", "kmedu", "km-cards", "A title and up to six cards: name, a gold line, dates, ticked points and a link.", [
    { key: "title", label: "Title", kind: "text", limit: 60, optional: true, source: "e.g. “Education & Professional Organizations”" },
    { key: "cards", label: "Cards", kind: "list", max: 6, axis: "x", cols: [{ key: "title", label: "Name", limit: 50 }, { key: "sub", label: "Gold line", limit: 60 }, { key: "dates", label: "Dates", limit: 20 }, { key: "points", label: "Points (one per line)", limit: 300, long: true }, { key: "link", label: "Link", limit: 300 }], source: "Schools and memberships" },
  ]),
  t("km-footer", "Footer", "kmfooter", "km-foot", "Logo, a line of contact details with the Book a call button, and a small print line.", [
    { key: "logo", label: "Logo", kind: "image", optional: true, source: "Images · Andrew K logo" },
    { key: "items", label: "Contact line", kind: "list", max: 4, axis: "x", cols: [{ key: "item", label: "Item", limit: 40 }], source: "Title, phone, email" },
    { key: "button", label: "Button text", kind: "text", limit: 22, optional: true, source: "Usually “Book a call”" },
    { key: "link", label: "Button link", kind: "link", optional: true, source: "Your Calendly link" },
    { key: "fine", label: "Small print", kind: "text", limit: 120, optional: true, source: "e.g. Copyright © 2026 Kreickmarketing.com" },
  ], ["black", "charcoal", "mustard"]),
];

// ── Portfolio projects (kreickmarketing.com/work/<slug>, Oct 21): words from the live pages ──
// Images and videos (7–8 per page, `media`) are uploaded in Studio; the gallery starts empty (one drop box).
type KmWork = { slug: string; id: string; name: string; years: string; tagline: string; media: number; summary?: string; challenge?: string; solution?: string; results?: string };
export const KM_WORK: KmWork[] = [
  { slug: "invcanada", id: "wic", name: "INV Canada", years: "2017-2019", tagline: "Branding Canada globally", media: 7,
    challenge: "The Canadian government needed a strong national brand identity for global positioning and foreign investment. However, the initial plan was only a basic branding guideline, followed by outsourcing to an external ad agency.",
    solution: "Encouraged the full branding to be in-house. Oversaw the creative direction of brand identity, social media, flagship digital branding, experience marketing, annual reports, and onboarding sales kits. Additionally, served as one of the government's first Creative Directors.",
    results: "Successfully launched a cohesive national brand identity, saving the program from a large external marketing budget. Led the creative and strategic direction for 18 months, establishing a strong foundation for Canada's global branding efforts." },
  { slug: "pp", id: "wpp", name: "PayPal", years: "2019-2024", tagline: "PayPal", media: 7,
    challenge: "PayPal's marketing approach was overly product-driven, with marginal customer engagement, and flattening email click-through rates.",
    solution: "To shift messaging from a product-first approach to customer-first storytelling. The More Plus Less strategy was proposed to deliver shorter emails in a sequence to gradually warm up customers before introducing detailed product information. Digital campaigns could be revamped to better align with user needs and behaviors.",
    results: "The implementation of the More Plus Less strategy significantly increased email click-through rates from 17% to 54%, generating strong lift at a program level. This approach became a foundational playbook for activation marketing." },
  { slug: "circlerproducts", id: "wcr", name: "Circle R Products", years: "2013-19", tagline: "Circle R Products", media: 7,
    challenge: "This major agricultural company in Belize needed to find a way to stop unethical repackaging which was occurring in local grocery stores. They also wanted to establish a brand to sell to neighboring countries.",
    solution: "To develop a distinctive branded product packaging to position Circle R as the optimal brand compared to generic competitors. This would establish the brand at the retail level, engaging directly with merchants, fostering stronger respect for the product. Additionally, direct engagement at national agriculture shows was crucial. The experiential marketing exhibit showcased ethical farming techniques through live crop demonstrations, interactive games, and a sampling program, creating a memorable brand experience.",
    results: "Within two years, consumers replaced “rice” with the brand name, pressuring store owners not to repackage Circle R's products. This national shift was driven by strategic branding, packaging, digital marketing, in-store promotions, and experiential marketing." },
  { slug: "expo-dubai", id: "wex", name: "Expo Dubai 2020", years: "2019-20", tagline: "Expo Dubai 2020", media: 7,
    challenge: "Canada needed a compelling brand narrative for Expo Dubai 2020 but was overly focused on pavilion architecture rather than positioning the country as a global leader in innovation and economic partnership.",
    solution: "We shifted the focus from pavilion-based branding to a nationwide investment and innovation strategy, developing the “Supercharge Your World” campaign to position Canada as a key economic and technological partner on the global stage. Through strategic planning and collaboration, we successfully navigated multiple levels of government approval to secure buy-in for the campaign.",
    results: "The campaign was fully approved and the branding strategy was officially adopted and implemented. However, Expo Dubai 2020 was canceled due to pandemic closures." },
  { slug: "brenning", id: "wbr", name: "Brenning Construction", years: "2019-2020", tagline: "Full brand, digital, fleet & swag", media: 8,
    summary: "Transforming a middle of the pack paving company into a major player in the Eastern Ontario construction market." },
  { slug: "zavida", id: "wza", name: "Zavida", years: "2013-16", tagline: "Comms strategy · UX / UI", media: 7,
    summary: "A simple story of becoming better to a saturated market and giving more back to the world." },
  { slug: "flourish", id: "wfl", name: "Flourish Healthcare", years: "2021-22", tagline: "Full branding, naming, & UX / UI design", media: 8,
    summary: "Developing a health brand that delivers on their promise to work towards healing in all areas of life." },
];
const workCards = () => KM_WORK.map((w) => ({ title: w.name, years: w.years, link: `page:work-${w.slug}` }));

// ── Page templates: a page's sections in order ([uid, template, name]) and their words ──
export type KmPage = { id: string; name: string; path: string; about: string; source: string; sections: [string, string, string][]; bg?: Record<string, string> };
export const KM_PAGES: KmPage[] = [
  { id: "gigs", name: "Gigs (home)", path: "/", source: "kreickmarketing.com/gigs",
    about: "The home page (was /gigs; the old home and /case_studies fold into it): cover with three workflows, ignite band, client logo strip, project cards, skills, experience by industry, education and footer.",
    sections: [
      ["gg-cover", "km-cover", "Cover"], ["gg-bar", "km-cta-bar", "Book a call bar"], ["gg-ignite", "km-ignite", "Ignite your team"],
      ["gg-strip", "km-logo-strip", "Client logos"], ["gg-work", "km-projects", "Projects"], ["gg-bar2", "km-cta-bar", "Book a call bar"],
      ["gg-skills", "km-groups", "Skills"], ["gg-bar3", "km-cta-bar", "Book a call bar"], ["gg-exp", "km-groups", "Experience"],
      ["gg-bar4", "km-cta-bar", "Book a call bar"], ["gg-edu", "km-edu", "Education"], ["gg-foot", "km-footer", "Footer"],
    ],
    bg: { "gg-exp": "black" } },
  { id: "ai-work", name: "AI Work", path: "/ai-work", source: "Artifact “Andrew K AI Work”",
    about: "The AI Creative Director landing page: mustard cover, ignite band, case studies, leadership, the AI stack, the full-stack workflow, more experience and footer.",
    sections: [
      ["aw-cover", "km-cover", "Cover"], ["aw-bar", "km-cta-bar", "Book a call bar"], ["aw-ignite", "km-ignite", "Ignite your team"],
      ["aw-work", "km-title", "AI Case Studies · title"], ["aw-nori", "km-case", "Nori Media"], ["aw-chevy", "km-case", "Silverado"], ["aw-padis", "km-case", "Padis (two)"],
      ["aw-spirit", "km-case", "The Spirit Prompt"], ["aw-steps", "km-steps", "How I made it"], ["aw-kinney", "km-case", "Kinney AI"],
      ["aw-lead", "km-title", "Leadership · title"], ["aw-stats", "km-stats", "Leadership numbers"], ["aw-roles", "km-columns", "Roles"], ["aw-lead-p", "km-principles", "How I lead"],
      ["aw-stack", "km-title", "AI stack · title"], ["aw-stack-p", "km-principles", "Why the suite"], ["aw-tools", "km-groups", "The tools"],
      ["aw-flow", "km-title", "Workflow · title"], ["aw-phases", "km-principles", "Workflow phases"],
      ["aw-clients", "km-logo-wall", "More Experience"], ["aw-foot", "km-footer", "Footer"],
    ],
    bg: { "aw-lead": "black", "aw-stats": "black", "aw-roles": "black", "aw-lead-p": "black", "aw-flow": "black", "aw-phases": "black" } },
  // The 7 portfolio pages: intro, the work, a call bar, the other projects, footer.
  ...KM_WORK.map((w): KmPage => ({ id: `work-${w.slug}`, name: w.name, path: `/work/${w.slug}`, source: `kreickmarketing.com/work/${w.slug}`,
    about: `Portfolio page: ${w.name}. Project intro, ${w.media} images and videos, a Book a call bar, the other projects, footer.`,
    sections: [[`${w.id}-intro`, "km-project", "Project intro"], [`${w.id}-media`, "km-gallery", "The work"], [`${w.id}-bar`, "km-cta-bar", "Book a call bar"],
      [`${w.id}-more`, "km-projects", "More work"], [`${w.id}-foot`, "km-footer", "Footer"]],
    bg: { [`${w.id}-more`]: "black" } })),
];

const CAL = "https://calendly.com/andrew-clearmark/15min";
const RESUME = "https://drive.google.com/file/d/1psuAI-fFjlhwbq_lX7xMUlvn2soBuCE2/view?usp=sharing";
const bar = (uid: string) => ({ [`${uid}.button`]: "Book a call", [`${uid}.link`]: CAL });
const contact = [{ item: "andrew@kreickmarketing.com" }, { item: "613.328.2881" }, { item: "AI Creative Director" }];
const footer = (uid: string, fine: string) => ({ [`${uid}.items`]: [{ item: "AI Creative Director" }, { item: "613.328.2881" }, { item: "andrew@kreickmarketing.com" }],
  [`${uid}.button`]: "Book a call", [`${uid}.link`]: CAL, [`${uid}.fine`]: fine });
const lines = (...l: string[]) => l.join("\n");

// Starting words for each spot ("uid.key"). Images are left empty until they're uploaded
// to Studio (Sources → Images), so those spots show as dotted boxes to fill.
export const KM_CONTENT: Record<string, unknown> = {
  // AI Work
  "aw-cover.headline": "I ignite creative teams in three ways that raise the quality and speed of AI work.",
  "aw-cover.highlight": "three",
  "aw-cover.three": [{ num: "One:", text: "Own the Creative Vision" }, { num: "Two:", text: "Direct and Grow the Team" }, { num: "Three:", text: "Build AI Into the Craft" }],
  "aw-cover.button": "Book a call", "aw-cover.link": CAL, "aw-cover.resume": "Download My Résumé", "aw-cover.resumeLink": RESUME, "aw-cover.contact": contact,
  ...bar("aw-bar"),
  "aw-ignite.headline": "ignite your team",
  "aw-ignite.buttons": [{ label: "AI Case Studies", link: "page:ai-work#aw-work" }, { label: "Leadership", link: "page:ai-work#aw-lead" }, { label: "How I Use AI", link: "page:ai-work#aw-stack" }],
  "aw-work.title": "AI Case Studies",
  "aw-work.lede": "One AI pipeline that keeps a product, a person and a look consistent from the first frame to the last.",
  "aw-nori.cases": [{ client: "Nori Media Group", title: "Take It Further", hook: "Leave “that's how we've always done it” in the rearview.",
    text: "A supercar tears out of the city and into open desert under the stars, leaving the old way of doing things behind. The film lands on the publisher's promise: take it further. I concepted, generated and edited it entirely in an AI pipeline. The vehicle, lighting and camera language hold steady from the first frame to the last.",
    tools: "Weavy, Nano Banana, WAN", role: "AI Creative Director, concept through final edit" }],
  "aw-chevy.cases": [{ client: "Chevrolet · Media.Monks", title: "Silverado 1500 TurboMax: “Dirt n Dust”", hook: "Every super is a real spec from the brief.",
    text: "A 20-second spot for the 2025 Silverado 1500 TurboMax: 430 lb-ft of torque, a 2-inch factory lift, 35-inch tires. The grille, badge and body lines stay accurate through every dune shot, finished with a high-quality AI voiceover and an original score.",
    tools: "Midjourney, Runway, ElevenLabs, Udio", role: "Senior Art Director, Media.Monks" }],
  "aw-padis.cases": [
    { client: "Padis Jewelry", title: "Concept Two: Golden Gate", hook: "Luxury you notice from across the water.",
      text: "A couple on a classic wooden boat beneath the Golden Gate leads into a close-up of a lab-grown diamond stud, then the offer: $910 elsewhere, $299 at Padis. The model and the earring stay identical in every shot, and the score is original.",
      tools: "Weavy, Nano Banana, WAN, Udio", role: "AI Creative Director: concept, art direction and production" },
    { client: "Padis Jewelry", title: "Concept Three: Coastal Cliffs", hook: "A quiet moment that makes the diamond the headline.",
      text: "Same brief, a quieter story. A woman stands alone on rugged coastal cliffs until the camera finds the stud, then the same $910 versus $299 reveal. Three concepts from one brief let Padis test which story converts. Model and product stay accurate from wide shot to macro close-up.",
      tools: "Weavy, Nano Banana, WAN, Udio", role: "AI Creative Director: concept, art direction and production" }],
  "aw-spirit.cases": [{ client: "The Spirit Prompt", title: "“Lay It Down”", hook: "Three voices, one moment. Four steps from a mood to a performance.",
    text: "Three singers in warm studio light, layered as stacking photo cards under kinetic lyric type. The performers and the music are AI-generated and original. Every step ran as a node workflow in Weavy, so the look, the faces and the frames stay locked from shot to shot.",
    tools: "Midjourney, Weavy, WAN 2.7, Nano Banana, Udio, Adobe CC", role: "AI Creative Director: art direction, workflow and final edit" }],
  "aw-steps.steps": [
    { title: "Set the style", text: "I chose the look in Midjourney, then had an LLM break my references into a reusable style prompt: warm stage light, red-orange palette, 85mm lens at f/1.8, Kodak Portra 400 grain." },
    { title: "Cast the singers", text: "I swapped in the faces I wanted, keeping each shot's composition, microphone and pose, then directed new angles and emotion from the same performer." },
    { title: "Build the first and last frames", text: "I applied the saved style to every shot with faces and wardrobe locked, then made a wide first frame and a close last frame for the video to travel between." },
    { title: "Sync the performance", text: "I fed my vocal track into WAN 2.7 Video to lip-sync each singer to the lyrics, then cut the edit and the kinetic type in Adobe CC." }],
  "aw-kinney.cases": [{ client: "Kinney AI · now Clearmark Training", title: "Sustaining Leadership", hook: "A launch system for a book on leadership, emotional intelligence and AI.",
    text: "The brand, launch site, imagery and video for James Nicholas Kinney's Sustaining Leadership: Rewriting the Language Model for Leadership, built to drive pre-release waitlist signups. One visual identity runs from the cover to the site to the ads. The AI imagery was refined to hold up in print and on screen.",
    tools: "Midjourney, Nano Banana, Runway", role: "AI Creative Director: branding, book cover, launch site, video and ads" }],
  "aw-lead.title": "I lead from inside the tools.",
  "aw-lead.lede": "At Nori Media I lead 20+ people through an AI and monday.com rollout, with creative direction and mentoring running alongside it. I built automation and AI into the whole creative process, from ideation to final export to press. Generic AI output went down and the quality of the final creative went up.",
  "aw-stats.stats": [{ number: "20+", text: "people led through an AI and monday.com rollout" }, { number: "16 weeks", text: "publisher's launch cycle, down from 360 days" }, { number: "4", text: "books shipped on time, with zero delays" }],
  "aw-roles.cols": [
    { head: "Nori Media", sub: "", lines: lines("AI Strategic Creative Dir.", "(2026 - Present)", "20+ people", "Launch cycle from 360 days to 16 weeks; four books on time") },
    { head: "Kinney AI", sub: "now Clearmark Training", lines: lines("AI Creative Dir.", "(2025 - 2026)", "Branding, startup launch, AI workflows", "Sustaining Leadership book launch system") },
    { head: "Media.Monks", sub: "", lines: lines("Sr. Art Dir., PayPal + Chevrolet", "(2021 - 2025)", "Trained account leads and creatives on AI fundamentals", "PayPal email CTR from 17% to 54%") },
    { head: "ClearMark", sub: "", lines: lines("Creative Dir.", "(2019 - 2021)", "Four graphic designers", "Brand and comms for Brenning and the Information Commissioner of Canada") },
    { head: "Invest in Canada", sub: "", lines: lines("Creative Dir., Government of Canada", "(2017 - 2019)", "Team of four across social, design, video and web, plus tradeshow suppliers", "National brand built in-house, saving a large external agency budget") }],
  "aw-lead-p.cards": [
    { title: "Direction with the reasoning.", text: "The team knows what to make and why, so they can make the next call without me." },
    { title: "Feedback that is direct and kind.", text: "Clear about what isn't working, respectful of the person who made it." },
    { title: "Room to test and learn.", text: "Small experiments beat long debates." },
    { title: "I make the work alongside the team.", text: "My feedback comes from inside the tools, not from a slide." }],
  "aw-stack.title": "No single A.I. tool makes the work.",
  "aw-stack.accent": "The suite does.",
  "aw-stack.lede": "You need an AI suite, not a favourite app. I pick each tool for control, not novelty. Claude sets the direction, node pipelines produce at volume, and Adobe finishes the work to print-ready. On one campaign, that chain turned a single template into 217 unique images.",
  "aw-stack-p.cards": [
    { title: "Control over surprise.", text: "Output has to be precise and repeatable, not lucky." },
    { title: "Consistency.", text: "The same product, face and light from the wide shot to the macro close-up." },
    { title: "Commercial safety.", text: "Work a client can put their name on." },
    { title: "It fits the team.", text: "One visible path from brief to delivery, in tools people already use." }],
  "aw-tools.groups": [
    { head: "Direct", items: lines("Claude: My built-in art director. It builds brand design systems and reusable production templates for every downstream asset.", "Gemini: Multimodal review, research and a second read on copy.", "NotebookLM: Turning briefs, transcripts and research into usable insight.", "ChatGPT: Quick variations, prompt refinement and copy drafts.") },
    { head: "Build the pipeline", items: lines("Weavy: Repeatable image pipelines at volume: 217 unique images for one campaign from a single template.", "ComfyUI: Custom, controllable workflows when output has to be precise and repeatable.", "Make.com: Automating production handoffs between tools, from ideation to final export.") },
    { head: "Image", items: lines("Midjourney: High-craft concept and hero imagery, and fast art-direction exploration.", "Nano Banana: Precise, consistent edits and variations without losing the original.", "Adobe Firefly + Creative Cloud AI: Commercially safe generation and production edits inside the tools teams already use.") },
    { head: "Video", items: lines("Higgsfield: Cinematic AI video with directed camera motion.", "WAN: Image-to-video from a start frame to an end frame, with audio mixing built in. The most versatile model in my video stack.", "Runway: AI video generation and editing for motion concepts.", "HeyGen: Avatar-led and localized spokesperson video.") },
    { head: "Sound", items: lines("ElevenLabs: Voiceover and voice design for video and animatics.", "Udio: Original music beds and scores for video.") },
    { head: "Plan and finish", items: lines("Relume: AI sitemaps and wireframes for landing pages.", "monday.com: One visible workflow for the whole team, from brief to delivery.", "Adobe Creative Cloud: Finishing, layout and print-ready export for everything the AI tools produce.") }],
  "aw-flow.title": "Full-Stack A.I. Workflow",
  "aw-flow.lede": "One prompt chain takes a company from research to channel-ready content. Each step feeds the next, so strategy, pitch and production share one line of reasoning instead of starting over at every handoff.",
  "aw-phases.cards": [
    { label: "Research", title: "Know the company", text: "A company info prompt feeds three in parallel: industry fit, target company fit and target personas." },
    { label: "Strategy", title: "Build the plan", text: "Content strategy development workflow prompts combine all four research outputs, including the company info directly, into one strategy." },
    { label: "Pitch", title: "Show the idea", text: "Sample pitch content, then user journey prompts that map the full funnel, with the strategy feeding both." },
    { label: "Create", title: "Make it for every channel", text: "Ten channels, from traditional media and events to social, PR, partnerships, direct sales and customer advocacy, feed the content creation prompts." }],
  "aw-clients.title": "More Experience",
  ...footer("aw-foot", ""),
  // Gigs
  "gg-cover.headline": "I specialize in three simple creative direction workflows to ignite your team.",
  "gg-cover.highlight": "three",
  "gg-cover.three": [{ num: "One:", text: "Short Term Creative Help" }, { num: "Two:", text: "Pitch Winning Support" }, { num: "Three:", text: "Activate New Clients Projects" }],
  "gg-cover.button": "Book a call", "gg-cover.link": CAL, "gg-cover.resume": "Download My Résumé", "gg-cover.resumeLink": RESUME,
  ...bar("gg-bar"), ...bar("gg-bar2"), ...bar("gg-bar3"), ...bar("gg-bar4"),
  "gg-ignite.headline": "ignite your team",
  "gg-work.cards": workCards(),
  "gg-skills.title": "Skills",
  "gg-skills.groups": [
    { head: "Brand / Creative Dir.", items: lines("Packaging Design", "Ideation & Strategy", "Advertising & Comms.", "Brand Dev.", "Digital Design") },
    { head: "A.I. Workflows", items: lines("A.I. Workflow Design", "A.I. Prompt Design", "Static A.I. Creative", "Video A.I. Creative", "Audio A.I. Creative") },
    { head: "UX UI Design", items: lines("User Flow Strategy", "User Experience", "Information Architecture", "AI Design & Content", "CMS Design", "Responsive Design") },
    { head: "Agile Workflow", items: lines("New Business", "Elevated Client Projects", "Project Mgmt.", "Time & Budget", "Production Mgmt.") },
    { head: "Team Leadership", items: lines("Copy Dir.", "Art Dir.", "Photo Dir.", "Illustration Dir.", "Animation Dir.", "Video Dir.", "Developer Dir.") },
    { head: "Languages", items: lines("English 100%", "Spanish 30%", "French 20%") }],
  "gg-exp.title": "Experience",
  "gg-exp.groups": [
    { head: "Food Service", items: lines("Coca Cola", "Pepsi", "Dare", "Kinder Bueno", "KRAFT", "Mars", "McCain", "Nabob") },
    { head: "Finance", items: lines("PayPal", "ADP", "Moneris", "Allstate", "CIBC", "Scotia") },
    { head: "Infrastructure", items: lines("Brenning Ltd.", "Black & Decker", "Circle R") },
    { head: "Public Sector", items: lines("Expo 2020 Dubai", "Library of Parliament", "Invest in Canada", "Information Commissioner of Canada") },
    { head: "Telecomm.", items: lines("CMAP", "Rogers", "Telus", "Verizon") },
    { head: "Retail", items: lines("McDonald's", "Zavida", "Circle R") },
    { head: "Automotive", items: lines("General Motors", "Chevrolet") },
    { head: "Electronics", items: lines("Sharp", "Sony") },
    { head: "Health Beauty", items: lines("Ivory", "Right Guard", "Oil of Olay") },
    { head: "Home Care", items: lines("Purex", "Tide", "P&G") },
    { head: "Pet Care", items: lines("FirstMate", "Kasiks") },
    { head: "Pharma", items: lines("Bell Lifestyle") },
    { head: "Real Estate", items: lines("RE/MAX") }],
  "gg-edu.title": "Education & Professional Organizations",
  "gg-edu.cards": [
    { title: "George Brown University", sub: "Advertising & Design · Honours Degree", dates: "1999 - 2001", points: lines("Advertising Fundamentals", "Graphic Design", "Project Mgmt.", "Digital & Traditional"), link: "https://www.georgebrown.ca/" },
    { title: "Ambrose University", sub: "Masters in Intercultural Studies · in progress", dates: "2009 - 2010", points: lines("Research Strategy & Analysis", "Program Design & Dev.", "Leadership & Coaching", "Advanced Presentation"), link: "https://ambrose.edu/" },
    { title: "Rideau Club Canada", sub: "Member", dates: "2018 - 2020", points: lines("Professional Growth", "High End Networking", "Master Class Seminars"), link: "" },
    { title: "Art Director Club of Canada", sub: "Member", dates: "2000 - 2004", points: lines("Industry Dev.", "Advertising Best Practices", "Championing Creative Excellence", "Internationally Recognized Awards"), link: "" }],
  ...footer("gg-foot", "Copyright 2025 © Kreickmarketing.com"),
  // Portfolio pages
  ...Object.assign({}, ...KM_WORK.map((w) => ({
    [`${w.id}-intro.title`]: w.name, [`${w.id}-intro.years`]: w.years, [`${w.id}-intro.tagline`]: w.tagline,
    ...(w.summary ? { [`${w.id}-intro.summary`]: w.summary } : {}),
    ...(w.challenge ? { [`${w.id}-intro.challenge`]: w.challenge, [`${w.id}-intro.solution`]: w.solution, [`${w.id}-intro.results`]: w.results } : {}),
    ...bar(`${w.id}-bar`),
    [`${w.id}-more.title`]: "More work", [`${w.id}-more.cards`]: workCards().filter((c) => c.title !== w.name),
    ...footer(`${w.id}-foot`, "Copyright 2025 © Kreickmarketing.com"),
  }))),
};

// The Kreick site's starting nav (site chrome, like ClearMark's Global nav).
export const KM_NAV = {
  links: [{ label: "Work", link: "page:gigs#gg-work" }, { label: "Skills", link: "page:gigs#gg-skills" },
    { label: "AI Work", link: "page:ai-work" }, { label: "Education", link: "page:gigs#gg-edu" }],
  cta: { label: "Book a call", link: CAL },
};

// ── Sample content (canvas boards and Studio → Templates previews) ──
// A template's words from its first use in a page template (or the section `uid`), with grey
// labelled boxes for images that aren't uploaded yet.
const ph = (label: string, w: number, h: number) => "data:image/svg+xml," + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="#33302c"/><text x="50%" y="50%" fill="#a9a69e" font-family="Arial" font-size="${Math.round(Math.min(w, h) / 12)}" text-anchor="middle" dominant-baseline="middle">${label}</text></svg>`);
const phLogo = (n: number) => "data:image/svg+xml," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80"><rect x="2" y="2" width="196" height="76" rx="8" fill="none" stroke="#fff" stroke-width="3" opacity=".6"/><text x="100" y="48" fill="#fff" opacity=".7" font-family="Arial" font-size="24" text-anchor="middle">Logo ${n}</text></svg>`);
const PH_IMAGES: Record<string, [string, number, number]> = { "km-cover.image": ["Matchbox cover image", 797, 1024], "km-ignite.image": ["Match video", 1600, 900], "km-footer.logo": ["Andrew K logo", 300, 140] };
export const kmFirstUse = (tplId: string) => KM_PAGES.flatMap((p) => p.sections).find(([, t]) => t === tplId)?.[0] || "";
export const kmGround = (uid: string) => KM_PAGES.map((p) => p.bg?.[uid]).find(Boolean) || "";
export function kmSample(tplId: string, uid = kmFirstUse(tplId)): Record<string, unknown> {
  const tpl = KM_TEMPLATES.find((x) => x.id === tplId), out: Record<string, unknown> = {};
  if (!tpl) return out;
  const tall = KM_CONTENT[`${uid}.cases`] && (KM_CONTENT[`${uid}.cases`] as unknown[]).length > 1;
  for (const sl of tpl.slots) {
    let v = KM_CONTENT[`${uid}.${sl.key}`];
    if (sl.kind === "image" && !v && PH_IMAGES[`${tplId}.${sl.key}`]) v = ph(...PH_IMAGES[`${tplId}.${sl.key}`]);
    if (tplId === "km-gallery" && sl.key === "items" && !v) v = [{}, {}, {}];
    if (sl.kind === "logos" && !v) v = Array.from({ length: tplId === "km-logo-wall" ? 10 : 8 }, (_, i) => phLogo(i + 1));
    if (sl.kind === "list" && Array.isArray(v)) v = v.map((r: Record<string, unknown>) => {
      const row = { ...r };
      for (const c of sl.cols || []) if (c.kind === "image" && !row[c.key]) row[c.key] = c.key === "media" ? ph("Video or image", tall ? 900 : 1600, tall ? 1600 : 900) : ph(c.label, 1600, 1000);
      return row;
    });
    out[sl.key] = v;
  }
  return out;
}
// Images in samples are our own placeholders or local files; links aren't followed in previews.
export const KM_SAMPLE_KIT: KmKit = { img: (v) => (typeof v === "string" && v ? v : null), video: () => null, href: (v) => (typeof v === "string" && v ? "#" : null) };

// ── Live drawing ──
// kit: how the live site checks images, videos and links (lib/builder-site.ts passes
// safeImage / safeVideo / safeHref after resolving "page:" links). Empty spots draw nothing.
export type KmKit = { img: (v: unknown) => string | null; video: (v: unknown) => string | null; href: (v: unknown) => string | null };
const esc = (v: unknown) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const rowsOf = (v: unknown): Record<string, unknown>[] => (Array.isArray(v) ? v.filter((r) => r && typeof r === "object" && Object.values(r).some((x) => str(x))) : []);
const linesOf = (v: unknown) => str(v).split("\n").map((l) => l.trim()).filter(Boolean);
export const KM_NUMS = ["One", "Two", "Three", "Four"];
export const KM_STORY: [string, string][] = [["challenge", "Challenge"], ["solution", "Solution"], ["results", "Results"]];
export const KM_ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
// The headline with its red word (the first time it appears) in <em>. Both are already escaped.
export const kmHighlight = (h: string, w: string) => { const i = w ? h.indexOf(w) : -1; return i < 0 ? h : `${h.slice(0, i)}<em>${w}</em>${h.slice(i + w.length)}`; };
// "Name: description" lines become a tool with its description; plain lines are short items.
export const kmItem = (l: string) => { const i = l.indexOf(": "); return i > 0 && i < 40 ? [l.slice(0, i), l.slice(i + 2)] : [l, ""]; };

export function drawKm(type: string, P: (key: string) => unknown, kit: KmKit): string {
  const text = (key: string, tag: string, cls = "") => { const v = str(P(key)); return v ? `<${tag} class="${cls}" data-slot=".${key}">${esc(v)}</${tag}>` : ""; };
  const media = (v: unknown, attrs = "") => { const vid = kit.video(v); if (vid) return `<video ${attrs} src="${esc(vid)}" muted autoplay loop playsinline preload="metadata"></video>`; const im = kit.img(v); return im ? `<img ${attrs} src="${esc(im)}" alt="">` : ""; };
  const a = (href: string | null, inner: string, cls: string) => href ? `<a class="${cls}" href="${esc(href)}"${href.startsWith("http") ? ' target="_blank" rel="noopener noreferrer"' : ""}>${inner}</a>` : `<span class="${cls}">${inner}</span>`;
  const pill = (label: unknown, link: unknown, cls = "") => str(label) ? a(kit.href(link), `${esc(str(label))} ${KM_ARROW}`, `km-pill${cls}`) : "";
  const logos = (key: string) => (Array.isArray(P(key)) ? (P(key) as unknown[]) : []).map(kit.img).filter(Boolean).slice(0, 20) as string[];
  const title = (key = "title") => text(key, "h2", "km-title");
  switch (type) {
    case "kmcover": {
      const h = str(P("headline")), three = rowsOf(P("three")).slice(0, 3), contact = rowsOf(P("contact")).slice(0, 3);
      const resume = str(P("resume")) ? a(kit.href(P("resumeLink")), esc(str(P("resume"))), "km-link") : "";
      return `<div class="km-in km-cover-grid">${media(P("image"), 'class="km-matchbox" data-slot=".image"')}
        <div class="km-pitch">${h ? `<h1 data-slot=".headline">${kmHighlight(esc(h), esc(str(P("highlight"))))}</h1>` : ""}
        ${three.length ? `<ul class="km-three" data-slot=".three">${three.map((r) => `<li><span>${esc(str(r.num))}</span> <span>${esc(str(r.text))}</span></li>`).join("")}</ul>` : ""}
        ${pill(P("button"), P("link"))}${resume}
        ${contact.length ? `<p class="km-contact" data-slot=".contact">${contact.map((r) => `<span>${esc(str(r.item))}</span>`).join("")}</p>` : ""}</div></div>`;
    }
    case "kmbar": return str(P("button")) ? a(kit.href(P("link")), `${esc(str(P("button")))} ${KM_ARROW}`, "km-bar") : "";
    case "kmignite": {
      const btns = rowsOf(P("buttons")).slice(0, 3);
      return `<div class="km-ignite-bg">${media(P("image"), 'data-slot=".image" aria-hidden="true"')}</div>
        <div class="km-in km-ignite-in">${text("headline", "h2")}${btns.length ? `<div class="km-btns" data-slot=".buttons">${btns.map((r, i) => pill(r.label, r.link, i ? " sm outline" : " sm")).join("")}</div>` : ""}</div>`;
    }
    case "kmcase": {
      const cases = rowsOf(P("cases")).slice(0, 2);
      if (!cases.length) return "";
      return `<div class="km-in km-cases ${cases.length > 1 ? "two" : "one"}" data-slot=".cases">${cases.map((r) => {
        const m = media(r.media, 'class="km-fill"'), tools = str(r.tools).split(",").map((x) => x.trim()).filter(Boolean);
        return `<article class="km-case">${m ? `<div class="km-media">${m}</div>` : ""}${str(r.client) ? `<p class="km-head">${esc(str(r.client))}</p>` : ""}${str(r.title) ? `<h3>${esc(str(r.title))}</h3>` : ""}
          ${str(r.hook) || str(r.text) ? `<p class="km-desc">${str(r.hook) ? `<b>${esc(str(r.hook))}</b> ` : ""}${esc(str(r.text))}</p>` : ""}
          ${tools.length ? `<ul class="km-chips">${tools.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}${str(r.role) ? `<p class="km-role"><b>Role</b>${esc(str(r.role))}</p>` : ""}</article>`;
      }).join("")}</div>`;
    }
    case "kmsteps": {
      const steps = rowsOf(P("steps")).slice(0, 4);
      if (!steps.length) return "";
      return `<div class="km-in"><p class="km-head km-how">${esc(str(P("label")) || "How I made it")}</p><ol class="km-steps" data-slot=".steps">${steps.map((r, i) => {
        const m = media(r.image, 'class="km-fill"');
        return `<li>${m ? `<div class="km-shot">${m}</div>` : ""}<span class="km-n">${KM_NUMS[i]}</span><h4>${esc(str(r.title))}</h4><p>${esc(str(r.text))}</p></li>`;
      }).join("")}</ol></div>`;
    }
    case "kmprojects": {
      const cards = rowsOf(P("cards")).slice(0, 9);
      if (!cards.length) return "";
      return `<div class="km-in">${title()}<div class="km-projects" data-slot=".cards">${cards.map((r) => {
        const m = media(r.image, 'class="km-fill"');
        return a(kit.href(r.link), `<span class="km-proj-img">${m}</span><span class="km-proj-name">${esc(str(r.title))} ${KM_ARROW}</span>${str(r.years) ? `<span class="km-proj-years">${esc(str(r.years))}</span>` : ""}`, "km-proj");
      }).join("")}</div></div>`;
    }
    case "kmproject": {
      const tl = str(P("title")), story = KM_STORY.filter(([k]) => str(P(k)));
      if (!tl && !story.length && !str(P("summary"))) return "";
      const meta = [str(P("years")), str(P("tagline"))].filter(Boolean);
      return `<div class="km-in km-project"><div class="km-project-head">${text("title", "h1", "km-title")}${meta.length ? `<p class="km-project-meta">${meta.map(esc).join(" <span aria-hidden=\"true\">—</span> ")}</p>` : ""}</div>
        <div class="km-project-story">${text("summary", "p", "km-lede")}${story.map(([k, label]) => `<div class="km-story"><p class="km-n">${label}</p><p data-slot=".${k}">${esc(str(P(k)))}</p></div>`).join("")}</div></div>`;
    }
    case "kmgallery": {
      const v = rowsOf(P("items")).map((r) => ({ m: media(r.media, 'class="km-fill"'), c: str(r.caption) })).filter((x) => x.m);
      return v.length ? `<div class="km-in km-gallery" data-slot=".items">${v.map((x) => `<figure class="km-shot-wide">${x.m}${x.c ? `<figcaption>${esc(x.c)}</figcaption>` : ""}</figure>`).join("")}</div>` : "";
    }
    case "kmtitle": {
      const tl = str(P("title")), acc = str(P("accent"));
      return tl ? `<div class="km-in"><h2 class="km-title" data-slot=".title">${esc(tl)}${acc ? ` <span class="km-white">${esc(acc)}</span>` : ""}</h2>${text("lede", "p", "km-lede")}</div>` : "";
    }
    case "kmstats": {
      const v = rowsOf(P("stats")).slice(0, 3);
      return v.length ? `<div class="km-in"><div class="km-box n${v.length}" data-slot=".stats">${v.map((r) => `<div class="km-stat"><b>${esc(str(r.number))}</b><span>${esc(str(r.text))}</span></div>`).join("")}</div></div>` : "";
    }
    case "kmprinciples": {
      const v = rowsOf(P("cards")).slice(0, 4);
      return v.length ? `<div class="km-in"><div class="km-box n${v.length}" data-slot=".cards">${v.map((r) => `<div class="km-card">${str(r.label) ? `<span class="km-n">${esc(str(r.label))}</span>` : ""}<h3>${esc(str(r.title))}</h3><p>${esc(str(r.text))}</p></div>`).join("")}</div></div>` : "";
    }
    case "kmcolumns": {
      const v = rowsOf(P("cols")).slice(0, 6);
      return v.length ? `<div class="km-in km-cols" data-slot=".cols">${v.map((r) => `<div class="km-col"><p class="km-head">${esc(str(r.head))}</p>${str(r.sub) ? `<p class="km-sub">${esc(str(r.sub))}</p>` : ""}<div class="km-rule"></div><ul class="km-list">${linesOf(r.lines).map((l) => `<li>${esc(l)}</li>`).join("")}</ul></div>`).join("")}</div>` : "";
    }
    case "kmgroups": {
      const v = rowsOf(P("groups")).slice(0, 12);
      if (!v.length) return "";
      const rich = v.some((r) => linesOf(r.items).some((l) => kmItem(l)[1]));
      return `<div class="km-in">${title()}<div class="km-groups${rich ? " rich" : ""}" data-slot=".groups">${v.map((r) => `<div class="km-group"><p class="km-head">${esc(str(r.head))}</p><div class="km-rule"></div><ul class="km-items">${linesOf(r.items).map((l) => { const [n, d] = kmItem(l); return d && rich ? `<li><b>${esc(n)}</b><span>${esc(d)}</span></li>` : `<li>${esc(l)}</li>`; }).join("")}</ul></div>`).join("")}</div></div>`;
    }
    case "kmstrip": {
      const v = logos("logos");
      if (!v.length) return "";
      const reps = Math.max(1, Math.ceil(10 / v.length)), set = Array.from({ length: reps }, () => v.map((src) => `<img src="${esc(src)}" alt="">`).join("")).join("");
      return `<div class="km-strip" data-slot=".logos"><div class="km-strip-track" style="--km-time:${v.length * reps * 4}s">${set}<span style="display:contents" aria-hidden="true">${set}</span></div></div>`;
    }
    case "kmwall": {
      const v = logos("logos");
      return v.length || str(P("title")) ? `<div class="km-in">${title()}${v.length ? `<div class="km-wall" data-slot=".logos">${v.map((src) => `<img src="${esc(src)}" alt="">`).join("")}</div>` : ""}</div>` : "";
    }
    case "kmedu": {
      const v = rowsOf(P("cards")).slice(0, 6);
      return v.length ? `<div class="km-in">${title()}<div class="km-edu" data-slot=".cards">${v.map((r) => `<article class="km-edu-card"><h3>${esc(str(r.title))}</h3>${str(r.sub) ? `<p class="km-edu-sub">${esc(str(r.sub))}</p>` : ""}${str(r.dates) ? `<p class="km-edu-dates">${esc(str(r.dates))}</p>` : ""}
        <ul class="km-ticks">${linesOf(r.points).map((l) => `<li>${esc(l)}</li>`).join("")}</ul>${kit.href(r.link) ? a(kit.href(r.link), `Visit online ${KM_ARROW}`, "km-visit") : ""}</article>`).join("")}</div></div>` : "";
    }
    case "kmfooter": {
      const items = rowsOf(P("items")).slice(0, 4), logo = kit.img(P("logo"));
      return `<div class="km-in"><div class="km-foot">${logo ? `<img src="${esc(logo)}" alt="" data-slot=".logo">` : ""}
        <div class="km-foot-line" data-slot=".items">${items.map((r) => `<span>${esc(str(r.item))}</span>`).join("")}${pill(P("button"), P("link"), " sm")}</div></div>${text("fine", "p", "km-fine")}</div>`;
    }
  }
  return "";
}
