import { ageLevel, daysSince } from "./data";

// Small pill showing how long a lead has sat in its current stage.
export default function StageAge({ since }: { since: string | null }) {
  const days = daysSince(since);
  const level = ageLevel(days);
  if (days === null || !level) return null;
  return <span className={`crm-age crm-age-${level}`}>{days === 1 ? "1 day" : `${days} days`}</span>;
}
