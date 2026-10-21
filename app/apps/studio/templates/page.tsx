import Link from "next/link";
import { Barlow } from "next/font/google";
import { KM_GROUPS, KM_PAGES, KM_SAMPLE_KIT, KM_TEMPLATES, drawKm, kmGround, kmSample } from "@/lib/km-sections";
import heights from "@/scripts/km-heights.json";
import "@/styles/brands/kreick.css";

// Studio → Templates: browse each site's templates and start a page (or the whole site) from one.
// Kreick Marketing previews are drawn live with the same code as the site (drawKm), at the
// size picked: Desktop 1280, Tablet 768 or Mobile 390. "Start" opens the builder on the Kreick site.
// ClearMark's templates live in its Claude Design canvas and the builder's Modules panel.

const barlow = Barlow({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"], variable: "--font-barlow" });
const SIZES = { desktop: ["Desktop", 1280], tablet: ["Tablet", 768], phone: ["Mobile", 390] } as const;
type Size = keyof typeof SIZES;
const BOX = 360; // preview width in the card
const H = heights as Record<string, number>;
const CLEARMARK_CANVAS = "https://claude.ai/artifact/4SAJ91HAWLnyKJBSLAYmpM";
const KREICK_CANVAS = "https://claude.ai/artifact/2QVUF1U7BcnCxZiwFAREQv";
const BUILDER = "/apps/studio/builder";

// One section drawn at a screen width and shrunk to fit the card.
function Preview({ id, uid, size, maxH = 300 }: { id: string; uid?: string; size: Size; maxH?: number }) {
  const tpl = KM_TEMPLATES.find((t) => t.id === id)!, w = SIZES[size][1], zoom = BOX / w;
  const sample = kmSample(id, uid), ground = kmGround(uid ?? "");
  const html = drawKm(tpl.type, (k) => sample[k], KM_SAMPLE_KIT);
  const h = Math.min(maxH, Math.round((H[`${id}_${size}`] || 600) * zoom));
  return (
    <div className="tp-frame" style={{ height: h }} aria-hidden="true">
      <div className={`site brand-km ${barlow.variable}`} style={{ width: w, zoom }}>
        <section className={`sec km t-${id}${ground ? ` bg-${ground}` : ""}`} dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </div>
  );
}

export default async function Templates({ searchParams }: { searchParams: Promise<{ set?: string; size?: string }> }) {
  const sp = await searchParams;
  const set = sp.set === "clearmark" ? "clearmark" : "kreick";
  const size: Size = sp.size === "tablet" || sp.size === "phone" ? sp.size : "desktop";
  const href = (q: { set?: string; size?: Size }) => `/apps/studio/templates?set=${q.set ?? set}&size=${q.size ?? size}`;

  return (
    <div className="studio-page tp-page">
      <div className="studio-head">
        <p className="studio-kicker"><Link href="/apps/studio">Studio</Link></p>
        <h1>Templates</h1>
      </div>
      <ul className="studio-tabs" aria-label="Template sets">
        <li><Link href={href({ set: "kreick" })}><span aria-current={set === "kreick" ? "page" : undefined}>Kreick Marketing</span></Link></li>
        <li><Link href={href({ set: "clearmark" })}><span aria-current={set === "clearmark" ? "page" : undefined}>ClearMark</span></Link></li>
      </ul>

      {set === "clearmark" ? (
        <section className="studio-panel">
          <h2>ClearMark Studio Templates</h2>
          <p className="studio-hint">ClearMark&apos;s section templates (Hero, Heading, Photo + points, System, Engine, Offer cards and more) are designed on their Claude Design canvas at desktop, tablet and phone, and added to pages from the builder&apos;s Modules panel.</p>
          <p className="tp-actions">
            <a className="tp-btn tp-primary" href={BUILDER}>Open the ClearMark builder</a>
            <a className="tp-btn" href={CLEARMARK_CANVAS} target="_blank" rel="noopener noreferrer">Open the canvas</a>
          </p>
        </section>
      ) : (
        <>
          <div className="tp-bar">
            <p className="studio-hint">Mustard cover, charcoal inside, gold titles, red buttons, Barlow. From the &ldquo;Andrew K AI Work&rdquo; artifact and kreickmarketing.com/gigs.</p>
            <ul className="studio-tabs tp-sizes" aria-label="Screen size">
              {(Object.keys(SIZES) as Size[]).map((s) => (
                <li key={s}><Link href={href({ size: s })}><span aria-current={s === size ? "true" : undefined}>{SIZES[s][0]} {SIZES[s][1]}</span></Link></li>
              ))}
            </ul>
          </div>

          <section className="tp-group">
            <div className="tp-group-head">
              <h2>Page templates</h2>
              <a className="tp-btn tp-primary" href={`${BUILDER}?site=kreick&start=site`}>Start the Kreick site from all of them</a>
            </div>
            <ul className="tp-grid tp-pages">
              {KM_PAGES.map((p) => (
                <li key={p.id} className="tp-card">
                  <div className="tp-stack">
                    {p.sections.slice(0, 3).map(([uid, t]) => <Preview key={uid} id={t} uid={uid} size={size} maxH={200} />)}
                  </div>
                  <div className="studio-site-body">
                    <h3>{p.name}</h3>
                    <p>{p.about}</p>
                    <p className="studio-meta">{p.sections.length} sections · from {p.source}</p>
                    <p className="tp-actions"><a className="tp-btn tp-primary" href={`${BUILDER}?site=kreick&start=${p.id}`}>Start a page from this</a></p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {KM_GROUPS.map((g) => (
            <section key={g.id} className="tp-group">
              <div className="tp-group-head"><h2>{g.name}</h2></div>
              <ul className="tp-grid">
                {g.tpls.map((id) => {
                  const t = KM_TEMPLATES.find((x) => x.id === id)!;
                  return (
                    <li key={id} className="tp-card">
                      <Preview id={id} size={size} />
                      <div className="studio-site-body">
                        <h3>{t.name}</h3>
                        <p>{t.about}</p>
                        <p className="studio-meta"><span className="studio-code">{t.id}</span> · {t.slots.length} {t.slots.length === 1 ? "spot" : "spots"}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
          <p className="studio-hint">Add these to any Kreick page from the builder&apos;s Modules panel. <a href={`${BUILDER}?site=kreick`}>Open the Kreick builder</a> · <a href={KREICK_CANVAS} target="_blank" rel="noopener noreferrer">Design them on the canvas</a></p>
        </>
      )}
    </div>
  );
}
