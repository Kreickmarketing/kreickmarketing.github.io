import { NextResponse } from "next/server";
import { getCrmMember, getServerSupabase } from "@/lib/supabase-server";

// The Craft Library (supabase/craft-library.sql): designs and exports saved from the Craft apps.
// One POST per call, { action, ... }:
//   list         { kind?, app? }           → files, newest first, with 10-minute thumbnail links
//   upload-url   { kind, size, id? }       → one-time links to send the file (and a design's
//                                            thumbnail) straight to Supabase; `id` overwrites
//   commit       { id, kind, name, size, thumb?, path? } → records the upload in the list
//   download-url { id }                    → a 60-second link to the file
//   rename       { id, name }
//   delete       { id }                    → removes the file, its thumbnail and its row
// Only CRM members get past the check, and Row Level Security checks again in Supabase.
export const dynamic = "force-dynamic";

const BUCKET = "craft-library";
const MAX_FILE = 50 * 1024 * 1024; // the bucket's limit too
const THUMB_TTL = 600;
const DOWNLOAD_TTL = 60;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const APPS = ["figcraft", "designcraft", "photocraft", "filmcraft"];
const KINDS = ["design", "export"];
const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });
const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

type Row = { id: string; app: string; kind: string; name: string; storage_path: string; thumb_path: string | null; size: number; updated_at: string };

// Where a file lives: ids only, never names (names can identify clients).
function paths(kind: string, id: string) {
  return kind === "design"
    ? { file: `figcraft/${id}.figcraft`, thumb: `figcraft/${id}.thumb.png` }
    : { file: `exports/${new Date().toISOString().slice(0, 7)}/${id}.png`, thumb: null };
}

