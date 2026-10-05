import "./section-header.css";

// The text block at the top of every section: a tagline on the left, and a
// light two-line headline with an optional paragraph on the right.
// Phone: everything stacks. `light` is for photos and dark backgrounds.
// Layout responds to the header's own width (container queries).

export default function SectionHeader({ tagline, title, body, light = false }: { tagline: string; title: string[]; body?: string; light?: boolean }) {
  return (
    <div className="sh-wrap">
      <header className={`sh${light ? " sh-light" : ""}`}>
        <p className="tagline sh-tagline">{tagline}</p>
        <div className="sh-main">
          <h2 className="as-h4 weight-light sh-title">{title.map((line) => <span key={line}>{line}</span>)}</h2>
          {body && <p className="sh-body">{body}</p>}
        </div>
      </header>
    </div>
  );
}
