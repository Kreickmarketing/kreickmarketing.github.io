import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { UUID } from "@/lib/drive";

// Public links to Drive files in a website's folder (lib/drive.ts publicPath): /files/<id>/<name>.
// No login: drive_public_file (supabase/drive.sql) answers only for files under a website folder,
// so everything else is a 404. Studio's own images go to their public address; Drive's are
// sent on through a short-lived link (the "Anyone reads public drive files" storage rule).
export const dynamic = "force-dynamic";

const LINK_TTL = 3600;

export async function GET(_request: Request, { params }: { params: Promise<{ id: string; name: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) return new NextResponse("Not found", { status: 404 });
  const supabase = getSupabase();
  const { data } = await supabase.rpc("drive_public_file", { item: id });
  const file = (data as { bucket: string; path: string }[] | null)?.[0];
  if (!file) return new NextResponse("Not found", { status: 404 });
  const storage = supabase.storage.from(file.bucket);
  const target = file.bucket === "studio-media"
    ? storage.getPublicUrl(file.path).data.publicUrl
    : (await storage.createSignedUrl(file.path, LINK_TTL)).data?.signedUrl;
  if (!target) return new NextResponse("Not found", { status: 404 });
  // Browsers and the CDN can reuse the answer for a while, inside the link's own lifetime.
  return NextResponse.redirect(target, { status: 302, headers: { "Cache-Control": "public, max-age=3000" } });
}