export async function POST(request: Request) {
  const member = await getCrmMember();
  if (!member) return fail("You're logged out. Log in again", 401);
  let b: Record<string, unknown>;
  try { b = await request.json(); } catch { return fail("That request isn't readable"); }
  const supabase = await getServerSupabase();
  const bucket = supabase.storage.from(BUCKET);
  const id = typeof b.id === "string" && UUID.test(b.id) ? b.id : null;
  const find = async (fileId: string) =>
    (await supabase.from("library_files").select("id, app, kind, name, storage_path, thumb_path, size, updated_at").eq("id", fileId).maybeSingle()).data as Row | null;

  try {
    switch (b.action) {
      case "list": {
        let query = supabase.from("library_files").select("id, app, kind, name, storage_path, thumb_path, size, updated_at")
          .eq("app", APPS.includes(String(b.app)) ? String(b.app) : "figcraft")
          .order("updated_at", { ascending: false }).limit(500);
        if (KINDS.includes(String(b.kind))) query = query.eq("kind", String(b.kind));
        const { data, error } = await query;
        if (error) return fail(error.message, 500);
        const rows = (data ?? []) as Row[];
        // Designs show their thumbnail; exports are pictures already.
        const shown = rows.map((r) => r.thumb_path ?? (r.kind === "export" ? r.storage_path : null));
        const wanted = shown.filter((p): p is string => !!p);
        const signed = wanted.length ? (await bucket.createSignedUrls(wanted, THUMB_TTL)).data ?? [] : [];
        const links = new Map(signed.map((s) => [s.path, s.signedUrl]));
        return NextResponse.json({
          ok: true,
          files: rows.map((r, i) => ({ id: r.id, kind: r.kind, name: r.name, size: r.size, updatedAt: r.updated_at, thumbUrl: (shown[i] && links.get(shown[i]!)) || null })),
        });
      }

      case "upload-url": {
        const kind = String(b.kind);
        if (!KINDS.includes(kind)) return fail("Unknown kind of file");
        const size = Number(b.size);
        if (!(size > 0 && size <= MAX_FILE)) return fail("Files can be up to 50 MB");
        // Saving over a file keeps its place; a new one gets a new id.
        const existing = id ? await find(id) : null;
        if (id && !existing) return fail("That file isn't in the Library any more", 404);
        const fileId = existing?.id ?? crypto.randomUUID();
        const p = existing ? { file: existing.storage_path, thumb: existing.thumb_path ?? paths(kind, fileId).thumb } : paths(kind, fileId);
        const file = await bucket.createSignedUploadUrl(p.file, { upsert: true });
        if (file.error || !file.data) return fail(file.error?.message || "Couldn't start the upload", 500);
        let thumb: { path: string; uploadUrl: string } | null = null;
        if (p.thumb) {
          const t = await bucket.createSignedUploadUrl(p.thumb, { upsert: true });
          if (t.error || !t.data) return fail(t.error?.message || "Couldn't start the upload", 500);
          thumb = { path: p.thumb, uploadUrl: t.data.signedUrl };
        }
        return NextResponse.json({ ok: true, id: fileId, file: { path: p.file, uploadUrl: file.data.signedUrl }, thumb });
      }

      case "commit": {
        if (!id) return fail("Which file?");
        const kind = String(b.kind);
        if (!KINDS.includes(kind)) return fail("Unknown kind of file");
        const name = text(b.name, 200);
        if (!name) return fail("Give the file a name");
        const existing = await find(id);
        const p = existing ? { file: existing.storage_path, thumb: existing.thumb_path ?? paths(kind, id).thumb } : paths(kind, id);
        // An export's folder is the month its upload started (the path upload-url gave back).
        if (!existing && kind === "export" && typeof b.path === "string" && new RegExp(`^exports/\\d{4}-\\d{2}/${id}\\.png$`).test(b.path)) p.file = b.path;
        // Only record a file that really arrived in Storage.
        const dir = p.file.slice(0, p.file.lastIndexOf("/"));
        const { data: listed } = await bucket.list(dir, { search: p.file.slice(dir.length + 1), limit: 1 });
        if (!listed?.length) return fail("The upload didn't arrive. Try again", 409);
        const row = {
          id, app: "figcraft", kind, name, storage_path: p.file,
          thumb_path: b.thumb === true ? p.thumb : existing?.thumb_path ?? null,
          size: Math.max(0, Math.round(Number(b.size) || 0)),
          updated_by: member.user.id,
        };
        const { error } = existing
          ? await supabase.from("library_files").update(row).eq("id", id)
          : await supabase.from("library_files").insert(row);
        if (error) return fail(error.message, 500);
        return NextResponse.json({ ok: true, id });
      }

      case "download-url": {
        if (!id) return fail("Which file?");
        const row = await find(id);
        if (!row) return fail("That file isn't in the Library any more", 404);
        const { data, error } = await bucket.createSignedUrl(row.storage_path, DOWNLOAD_TTL);
        if (error || !data) return fail(error?.message || "Couldn't open the file", 500);
        return NextResponse.json({ ok: true, url: data.signedUrl, name: row.name, kind: row.kind });
      }

      case "rename": {
        if (!id) return fail("Which file?");
        const name = text(b.name, 200);
        if (!name) return fail("Give the file a name");
        const { data, error } = await supabase.from("library_files").update({ name, updated_by: member.user.id }).eq("id", id).select("id");
        if (error) return fail(error.message, 500);
        if (!data?.length) return fail("That file isn't in the Library any more", 404);
        return NextResponse.json({ ok: true });
      }

      case "delete": {
        if (!id) return fail("Which file?");
        const row = await find(id);
        if (!row) return NextResponse.json({ ok: true });
        const { error: removeError } = await bucket.remove([row.storage_path, ...(row.thumb_path ? [row.thumb_path] : [])]);
        if (removeError) return fail(removeError.message, 500);
        const { error } = await supabase.from("library_files").delete().eq("id", id);
        if (error) return fail(error.message, 500);
        return NextResponse.json({ ok: true });
      }

      default:
        return fail("Unknown action");
    }
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Something went wrong", 500);
  }
}
