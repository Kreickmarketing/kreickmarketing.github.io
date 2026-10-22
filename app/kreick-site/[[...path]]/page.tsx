import type { Metadata } from "next";
import { notFound } from "next/navigation";
import KmSitePage from "@/components/KmSitePage";
import { getBuilderPage } from "@/lib/builder-public";

// The Kreick Marketing site: every page published in Studio (?site=kreick), Home included.
// Visitors never see this folder's name: next.config.ts sends the Kreick addresses here
// (new.kreickmarketing.com, later kreickmarketing.com) and hides it everywhere else.
// Refreshed on every Publish, and at least every 5 minutes.
export const revalidate = 300;

type Props = { params: Promise<{ path?: string[] }> };
const find = async ({ params }: Props) => getBuilderPage("kreick", { path: "/" + ((await params).path ?? []).join("/") });

export async function generateMetadata(props: Props): Promise<Metadata> {
  const home = !(await props.params).path?.length, studio = home ? null : await find(props);
  return { title: studio ? `${studio.name} | Kreick Marketing` : "Kreick Marketing", description: "Kreick Marketing" };
}

export default async function KreickPage(props: Props) {
  const studio = await find(props);
  if (!studio) notFound();
  return <main><KmSitePage page={studio.page} /></main>;
}
