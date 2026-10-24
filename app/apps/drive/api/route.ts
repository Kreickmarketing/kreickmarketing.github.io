import { NextResponse } from "next/server";
import { getCrmMember, getServerSupabase } from "@/lib/supabase-server";
import { DRIVE_BUCKET, ITEM_COLUMNS, MAX_FILE, UUID, cleanName, objectLinks, previewOf, publicPath, type DriveItem } from "@/lib/drive";

// Clearmark Drive (lib/drive.ts, supabase/drive.sql). One POST per call, { action, ... }:
//   list          { folder? }                 → the folder, its path from the top, and what's in it
//   search        { q }                       → files and folders whose name matches, anywhere
//   create-folder { parent?, name }
//   upload-url    { parent?, name, type, size } → a one-time link to send the file straight to Supabase
//   commit        { id, path, parent?, name, type, size } → records the upload
//   download-url  { id, inline? }             → a 60-second link (inline: to show, not save)
//   public-link   { id }                      → the address anyone can open (website folders only)
//   rename        { id, name }
//   move          { ids, parent? }
//   delete        { ids }                     → folders with everything in them
// Only CRM members get past the check, and Row Level Security checks again in Supabase.
export const dynamic = "force-dynamic";

const PREVIEW_TTL = 600;
const DOWNLOAD_TTL = 60;
const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });
const uuid = (v: unknown) => (typeof v === "string" && UUID.test(v) ? v : null);

