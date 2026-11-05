// The Craft apps on /apps/create, in order. Each one's web build lives in
// public/apps/create/<key>/app/ and opens at /apps/create/<key>.
// Open-source editors from github.com/storytold (MIT or Apache-2.0).
export type CraftApp = { key: string; name: string; blurb: string; status?: "coming" };

export const CRAFT_APPS: CraftApp[] = [
  { key: "figcraft", name: "FigCraft", blurb: "Interface design and prototyping" },
  { key: "designcraft", name: "DesignCraft", blurb: "Page and layout design", status: "coming" },
  { key: "photocraft", name: "PhotoCraft", blurb: "Photo editing", status: "coming" },
  { key: "filmcraft", name: "FilmCraft", blurb: "Video editing", status: "coming" },
];
