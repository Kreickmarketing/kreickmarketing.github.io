export function PricingCard({ tierLabel, tierName, description, price, highlighted = false }) {
  return (
    <div
      style={{
        fontFamily: 'var(--font-body)',
        border: highlighted
          ? '1px solid var(--orange-crush)'
          : '1px solid var(--color-border-default)',
        borderRadius: 0,
        padding: 'var(--space-5)',
        minWidth: '220px',
        background: 'var(--color-surface-card)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)',
      }}
    >
      <span style={{ fontSize: 'var(--text-xs-size)', fontWeight: 700, letterSpacing: '-1px', color: 'var(--color-text-heading)' }}>
        {tierLabel}
      </span>
      <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-h6-size)', letterSpacing: 'var(--text-h6-ls)', margin: 0, color: 'var(--color-text-heading)' }}>
        {tierName}
      </h3>
      <p style={{ fontSize: 'var(--text-sm-size)', lineHeight: 'var(--text-sm-lh)', letterSpacing: '-1px', color: 'var(--color-text-body)', margin: 0, minHeight: '54px' }}>
        {description}
      </p>
      <hr style={{ border: 'none', borderTop: '1px solid var(--color-border-default)', margin: 'var(--space-3) 0' }} />
      <strong style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-h6-size)', letterSpacing: 'var(--text-h6-ls)', color: 'var(--color-text-heading)' }}>
        {price}
      </strong>
    </div>
  );
}
