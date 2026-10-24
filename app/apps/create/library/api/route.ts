import { NextResponse } from "next/server";
import { getCrmMember, getServerSupabase } from "@/lib/supabase-server";
import { DRIVE_BUCKET, ITEM_COLUMNS, MAX_FILE, UUID, ensureFolder, folderByPath, objectLinks, type DriveItem } from "@/lib/drive";

// FigCraft's Library, kept in Drive (lib/drive.ts): designs are the .figcraft files in the
// "figcraft" folder, exports the pictures in "figcraft/Exports". Files dropped there in Drive show
// up too. One POST per call, { action, ... } (FigcraftWorkspace.tsx):
//   list         { kind? }                    → files, newest first, with 10-minute picture links
//   upload-url   { kind, size, id? }          → one-time links to send the file (and a design's
//                                               thumbnail) straight to Supabase; `id` overwrites
//   commit       { id, kind, name, size, thumb?, path? } → records the upload in Drive
//   download-url { id }                       → a 60-second link to the file
//   rename       { id, name }
//   delete       { id }
// Only CRM members get past the check, and Row Level Security checks again in Supabase.
export const dynamic = "force-dynamic";

const FOLDERS = { design: "figcraft", export: "figcraft/Exports" } as const;
const EXT = { design: ".figcraft", export: ".png" } as const;
const THUMB_TTL = 600;
const DOWNLOAD_TTL = 60;
const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });
const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
type Kind = keyof typeof FOLDERS;
const kindOf = (v: unknown): Kind | null => (v === "design" || v === "export" ? v : null);
// The name FigCraft shows: the Drive name without its extension.
const shown = (name: string) => name.replace(/\.(figcraft|png)$/i, "");

