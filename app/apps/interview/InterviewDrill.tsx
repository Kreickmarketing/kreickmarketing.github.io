"use client";

import { useEffect, useReducer, useState } from "react";
import { CHECK_PART1, CHECK_PART2, PROOFS, QUESTIONS, TERMS, TIPS, type Question } from "./content";

const PER = 60; // seconds per question
const N = QUESTIONS.length;
const TOTAL = N * PER;
const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

// Saved only in this browser, for small conveniences (last tab, ticked boxes).
const store = {
  get(k: string) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k: string, v: string) { try { localStorage.setItem(k, v); } catch { /* storage blocked */ } },
};

const icon = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;
const TABS = [
  { id: "drill", label: "Drill", icon: <svg {...icon}><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2 2M9 2h6" /></svg> },
  { id: "answers", label: "Answers", icon: <svg {...icon}><path d="M4 5h16v11H8l-4 4z" /></svg> },
  { id: "method", label: "Method", icon: <svg {...icon}><path d="M4 6h16M4 12h10M4 18h6" /></svg> },
  { id: "terms", label: "Terms", icon: <svg {...icon}><path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z" /><path d="M5 17a3 3 0 0 1 3-3h11" /></svg> },
  { id: "proof", label: "Proof", icon: <svg {...icon}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></svg> },
  { id: "day", label: "Test day", icon: <svg {...icon}><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M4 10h16M9 3v4M15 3v4M9 15l2 2 4-4" /></svg> },
] as const;
type Tab = (typeof TABS)[number]["id"];

// ── Drill state ──
type State = { i: number; tLeft: number; qLeft: number; running: boolean; paused: boolean; notes: string[]; cue: number };
type Action =
  | { type: "start" } | { type: "tick"; auto: boolean } | { type: "next" } | { type: "pause" }
  | { type: "reset" } | { type: "note"; text: string };

const initial: State = { i: -1, tLeft: TOTAL, qLeft: PER, running: false, paused: false, notes: Array(N).fill(""), cue: 0 };

function advance(s: State): State {
  if (s.i >= N - 1 || s.tLeft <= 0) return { ...s, i: N, running: false, paused: false };
  return { ...s, i: s.i + 1, qLeft: PER };
}

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case "start": return { ...initial, running: true, i: 0 };
    case "next": return advance({ ...s, paused: false });
    case "pause": return { ...s, paused: !s.paused };
    case "reset": return initial;
    case "note": return { ...s, notes: s.notes.map((n, k) => (k === s.i ? a.text : n)) };
    case "tick": {
      if (!s.running || s.paused) return s;
      const t = { ...s, tLeft: Math.max(0, s.tLeft - 1), qLeft: Math.max(0, s.qLeft - 1) };
      if (t.tLeft <= 0) return { ...t, i: N, running: false };
      if (t.qLeft === 0 && a.auto) return { ...advance(t), cue: t.cue + 1 };
      return t;
    }
  }
}

function speak(text: string) {
  try {
    if (!("speechSynthesis" in window)) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const vs = speechSynthesis.getVoices();
    const v = vs.find((v) => /en-(US|GB|CA)/.test(v.lang) && /Natural|Google|Samantha|Daniel/.test(v.name)) || vs.find((v) => v.lang.startsWith("en"));
    if (v) u.voice = v;
    speechSynthesis.speak(u);
  } catch { /* no speech on this device */ }
}

function beep() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const a = new Ctx(), o = a.createOscillator(), g = a.createGain();
    o.frequency.value = 660; g.gain.value = 0.08; o.connect(g); g.connect(a.destination); o.start(); o.stop(a.currentTime + 0.18);
  } catch { /* no audio */ }
}

function Answer({ x }: { x: Question }) {
  return (
    <>
      {x.read && <span className={`iv-read iv-read-${x.read}`}>{x.read === "broken" ? "Broken" : "Trade-off"}</span>}
      <dl className="iv-cphr">
        <dt>Concept</dt><dd className="iv-concept">{x.concept}</dd>
        <dt>Proof</dt><dd>{x.proof}</dd>
        <dt>How</dt><dd><ol>{x.how.map((h) => <li key={h}>{h}</li>)}</ol></dd>
        <dt>Result</dt><dd>{x.result}</dd>
      </dl>
      <div>
        <p className="iv-lbl">Say it</p>
        <p className="iv-say">{x.say}</p>
      </div>
    </>
  );
}

