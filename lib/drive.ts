import type { SupabaseClient } from "@supabase/supabase-js";

// Clearmark Drive (supabase/drive.sql): one tree of folders and files every app under /apps reads.
// A file row points at its object where it already is: new uploads in the private "drive" bucket,
// FigCraft's older files in "craft-library", and Studio's website images in the public
// "studio-media" bucket (never moved or deleted by Drive: live pages use their URLs).

export const DRIVE_BUCKET = "drive";
export const MAX_FILE = 50 * 1024 * 1024; // the buckets' limit (Supabase free plan)
export const ITEM_COLUMNS = "id, parent_id, kind, name, mime, size, bucket, path, thumb_path, app, role, public_folder, created_at, updated_at";

export type DriveItem = {
  id: string;
  parent_id: string | null;
  kind: "folder" | "file";
  name: string;
  mime: string | null;
  size: number;
  bucket: "drive" | "craft-library" | "studio-media" | null;
  path: string | null;
  thumb_path: string | null;
  app: string | null;
  role: string | null;
  public_folder: boolean;
  created_at: string;
  updated_at: string;
};

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// A name a folder or file can have: trimmed, no slashes, 1–255 characters.
export function cleanName(v: unknown) {
  const name = typeof v === "string" ? v.replace(/[\\/]/g, "-").trim().slice(0, 255) : "";
  return name || null;
}

// The id of the folder at "a/b/c" from the top (null when any part is missing).
export async function folderByPath(supabase: SupabaseClient, path: string) {
  let parent: string | null = null;
  for (const name of path.split("/").filter(Boolean)) {
    let query = supabase.from("drive_items").select("id").eq("kind", "folder").eq("name", name).limit(1);
    query = parent ? query.eq("parent_id", parent) : query.is("parent_id", null);
    const { data } = await query;
    parent = (data?.[0]?.id as string | undefined) ?? null;
    if (!parent) return null;
  }
  return parent;
}

// The folder at "a/b/c", made (with any missing parents) if it isn't there.
export async function ensureFolder(supabase: SupabaseClient, path: string) {
  let parent: string | null = null;
  for (const name of path.split("/").filter(Boolean)) {
    let query = supabase.from("drive_items").select("id").eq("kind", "folder").eq("name", name).limit(1);
    query = parent ? query.eq("parent_id", parent) : query.is("parent_id", null);
    const { data } = await query;
    let id = (data?.[0]?.id as string | undefined) ?? null;
    if (!id) {
      const made = await supabase.from("drive_items").insert({ parent_id: parent, kind: "folder", name }).select("id").single();
      if (made.error) throw new Error(made.error.message);
      id = made.data.id as string;
    }
    parent = id;
  }
  return parent;
}

// Short-lived links to objects, by "bucket:path" (Studio's public images: their public URL).
export async function objectLinks(supabase: SupabaseClient, objects: { bucket: string; path: string }[], seconds: number) {
  const links = new Map<string, string>();
  const byBucket = new Map<string, string[]>();
  for (const o of objects) {
    if (o.bucket === "studio-media") links.set(`${o.bucket}:${o.path}`, supabase.storage.from(o.bucket).getPublicUrl(o.path).data.publicUrl);
    else byBucket.set(o.bucket, [...(byBucket.get(o.bucket) ?? []), o.path]);
  }
  for (const [bucket, paths] of byBucket) {
    const { data } = await supabase.storage.from(bucket).createSignedUrls([...new Set(paths)], seconds);
    for (const s of data ?? []) if (s.signedUrl && s.path) links.set(`${bucket}:${s.path}`, s.signedUrl);
  }
  return links;
}

// The picture a card shows: an image file itself, or a design's thumbnail.
export function previewOf(item: DriveItem) {
  if (item.kind !== "file" || !item.bucket || !item.path) return null;
  if (item.thumb_path) return { bucket: item.bucket, path: item.thumb_path };
  if (item.mime?.startsWith("image/")) return { bucket: item.bucket, path: item.path };
  return null;
}

// The address anyone can open for a file in a website folder (app/files/[id]/[name]).
export function publicPath(item: { id: string; name: string }) {
  return `/files/${item.id}/${encodeURIComponent(item.name)}`;
}
