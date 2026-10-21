// Kreick Marketing templates: copies the one source into everything that uses it.
//   1. styles/brands/kreick.css      → the km-css block in the Studio builder
//   2. lib/km-sections.ts (templates, page templates, starting words, nav) → the km-data block
//   3. Canvas boards for Claude Design ("Kreick Marketing Studio Templates") in
//      docs/prototypes/kreick-design-templates/: <template-id>_<desktop|tablet|phone>.dc.html,
//      drawn with drawKm() and the starting words, plus Main.dc.html (index) and canvas.json.
//      Images that aren't uploaded yet show as labelled grey boxes.
// Run: node scripts/sync-kreick.mjs   (Node 22.18+ reads the .ts file directly)
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { KM_TEMPLATES, KM_GROUPS, KM_PAGES, KM_CONTENT, KM_NAV, KM_SAMPLE_KIT, drawKm, kmSample, kmFirstUse, kmGround } from "../lib/km-sections.ts";

const BUILDER = "docs/prototypes/studio-builder/studio-builder.html";
const OUT = "docs/prototypes/kreick-design-templates";
const css = readFileSync("styles/brands/kreick.css", "utf8");

// 1 + 2: the builder
const data = JSON.stringify({ templates: KM_TEMPLATES, groups: KM_GROUPS, pages: KM_PAGES, content: KM_CONTENT, nav: KM_NAV }, null, 1).replace(/<\//g, "<\\/");
let html = readFileSync(BUILDER, "utf8");
const blocks = [
  [/(<style id="km-css">)[\s\S]*?(<\/style>)/, "\n" + css.replace(/<\//g, "<\\/") + "\n"],
  [/(<script type="application\/json" id="km-data">)[\s\S]*?(<\/script>)/, "\n" + data + "\n"],
];
for (const [re, body] of blocks) {
  if (!re.test(html)) throw new Error("km block not found in " + BUILDER);
  html = html.replace(re, (_, a, b) => a + body + b);
}
writeFileSync(BUILDER, html);
console.log("Kreick templates copied into the Studio builder.");

// 3: canvas boards
const SIZES = [["desktop", 1280], ["tablet", 768], ["phone", 390]];
const SIZE_NAME = { desktop: "Desktop", tablet: "Tablet", phone: "Mobile" };  // file names keep "phone", like the ClearMark canvas
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
// Each board shows one template with the words from its first use in a page template
// (kmSample: images not uploaded yet are grey labelled boxes); an extra row shows two cases side by side.
const ROWS = KM_TEMPLATES.map((t) => ({ id: t.id, tpl: t, uid: kmFirstUse(t.id) }));
ROWS.splice(ROWS.findIndex((r) => r.id === "km-case") + 1, 0, { id: "km-case-two", tpl: KM_TEMPLATES.find((t) => t.id === "km-case"), uid: "aw-padis" });
const sample = (row) => kmSample(row.tpl.id, row.uid);
const bgOf = (row) => kmGround(row.uid);
const kit = KM_SAMPLE_KIT;
// The canvas can't hold data: images, so its boards use the placeholder images uploaded to it
// (scripts/km-canvas-assets.json: label → /_blob/ url; "|wide" / "|tall" by shape).
const ASSETS = JSON.parse(readFileSync("scripts/km-canvas-assets.json", "utf8"));
const canvasSrc = (html) => html.replace(/src="data:image\/svg\+xml,([^"]+)"/g, (m, enc) => {
  const svg = decodeURIComponent(enc.replace(/&amp;/g, "&")), [, w, h] = svg.match(/viewBox="0 0 (\d+) (\d+)"/) || [];
  const label = (svg.match(/<text[^>]*>([^<]*)<\/text>/) || [])[1] || "", key = label.startsWith("Logo") ? "Logo" : label;
  const url = ASSETS[`${key}|${+w >= +h ? "wide" : "tall"}`] || ASSETS[key];
  if (!url) throw new Error("No canvas image for placeholder " + label);
  return `src="${url}"`;
});
const board = (row, size, w) => {
  const v = sample(row), bg = bgOf(row);
  const inner = canvasSrc(drawKm(row.tpl.type, (k) => v[k], kit)).replace(/data-slot="\.([a-zA-Z]+)"/g, 'data-spot="$1"');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${esc(row.tpl.name)} · ${SIZE_NAME[size]}</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow:wght@300;400;500;600;700&amp;display=swap">
<style>
body{margin:0}
${css}
</style>
</helmet>
<div class="site brand-km" style="width: ${w}px; container-type: inline-size">
<section class="sec km t-${row.tpl.id}${bg ? ` bg-${bg}` : ""}" data-template="${row.tpl.id}">
${inner}
</section>
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":${w},"height":${HEIGHTS[`${row.id}_${size}`] || 800}}}'>
class Component extends DCLogic {
renderVals() {
return {};
}
}
</script>
</body>
</html>
`;
};

// Board heights, measured in a browser at each width (scripts/km-heights.json; re-measure when designs change).
let HEIGHTS = {};
try { HEIGHTS = JSON.parse(readFileSync("scripts/km-heights.json", "utf8")); } catch {}

mkdirSync(OUT, { recursive: true });
const boards = {}, order = ["Main.dc.html"], notes = {};
let y = 1160;
for (const row of ROWS) {
  let x = 0, rowH = 0;
  // A title over each row (the template's name and id).
  notes[row.id] = { x: 0, y: y - 260, text: `${row.id === "km-case-two" ? "Case study · two side by side" : row.tpl.name} · ${row.tpl.id}`, kind: "title1", maxW: 2600 };
  for (const [size, w] of SIZES) {
    const name = `${row.id}_${size}.dc.html`, h = HEIGHTS[`${row.id}_${size}`] || 800;
    writeFileSync(`${OUT}/${name}`, board(row, size, w));
    boards[name] = { h, title: `${row.id} · ${SIZE_NAME[size]} ${w}`, w, x, y };
    order.push(name); x += w + 80; rowH = Math.max(rowH, h);
  }
  y += rowH + 400;
}

// Index board: every template and the two page templates.
const cell = (name, id) => `<div style="display: flex; flex-direction: column; gap: 4px"><span style="font-size: 24px; line-height: 28px; font-weight: 600">${esc(name)}</span><span style="font-family: monospace; font-size: 14px; color: #a9a69e">${esc(id)}</span></div>`;
writeFileSync(`${OUT}/Main.dc.html`, `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Kreick Marketing Studio templates</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow:wght@300;400;500;600;700&amp;display=swap">
<style>body{margin:0}</style>
</helmet>
<div style="width: 1280px; height: 760px; box-sizing: border-box; padding: 64px; background: #201e1d; color: #FFFFFF; font-family: 'Barlow', sans-serif; display: flex; flex-direction: column; gap: 32px; border-top: 8px solid #e6bb5c">
<div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 32px">
<p style="margin: 0; font-size: 16px; line-height: 16px; letter-spacing: 3px; font-weight: 700; text-transform: uppercase; color: #cfa535">Kreick Marketing · Studio templates</p>
<p style="margin: 0; font-family: monospace; font-size: 16px; color: #a9a69e">v1 · Oct 21, 2026</p>
</div>
<h1 style="margin: 0; font-size: 64px; line-height: 60px; letter-spacing: -3px; font-weight: 700">Every section of kreickmarketing.com,<br><span style="color: #e6bb5c">at every size.</span></h1>
<div style="display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 16px 32px; border-top: 1px solid rgba(255,255,255,.3); padding-top: 32px">
${KM_TEMPLATES.map((t) => cell(t.name, t.id)).join("\n")}
</div>
<p style="margin: 0; font-size: 16px; line-height: 22px; color: #a9a69e">Page templates: ${KM_PAGES.map((p) => `<b style="color: #fff">${esc(p.name)}</b> (${esc(p.source)})`).join(" · ")}. Boards are named <span style="font-family: monospace; color: #FFFFFF">template-id_size</span> · Desktop 1280 · Tablet 768 · Mobile 390.</p>
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":1280,"height":760}}'>
class Component extends DCLogic {
renderVals() {
return {};
}
}
</script>
</body>
</html>
`);
boards["Main.dc.html"] = { h: 760, title: "Templates · index", w: 1280, x: 0, y: 0 };
// Keep the canvas's creation stamp across runs (the Design type wants it unchanged).
let created = { v: 1, at: new Date().toISOString().replace(/\.\d+Z$/, "Z") };
try { created = JSON.parse(readFileSync(`${OUT}/canvas.json`, "utf8")).createdOnFiles || created; } catch {}
writeFileSync(`${OUT}/canvas.json`, JSON.stringify({ v: 3, createdOnFiles: created, title: "Kreick Marketing Studio Templates", launch: { view: "canvas" }, pages: [], boards, order, notes, designSystems: [] }, null, 2) + "\n");
console.log(`Canvas: ${order.length} boards in ${OUT} (publish to ${ASSETS.canvas}).`);

// A local page with every board stacked, for checking and measuring heights in a browser.
writeFileSync(`${OUT}/preview.html`, `<!doctype html><meta charset="utf-8"><title>Kreick boards preview</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow:wght@300;400;500;600;700&display=swap">
<style>body{margin:0;background:#0d0d0d;font-family:Arial;color:#aaa}${css}.b{margin:40px}.b>p{margin:0 0 8px;font-size:13px}</style>
${ROWS.map((row) => SIZES.map(([size, w]) => {
  const v = sample(row), bg = bgOf(row);
  return `<div class="b" data-board="${row.id}_${size}"><p>${row.id} · ${size} ${w}</p><div class="site brand-km" style="width:${w}px;container-type:inline-size"><section class="sec km t-${row.tpl.id}${bg ? ` bg-${bg}` : ""}">${drawKm(row.tpl.type, (k) => v[k], kit)}</section></div></div>`;
}).join("")).join("\n")}`);
