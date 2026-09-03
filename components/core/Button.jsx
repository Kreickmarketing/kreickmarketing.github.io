export function Button({ variant = 'primary', size = 'md', icon, children, ...rest }) {
  const base = {
    fontFamily: 'var(--font-button)',
    fontWeight: 700,
    borderRadius: '50px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '10px',
    cursor: 'pointer',
    border: '1px solid transparent',
    letterSpacing: 'var(--text-button-ls)',
    transition: 'background-color 120ms ease, color 120ms ease, border-color 120ms ease',
  };
  const sizes = {
    sm: { padding: '12px 22px', fontSize: 'var(--text-xs-size)' },
    md: { padding: '20px 30px', fontSize: 'var(--text-button-size)' },
    lg: { padding: '24px 36px', fontSize: 'var(--text-md-size)' },
  };
  const variants = {
    primary: {
      background: 'var(--midnight)',
      color: 'var(--color-text-inverse)',
      borderColor: 'var(--midnight)',
    },
    outline: {
      background: 'transparent',
      color: 'var(--midnight)',
      borderColor: 'var(--midnight)',
    },
    'outline-inverse': {
      background: 'transparent',
      color: 'var(--color-text-inverse)',
      borderColor: 'var(--color-text-inverse)',
    },
    accent: {
      background: 'var(--orange-crush)',
      color: 'var(--color-text-inverse)',
      borderColor: 'var(--orange-crush)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--midnight)',
      borderColor: 'transparent',
    },
  };
  const style = { ...base, ...sizes[size], ...variants[variant] };
  if (variant === 'ghost') { style.borderRadius = 0; style.padding = '4px 2px'; }
  return (
    <button style={style} {...rest}>
      {children}
      {icon === 'arrow' && <span aria-hidden="true">&rarr;</span>}
    </button>
  );
}