function Checklist({ id, items }: { id: string; items: string[] }) {
  const [ticked, setTicked] = useState<boolean[]>(() => items.map(() => false));
  useEffect(() => { setTicked(items.map((_, k) => store.get(`iv-${id}-${k}`) === "1")); }, [id, items]);
  return (
    <ul className="iv-check">
      {items.map((t, k) => (
        <li key={t}>
          <label>
            <input
              type="checkbox"
              checked={ticked[k]}
              onChange={(e) => {
                store.set(`iv-${id}-${k}`, e.target.checked ? "1" : "0");
                setTicked((prev) => prev.map((v, j) => (j === k ? e.target.checked : v)));
              }}
            />
            <span>{t}</span>
          </label>
        </li>
      ))}
    </ul>
  );
}

export default function InterviewDrill() {
  const [tab, setTab] = useState<Tab>("drill");
  const [s, dispatch] = useReducer(reducer, initial);
  const [auto, setAuto] = useState(false);
  const [openAll, setOpenAll] = useState<boolean | null>(null);
  const [filter, setFilter] = useState("");
  const [copied, setCopied] = useState("");

  // Open the tab from the address (#terms) or the last one used.
  useEffect(() => {
    const h = location.hash.slice(1);
    const saved = store.get("iv-tab");
    const pick = [h, saved].find((t) => TABS.some((x) => x.id === t));
    if (pick) setTab(pick as Tab);
  }, []);
  const choose = (t: Tab) => { setTab(t); store.set("iv-tab", t); history.replaceState(null, "", `#${t}`); };

  // One-second clock while the drill runs.
  useEffect(() => {
    if (!s.running) return;
    const id = setInterval(() => dispatch({ type: "tick", auto }), 1000);
    return () => clearInterval(id);
  }, [s.running, auto]);

  // Read each new question aloud; stop talking when the drill ends.
  useEffect(() => {
    if (s.i >= 0 && s.i < N) speak(QUESTIONS[s.i].q);
    else try { speechSynthesis.cancel(); } catch { /* none */ }
  }, [s.i]);
  useEffect(() => { try { if (s.paused) speechSynthesis.pause(); else speechSynthesis.resume(); } catch { /* none */ } }, [s.paused]);
  useEffect(() => { if (s.cue) beep(); }, [s.cue]);
  useEffect(() => () => { try { speechSynthesis.cancel(); } catch { /* none */ } }, []);

  const x = s.i >= 0 && s.i < N ? QUESTIONS[s.i] : null;
  const done = s.i >= N;
  const transcript = `INTERVIEW DRILL: my notes (time used ${fmt(TOTAL - s.tLeft)})\n\n` +
    QUESTIONS.map((q, k) => `${k + 1}. [${q.c}] ${q.q}\nMy answer: ${s.notes[k] || "(answered out loud, no notes)"}`).join("\n\n");

  const copy = () => {
    navigator.clipboard?.writeText(transcript).then(() => setCopied("Copied"), () => setCopied("Select the notes and copy them"));
    setTimeout(() => setCopied(""), 2000);
  };

  const needle = filter.trim().toLowerCase();

  return (
    <div className="iv">
      <nav className="crm-sections crm-tabs" aria-label="Interview drill sections">
        <ul>
          {TABS.map((t) => (
            <li key={t.id}>
              <a href={`#${t.id}`} aria-current={tab === t.id ? "true" : undefined} onClick={(e) => { e.preventDefault(); choose(t.id); }}>
                {t.icon}
                <span>{t.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <main className="crm-app">
        <div className="crm-page crm-page-wide iv-page">
          <div className="crm-page-head">
            <div>
              <h1>Interview drill</h1>
              <p className="crm-hint">Head of Design, AI-First · practice, answers, method and terms</p>
            </div>
            {tab === "drill" && (
              <div className="iv-clock" aria-live="off">
                <small>{s.paused ? "Paused" : "Total time left"}</small>
                <span>{fmt(s.tLeft)}</span>
              </div>
            )}
          </div>

          {tab === "drill" && (done ? (
            <section className="crm-panel">
              <p className="iv-q">Done. Here are your notes.</p>
              <pre className="iv-transcript">{transcript}</pre>
              <div className="iv-row">
                <button type="button" className="button button-action" onClick={copy}>Copy notes</button>
                <button type="button" className="button button-light" onClick={() => dispatch({ type: "reset" })}>Run it again</button>
                {copied && <span className="iv-toast" role="status">{copied}</span>}
              </div>
            </section>
          ) : (
            <div className="iv-grid">
              <section className="crm-panel">
                <div className="crm-card-top">
                  <span className="iv-chip">{x ? x.c : "Ready"}</span>
                  <span className="crm-code">{s.i + 1} of {N}</span>
                </div>
                <p className="iv-q">{x ? x.q : "Press Start. Each question is read aloud, then you have 60 seconds to answer out loud."}</p>
                <div>
                  <div className={`iv-bar${s.qLeft <= 15 ? " iv-bar-low" : ""}`}><i style={{ width: `${(s.qLeft / PER) * 100}%` }} /></div>
                  <span className="crm-code">{fmt(s.qLeft)} for this question</span>
                </div>
                {x && (
                  <details className="iv-mine" key={s.i}>
                    <summary>My answer</summary>
                    <div className="iv-body"><Answer x={x} /></div>
                  </details>
                )}
                <div className="field">
                  <label htmlFor="iv-notes" className="text-sm-semi-bold">Key points (optional)</label>
                  <textarea id="iv-notes" rows={4} disabled={!x} value={x ? s.notes[s.i] : ""} placeholder="Jot what you said, to review afterwards."
                    onChange={(e) => dispatch({ type: "note", text: e.target.value })} />
                </div>
                <div className="iv-row">
                  {!s.running ? (
                    <button type="button" className="button button-action" onClick={() => dispatch({ type: "start" })}>Start the drill</button>
                  ) : (
                    <>
                      <button type="button" className="button button-action" onClick={() => dispatch({ type: "next" })}>{s.i === N - 1 ? "Finish" : "Next question"}</button>
                      <button type="button" className="button button-light" aria-pressed={s.paused} onClick={() => dispatch({ type: "pause" })}>{s.paused ? "Resume" : "Pause"}</button>
                      <button type="button" className="button button-light" onClick={() => x && speak(x.q)}>Read again</button>
                      <button type="button" className="button button-light" onClick={() => dispatch({ type: "reset" })}>Restart</button>
                    </>
                  )}
                </div>
                <label className="iv-toggle"><input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} /> Move on automatically at 0:00</label>
              </section>
              <aside className="crm-panel iv-rail">
                <h2>Questions</h2>
                <ol>
                  {QUESTIONS.map((q, k) => (
                    <li key={k} className={k === s.i ? "now" : k < s.i ? "done" : ""} aria-label={`Question ${k + 1}, ${q.c}`}>
                      <b>{String(k + 1).padStart(2, "0")}</b><span>{q.c}</span>
                    </li>
                  ))}
                </ol>
              </aside>
            </div>
          ))}

          {tab === "answers" && (
            <>
              <div className="iv-row iv-spread">
                <p className="crm-hint">Every answer in the same shape: Concept, Proof, How, Result.</p>
                <div className="iv-row">
                  <button type="button" className="button button-light" onClick={() => setOpenAll(true)}>Open all</button>
                  <button type="button" className="button button-light" onClick={() => setOpenAll(false)}>Close all</button>
                </div>
              </div>
              {QUESTIONS.map((q, k) => (
                <details key={`${k}-${openAll}`} className="iv-mine iv-card-q" open={openAll ?? undefined}>
                  <summary><span><b>{String(k + 1).padStart(2, "0")}</b>{q.q}</span></summary>
                  <div className="iv-body"><Answer x={q} /></div>
                </details>
              ))}
            </>
          )}

          {tab === "method" && (
            <>
              <section className="crm-panel iv-dark">
                <p className="iv-lbl">The one concept</p>
                <p className="iv-big">Keep what works, fix what doesn&apos;t, and a person decides which is which.</p>
              </section>
              <section className="crm-panel">
                <h2>Answer in four steps, then stop</h2>
                <div className="iv-steps">
                  {[["Concept", "Answer the question in one line."], ["Proof", "One real number or example from your work."], ["How", "Two or three steps, no more."], ["Result", "What changed. Then stop talking."]].map(([h, p], k) => (
                    <div key={h} className="iv-step"><b>{k + 1}</b><h3>{h}</h3><p>{p}</p></div>
                  ))}
                </div>
              </section>
              <section className="crm-panel">
                <h2>First ask: broken or trade-off?</h2>
                <div className="iv-two">
                  <div className="iv-split iv-split-broken"><h3>Broken</h3><p>Nothing was gained. Roll it back and fix it.</p><p className="crm-hint">Checkout drop after an update. AI photos that misrepresent the product.</p></div>
                  <div className="iv-split iv-split-trade"><h3>Trade-off</h3><p>One number went up, another went down. Keep both, and let revenue per visitor decide.</p><p className="crm-hint">Upsell removed: more buyers, smaller orders.</p></div>
                </div>
                <p className="crm-hint">The tell: two numbers moving in opposite directions almost always means a trade-off.</p>
              </section>
              <section className="crm-panel">
                <h2>For AI and design questions</h2>
                <p><strong>AI does the volume, people make the calls.</strong> Name where a person decides: the brief, the direction, what ships.</p>
              </section>
              <section className="crm-panel">
                <h2>Tips</h2>
                <ul className="iv-tips">
                  {TIPS.map(([t, d]) => <li key={t}><strong>{t}</strong><span>{d}</span></li>)}
                </ul>
              </section>
            </>
          )}

          {tab === "terms" && (
            <section className="crm-panel">
              <div className="field">
                <label htmlFor="iv-search" className="text-sm-semi-bold">Search terms</label>
                <input id="iv-search" type="search" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Try AOV, LCP or guardrail" />
              </div>
              <div className="iv-terms">
                {TERMS.map(([group, list]) => {
                  const hits = list.filter(([t, d]) => !needle || t.toLowerCase().includes(needle) || d.toLowerCase().includes(needle));
                  if (!hits.length) return null;
                  return [
                    <p key={group} className="iv-group">{group}</p>,
                    ...hits.map(([t, d]) => <div key={t} className="iv-term"><b>{t}</b><span>{d}</span></div>),
                  ];
                })}
                {needle && TERMS.every(([, list]) => !list.some(([t, d]) => t.toLowerCase().includes(needle) || d.toLowerCase().includes(needle))) && (
                  <p className="crm-hint iv-group">No match. If it&apos;s not here, guess it out loud and read which way the numbers moved.</p>
                )}
              </div>
            </section>
          )}

          {tab === "proof" && (
            <>
              <p className="crm-hint">Your numbers. Use the same figure everywhere.</p>
              <div className="iv-proofs">
                {PROOFS.map(([n, d, hold]) => (
                  <div key={n} className={`iv-proof${hold ? " iv-proof-hold" : ""}`}><span>{n}</span><p>{d}</p></div>
                ))}
              </div>
            </>
          )}

          {tab === "day" && (
            <>
              <div className="iv-flag"><strong>Close this page before Part 1.</strong> Part 1 is proctored with screen sharing and no AI allowed. Take it on your own.</div>
              <section className="crm-panel">
                <h2>Part 1 · Online assessment · 27 minutes</h2>
                <Checklist id="p1" items={CHECK_PART1} />
              </section>
              <section className="crm-panel">
                <h2>Part 2 · Case study · 40 minutes</h2>
                <p className="crm-hint">AI is allowed. Not proctored, but timed. Ends with a one-page PDF or Word upload.</p>
                <Checklist id="p2" items={CHECK_PART2} />
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
