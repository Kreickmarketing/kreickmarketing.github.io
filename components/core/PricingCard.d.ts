export interface PricingCardProps {
  /** @startingPoint section="Cards" subtitle="Tiered pricing card, orange border when highlighted" viewport="700x220" */
  /** Small eyebrow above the tier name, e.g. "Up to 5,000 employees". */
  tierLabel: string;
  /** Bold display-font tier name, e.g. "Enterprise". */
  tierName: string;
  /** Short (1-2 sentence) description of what's included. */
  description: string;
  /** Formatted price string, e.g. "$35,000". */
  price: string;
  /** Applies the 2px orange border used to call out the recommended tier (seen on "Enterprise"). */
  highlighted?: boolean;
}
