import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCrmMember } from "@/lib/supabase-server";
import FigcraftWorkspace from "./FigcraftWorkspace";
import "../create.css";

export const metadata: Metadata = {
  title: "FigCraft | ClearMark",
  robots: { index: false, follow: false },
};

// FigCraft full screen, with no team bar: its tab bar has a Clearmark button back to /apps/create,
// and its home screen shows the Craft Library (FigcraftWorkspace). ?file=<id> opens a Library file.
export default async function FigCraftPage({ searchParams }: { searchParams: Promise<{ file?: string }> }) {
  const member = await getCrmMember();
  if (!member) redirect("/apps/login?denied=1");
  const { file } = await searchParams;
  return <FigcraftWorkspace openFile={file} />;
}
