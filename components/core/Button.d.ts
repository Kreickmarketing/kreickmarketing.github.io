export interface ButtonProps {
  /** @startingPoint section="Buttons" subtitle="Square-cornered CTA, set in Courier Prime" viewport="700x120" */
  /** Visual treatment. 'primary' is solid Midnight; 'outline'/'outline-inverse' are 1px borders (light/dark backgrounds); 'accent' is Orange Crush; 'ghost' is text-only. */
  variant?: 'primary' | 'outline' | 'outline-inverse' | 'accent' | 'ghost';
  /** Padding + font-size step. */
  size?: 'sm' | 'md' | 'lg';
  /** Set to 'arrow' to append the brand's trailing right-arrow glyph (seen on "Contact Us & Enroll Today ->"). */
  icon?: 'arrow';
  children: React.ReactNode;
  onClick?: () => void;
}
