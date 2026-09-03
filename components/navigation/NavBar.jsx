export function NavBar({ links = [], ctaLabel, loginLabel = 'Login', inverse = false, logoSrc = './assets/logo-white.png' }) {
  const color = inverse ? 'var(--color-text-inverse)' : 'var(--midnight)';
  return (
    <nav
      style={{
        fontFamily: 'var(--font-body)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 'var(--space-4) var(--space-6)',
      }}
    >
      <img src={logoSrc} alt="Clearmark" style={{ height: '32px' }} />
      <div style={{ display: 'flex', gap: 'var(--space-5)', color, fontSize: 'var(--text-sm-size)', letterSpacing: '-1px' }}>
        {links.map((l) => (
          <span key={l}>{l}</span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
        {ctaLabel && (
          <button
            style={{
              fontFamily: 'var(--font-button)',
              fontWeight: 700,
              borderRadius: '50px',
              padding: '20px 30px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              background: 'transparent',
              color,
              border: `1px solid ${color}`,
              letterSpacing: 'var(--text-button-ls)',
            }}
          >
            {ctaLabel} &rarr;
          </button>
        )}
        <button
          style={{
            fontFamily: 'var(--font-button)',
            fontWeight: 700,
            borderRadius: '50px',
            padding: '20px 30px',
            background: 'transparent',
            color,
            border: `1px solid ${color}`,
            letterSpacing: 'var(--text-button-ls)',
          }}
        >
          {loginLabel}
        </button>
      </div>
    </nav>
  );
}