export async function POST(request: Request) {
  const member = await getCrmMember();
  if (!member) return fail("You're logged out. Log in again", 401);
  let b: Record<string, unknown>;
  try { b = await request.json(); } catch { return fail("That request isn't readable"); }
  const supabase = await getServerSupabase();
  const items = () => supabase.from("drive_items").select(ITEM_COLUMNS);
  const find = async (id: string) => ((await items().eq("id", id).maybeSingle()).data as DriveItem | null);
  // A folder to put things in: null is the top of Drive.
  const folderOrTop = async (v: unknown) => {
    if (v == null || v === "") return { ok: true as const, id: null };
    const id = uuid(v);
    const folder = id ? await find(id) : null;
    return folder?.kind === "folder" ? { ok: true as const, id: folder.id } : { ok: false as const, id: null };
  };
  // Cards and rows as the page shows them, with preview links.
  const shown = async (rows: DriveItem[]) => {
    const previews = rows.map(previewOf);
    const links = await objectLinks(supabase, previews.filter((p) => p !== null), PREVIEW_TTL);
    return rows.map((r, i) => ({
      id: r.id, parentId: r.parent_id, kind: r.kind, name: r.name, mime: r.mime, size: r.size,
      app: r.app, role: r.role, publicFolder: r.public_folder, updatedAt: r.updated_at,
      website: r.bucket === "studio-media",
      previewUrl: previews[i] ? links.get(`${previews[i]!.bucket}:${previews[i]!.path}`) ?? null : null,
    }));
  };

  try {
    switch (b.action) {
      case "list": {
        const folder = await folderOrTop(b.folder);
        if (!folder.ok) return fail("That folder isn't in Drive any more", 404);
        let query = items().order("kind", { ascending: false }).order("name").limit(2000);
        query = folder.id ? query.eq("parent_id", folder.id) : query.is("parent_id", null);
        const { data, error } = await query;
        if (error) return fail(error.message, 500);
        // The way down from the top, for the breadcrumb, and whether this folder is public.
        const trail = folder.id ? (((await supabase.rpc("drive_ancestors", { item: folder.id })).data ?? []) as DriveItem[]).reverse() : [];
        return NextResponse.json({
          ok: true,
          folder: folder.id,
          path: trail.map((f) => ({ id: f.id, name: f.name })),
          public: trail.some((f) => f.public_folder),
          items: await shown((data ?? []) as DriveItem[]),
        });
      }

      case "search": {
        const q = typeof b.q === "string" ? b.q.trim().slice(0, 100) : "";
        if (!q) return NextResponse.json({ ok: true, items: [] });
        const { data, error } = await items().ilike("name", `%${q.replace(/[%_\\]/g, "\\$&")}%`).order("kind", { ascending: false }).order("name").limit(200);
        if (error) return fail(error.message, 500);
        return NextResponse.json({ ok: true, items: await shown((data ?? []) as DriveItem[]) });
      }

      case "create-folder": {
        const parent = await folderOrTop(b.parent);
        if (!parent.ok) return fail("That folder isn't in Drive any more", 404);
        const name = cleanName(b.name);
        if (!name) return fail("Give the folder a name");
        const { data, error } = await supabase.from("drive_items").insert({ parent_id: parent.id, kind: "folder", name }).select("id").single();
        if (error) return fail(error.message, 500);
        return NextResponse.json({ ok: true, id: data.id });
      }

      case "upload-url": {
        const parent = await folderOrTop(b.parent);
        if (!parent.ok) return fail("That folder isn't in Drive any more", 404);
        if (!cleanName(b.name)) return fail("That file has no name");
        const size = Number(b.size);
        if (!(size >= 0 && size <= MAX_FILE)) return fail("Files can be up to 50 MB");
        // Stored under an id, never its name (names can identify clients).
        const id = crypto.randomUUID();
        const path = `${new Date().toISOString().slice(0, 7)}/${id}`;
        const { data, error } = await supabase.storage.from(DRIVE_BUCKET).createSignedUploadUrl(path);
        if (error || !data) return fail(error?.message || "Couldn't start the upload", 500);
        return NextResponse.json({ ok: true, id, path, uploadUrl: data.signedUrl });
      }

      case "commit": {
        const id = uuid(b.id);
        const path = typeof b.path === "string" ? b.path : "";
        if (!id || !new RegExp(`^\\d{4}-\\d{2}/${id}$`).test(path)) return fail("Which upload?");
        const parent = await folderOrTop(b.parent);
        if (!parent.ok) return fail("That folder isn't in Drive any more", 404);
        const name = cleanName(b.name);
        if (!name) return fail("That file has no name");
        // Only record a file that really arrived in Storage.
        const { data: listed } = await supabase.storage.from(DRIVE_BUCKET).list(path.slice(0, 7), { search: id, limit: 1 });
        if (!listed?.length) return fail("The upload didn't arrive. Try again", 409);
        const type = typeof b.type === "string" && b.type ? b.type.slice(0, 200) : "application/octet-stream";
        const figcraft = /\.figcraft$/i.test(name);
        const { error } = await supabase.from("drive_items").insert({
          id, parent_id: parent.id, kind: "file", name, mime: type,
          size: Math.max(0, Math.round(Number(b.size) || 0)), bucket: DRIVE_BUCKET, path,
          ...(figcraft ? { app: "figcraft", role: "design" } : {}),
          updated_by: member.user.id,
        });
        if (error) return fail(error.message, 500);
        return NextResponse.json({ ok: true, id });
      }

      case "download-url": {
        const id = uuid(b.id);
        const item = id ? await find(id) : null;
        if (!item || item.kind !== "file" || !item.bucket || !item.path) return fail("That file isn't in Drive any more", 404);
        if (item.bucket === "studio-media") {
          return NextResponse.json({ ok: true, name: item.name, url: supabase.storage.from(item.bucket).getPublicUrl(item.path).data.publicUrl });
        }
        const { data, error } = await supabase.storage.from(item.bucket).createSignedUrl(item.path, DOWNLOAD_TTL, b.inline ? undefined : { download: item.name });
        if (error || !data) return fail(error?.message || "Couldn't open the file", 500);
        return NextResponse.json({ ok: true, name: item.name, url: data.signedUrl });
      }

      case "public-link": {
        const id = uuid(b.id);
        if (!id) return fail("Which file?");
        const { data } = await supabase.rpc("drive_public_file", { item: id });
        const row = (data as { name: string }[] | null)?.[0];
        if (!row) return fail("Only files in a website's folder have a public link");
        return NextResponse.json({ ok: true, url: new URL(publicPath({ id, name: row.name }), request.url).toString() });
      }

      case "rename": {
        const id = uuid(b.id);
        const name = cleanName(b.name);
        if (!id) return fail("Which item?");
        if (!name) return fail("Give it a name");
        const { data, error } = await supabase.from("drive_items").update({ name, updated_by: member.user.id }).eq("id", id).select("id");
        if (error) return fail(error.message, 500);
        if (!data?.length) return fail("That isn't in Drive any more", 404);
        return NextResponse.json({ ok: true });
      }

      case "move": {
        const ids = Array.isArray(b.ids) ? b.ids.map(uuid).filter((v): v is string => !!v) : [];
        if (!ids.length) return fail("Nothing to move");
        const parent = await folderOrTop(b.parent);
        if (!parent.ok) return fail("That folder isn't in Drive any more", 404);
        for (const id of ids) {
          // A folder can't go inside itself or anything in it.
          if (parent.id) {
            const { data: inside } = await supabase.rpc("drive_descendants", { item: id });
            if (((inside ?? []) as DriveItem[]).some((d) => d.id === parent.id)) return fail("A folder can't go inside itself");
          }
          const { error } = await supabase.from("drive_items").update({ parent_id: parent.id, updated_by: member.user.id }).eq("id", id);
          if (error) return fail(error.message, 500);
        }
        return NextResponse.json({ ok: true });
      }

      case "delete": {
        const ids = Array.isArray(b.ids) ? b.ids.map(uuid).filter((v): v is string => !!v) : [];
        if (!ids.length) return fail("Nothing to delete");
        for (const id of ids) {
          const { data, error } = await supabase.rpc("drive_descendants", { item: id });
          if (error) return fail(error.message, 500);
          const all = (data ?? []) as DriveItem[];
          if (all.some((d) => d.bucket === "studio-media")) return fail("Used by a website. Remove it in Studio first");
          // The files' objects go first, then the rows (a folder takes everything in it with it).
          const objects = new Map<string, string[]>();
          for (const d of all) {
            if (!d.bucket || !d.path) continue;
            objects.set(d.bucket, [...(objects.get(d.bucket) ?? []), d.path, ...(d.thumb_path ? [d.thumb_path] : [])]);
          }
          for (const [bucket, paths] of objects) {
            const { error: removeError } = await supabase.storage.from(bucket).remove(paths);
            if (removeError) return fail(removeError.message, 500);
          }
          const { error: deleteError } = await supabase.from("drive_items").delete().eq("id", id);
          if (deleteError) return fail(deleteError.message, 500);
        }
        return NextResponse.json({ ok: true });
      }

      default:
        return fail("Unknown action");
    }
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Something went wrong", 500);
  }
}
