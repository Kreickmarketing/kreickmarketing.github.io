export function Footer({ tagline, email, address, links = [], logoSrc = './assets/logo-white.png' }) {
  return (
    <footer
      style={{
        fontFamily: 'var(--font-body)',
        background: 'var(--color-surface-dark)',
        color: 'var(--color-text-inverse)',
        padding: 'var(--space-7) var(--space-8)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-5)' }}>
        <div>
          <img src={logoSrc} alt="Clearmark" style={{ width: '112px', height: '28px', display: 'block' }} />
          {tagline && <p style={{ marginTop: 'var(--space-3)', fontSize: 'var(--text-sm-size)', letterSpacing: '-1px' }}>{tagline}</p>}
        </div>
        <div style={{ fontSize: 'var(--text-sm-size)', lineHeight: 'var(--text-sm-lh)', letterSpacing: '-1px' }}>
          {email && <div>Email: {email}</div>}
          {address && <div>Address: {address}</div>}
        </div>
      </div>
      <hr style={{ border: 'none', borderTop: '1px solid var(--iron-pine)', margin: 'var(--space-6) 0' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm-size)', letterSpacing: '-1px', color: 'var(--dusty-sage)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <span>Copyright &copy; {new Date().getFullYear()} Clearmark. All rights reserved.</span>
        <div style={{ display: 'flex', gap: 'var(--space-5)' }}>
          {links.map((l) => (
            <span key={l}>{l}</span>
          ))}
        </div>
      </div>
    </footer>
  );
}