// Where a new file goes in the drive bucket (ids only, never names: names can identify clients).
function newPaths(kind: Kind, id: string) {
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
  const id = typeof b.id === "string" && UUID.test(b.id) ? b.id : null;
  const find = async (fileId: string) =>
    (await supabase.from("drive_items").select(ITEM_COLUMNS).eq("id", fileId).eq("kind", "file").maybeSingle()).data as DriveItem | null;

  try {
    switch (b.action) {
      case "list": {
        const kinds: Kind[] = kindOf(b.kind) ? [kindOf(b.kind)!] : ["design", "export"];
        const rows: DriveItem[] = [];
        for (const kind of kinds) {
          const folder = await folderByPath(supabase, FOLDERS[kind]);
          if (!folder) continue;
          const { data, error } = await supabase.from("drive_items").select(ITEM_COLUMNS)
            .eq("parent_id", folder).eq("kind", "file").order("updated_at", { ascending: false }).limit(500);
          if (error) return fail(error.message, 500);
          rows.push(...((data ?? []) as DriveItem[]).filter((r) => (kind === "design" ? /\.figcraft$/i.test(r.name) : r.mime?.startsWith("image/"))));
        }
        // Designs show their thumbnail; exports are pictures already.
        const pics = rows.map((r) => (r.bucket && (r.thumb_path || r.mime?.startsWith("image/")) ? { bucket: r.bucket, path: r.thumb_path ?? r.path! } : null));
        const links = await objectLinks(supabase, pics.filter((p) => p !== null), THUMB_TTL);
        return NextResponse.json({
          ok: true,
          files: rows.map((r, i) => ({
            id: r.id, kind: r.role === "export" || r.mime?.startsWith("image/") ? "export" : "design", name: shown(r.name), size: r.size,
            updatedAt: r.updated_at, thumbUrl: pics[i] ? links.get(`${pics[i]!.bucket}:${pics[i]!.path}`) ?? null : null,
          })),
        });
      }

      case "upload-url": {
        const kind = kindOf(b.kind);
        if (!kind) return fail("Unknown kind of file");
        const size = Number(b.size);
        if (!(size > 0 && size <= MAX_FILE)) return fail("Files can be up to 50 MB");
        // Saving over a file keeps it where it is; a new one gets a new id.
        const existing = id ? await find(id) : null;
        if (id && !existing) return fail("That file isn't in Drive any more", 404);
        if (existing?.bucket === "studio-media") return fail("That file belongs to a website");
        const fileId = existing?.id ?? crypto.randomUUID();
        const bucket = existing?.bucket ?? DRIVE_BUCKET;
        const fresh = newPaths(kind, fileId);
        const p = existing
          ? { file: existing.path!, thumb: kind === "design" ? existing.thumb_path ?? `${existing.path!.replace(/\.figcraft$/, "")}.thumb.png` : null }
          : fresh;
        const storage = supabase.storage.from(bucket);
        const file = await storage.createSignedUploadUrl(p.file, { upsert: true });
        if (file.error || !file.data) return fail(file.error?.message || "Couldn't start the upload", 500);
        let thumb: { path: string; uploadUrl: string } | null = null;
        if (p.thumb) {
          const t = await storage.createSignedUploadUrl(p.thumb, { upsert: true });
          if (t.error || !t.data) return fail(t.error?.message || "Couldn't start the upload", 500);
          thumb = { path: p.thumb, uploadUrl: t.data.signedUrl };
        }
        return NextResponse.json({ ok: true, id: fileId, file: { path: p.file, uploadUrl: file.data.signedUrl }, thumb });
      }

      case "commit": {
        if (!id) return fail("Which file?");
        const kind = kindOf(b.kind);
        if (!kind) return fail("Unknown kind of file");
        const base = text(b.name, 200).replace(/[\\/]/g, "-");
        if (!base) return fail("Give the file a name");
        const existing = await find(id);
        const bucket = existing?.bucket ?? DRIVE_BUCKET;
        let path = existing?.path ?? newPaths(kind, id).file;
        // A new export's folder is the month its upload started (the path upload-url gave back).
        if (!existing && kind === "export" && typeof b.path === "string" && new RegExp(`^exports/\\d{4}-\\d{2}/${id}\\.png$`).test(b.path)) path = b.path;
        // Only record a file that really arrived in Storage.
        const dir = path.slice(0, path.lastIndexOf("/"));
        const { data: listed } = await supabase.storage.from(bucket).list(dir, { search: path.slice(dir.length + 1), limit: 1 });
        if (!listed?.length) return fail("The upload didn't arrive. Try again", 409);
        const thumbPath = kind === "design" && b.thumb === true
          ? existing?.thumb_path ?? `${path.replace(/\.figcraft$/, "")}.thumb.png`
          : existing?.thumb_path ?? null;
        const row = {
          name: base + EXT[kind], size: Math.max(0, Math.round(Number(b.size) || 0)), thumb_path: thumbPath,
          mime: kind === "design" ? "application/octet-stream" : "image/png", app: "figcraft", role: kind, updated_by: member.user.id,
        };
        if (existing) {
          const { error } = await supabase.from("drive_items").update(row).eq("id", id);
          if (error) return fail(error.message, 500);
        } else {
          const parent = await ensureFolder(supabase, FOLDERS[kind]);
          const { error } = await supabase.from("drive_items").insert({ id, parent_id: parent, kind: "file", bucket, path, ...row });
          if (error) return fail(error.message, 500);
        }
        return NextResponse.json({ ok: true, id });
      }

      case "download-url": {
        if (!id) return fail("Which file?");
        const item = await find(id);
        if (!item?.bucket || !item.path) return fail("That file isn't in Drive any more", 404);
        const { data, error } = item.bucket === "studio-media"
          ? { data: { signedUrl: supabase.storage.from(item.bucket).getPublicUrl(item.path).data.publicUrl }, error: null }
          : await supabase.storage.from(item.bucket).createSignedUrl(item.path, DOWNLOAD_TTL);
        if (error || !data) return fail(error?.message || "Couldn't open the file", 500);
        return NextResponse.json({ ok: true, url: data.signedUrl, name: shown(item.name), kind: item.role ?? "design" });
      }

      case "rename": {
        if (!id) return fail("Which file?");
        const item = await find(id);
        const name = text(b.name, 200);
        if (!item) return fail("That file isn't in Drive any more", 404);
        if (!name) return fail("Give the file a name");
        const ext = item.name.match(/\.(figcraft|png)$/i)?.[0] ?? "";
        const { error } = await supabase.from("drive_items").update({ name: name + ext, updated_by: member.user.id }).eq("id", id);
        if (error) return fail(error.message, 500);
        return NextResponse.json({ ok: true });
      }

      case "delete": {
        if (!id) return fail("Which file?");
        const item = await find(id);
        if (!item) return NextResponse.json({ ok: true });
        if (item.bucket === "studio-media") return fail("Used by a website. Remove it in Studio first");
        const { error: removeError } = await supabase.storage.from(item.bucket!).remove([item.path!, ...(item.thumb_path ? [item.thumb_path] : [])]);
        if (removeError) return fail(removeError.message, 500);
        const { error } = await supabase.from("drive_items").delete().eq("id", id);
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
