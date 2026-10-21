// The cards on /apps (Clearmark Apps), in order. Add a new app here.
// fullLoad: open with a full page load (plain <a>), for apps that aren't React pages
// in this project: the CRM (one HTML file) and Social Studio (its own Vercel project).
// thumbnail: optional picture (e.g. "/apps/crm.jpg" in public/); without one the card shows the first letter.
export type AppCard = { key: string; name: string; href: string; blurb: string; thumbnail?: string; status?: "coming"; fullLoad?: boolean };

export const APPS: AppCard[] = [
  { key: "studio", name: "Studio", href: "/apps/studio", blurb: "Website builder" },
  { key: "crm", name: "CRM", href: "/apps/crm", blurb: "People, deals and messages", fullLoad: true },
  { key: "playbook", name: "Playbook", href: "/apps/playbook", blurb: "ClearMark brand playbook" },
  { key: "interview", name: "Interview", href: "/apps/interview", blurb: "Interview drill" },
  // Until the products are moved into the CRM by hand; then remove this card.
  { key: "products", name: "Products", href: "/apps/crm/products", blurb: "Price list" },
  { key: "socialstudio", name: "Social Studio", href: "/apps/socialstudio", blurb: "Social posts and calendar", status: "coming", fullLoad: true },
];
