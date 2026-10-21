// Copies styles/colors.css, typography.css and radius.css into the Studio builder
// (the STYLE-CSS block in studio-builder.html), so the Claude prototype's Style
// screen shows the same values as the site. The real Studio reads the files
// directly on every load (app/apps/studio/builder/route.ts).
// Run: node scripts/sync-style.mjs
import { readFileSync, writeFileSync } from "node:fs";

const FILE = "docs/prototypes/studio-builder/studio-builder.html";
const css = ["colors", "typography", "radius"].map((f) => readFileSync(`styles/${f}.css`, "utf8")).join("\n");
const html = readFileSync(FILE, "utf8");
const re = /(<script type="text\/plain" id="style-css">)[\s\S]*?(<\/script>)/;
if (!re.test(html)) throw new Error("STYLE-CSS block not found in " + FILE);
// "</" can't appear inside a <script> block.
const next = html.replace(re, (_, a, b) => a + "\n" + css.replace(/<\//g, "<\\/") + "\n" + b);
if (next !== html) { writeFileSync(FILE, next); console.log("Style copied into the Studio builder."); }
else console.log("Style already up to date.");
