export interface NavBarProps {
  /** @startingPoint section="Layout" subtitle="Site header with pill CTAs" viewport="1200x100" */
  /** Path to the wordmark logo image (white variant for use over dark/photo backgrounds). */
  logoSrc?: string;
  /** Nav link labels, e.g. ["About","Solutions","Platforms","Why","The Engine","Pricing"]. */
  links?: string[];
  ctaLabel?: string;
  loginLabel?: string;
  /** Use over photography (transparent bg, white text/borders) as on the hero. */
  inverse?: boolean;
}
