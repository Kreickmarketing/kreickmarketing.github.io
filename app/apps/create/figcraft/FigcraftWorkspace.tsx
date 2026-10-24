"use client";

import { useCallback, useEffect, useRef } from "react";

// FigCraft full screen, with the Craft Library behind it. FigCraft (our fork, see
// public/apps/create/figcraft/app/VERSION.txt) shows the Library on its home screen and sends its
// saves here; this component does the Library calls (app/apps/create/library/api) and passes files
// back and forth through FigCraft's message bridge (figcraft:request / reply / event).

const API = "/apps/create/library/api";
const APP = "/apps/create/figcraft/app/index.html";

type LibraryFile = { id: string; name: string; updatedAt: string; thumbUrl: string | null };
type Message = { type?: string; id?: number; ok?: boolean; error?: string; event?: string; [key: string]: unknown };

async function library(body: Record<string, unknown>) {
  const res = await fetch(API, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), redirect: "manual" });
  if (res.type === "opaqueredirect" || res.status === 401) throw new Error("You're logged out. Log in again");
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || "The Library didn't answer");
  return json;
}

// Send a file straight to Supabase with a one-time upload link (as Studio does).
async function upload(url: string, bytes: Uint8Array, type: string) {
  const form = new FormData();
  form.append("cacheControl", "3600");
  form.append("", new Blob([bytes as BlobPart], { type }));
  const res = await fetch(url, { method: "PUT", body: form, headers: { "x-upsert": "true" } });
  if (!res.ok) throw new Error("The upload didn't go through");
}

const ago = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
function edited(iso: string) {
  const minutes = Math.round((Date.parse(iso) - Date.now()) / 60000);
  if (Math.abs(minutes) < 60) return `Edited ${ago.format(minutes, "minute")}`;
  if (Math.abs(minutes) < 60 * 24) return `Edited ${ago.format(Math.round(minutes / 60), "hour")}`;
  return `Edited ${ago.format(Math.round(minutes / 1440), "day")}`;
}

export default function FigcraftWorkspace({ openFile }: { openFile?: string }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const pending = useRef(new Map<number, (m: Message) => void>());
  const next = useRef(0);

  const request = useCallback((action: string, extra: Record<string, unknown> = {}) => {
    const id = ++next.current;
    return new Promise<Message>((resolve) => {
      pending.current.set(id, resolve);
      frame.current?.contentWindow?.postMessage({ ...extra, type: "figcraft:request", id, action }, location.origin);
    });
  }, []);
  const toast = useCallback((text: string) => request("toast", { text }), [request]);

  // The Library's designs, with their pictures, onto FigCraft's home screen.
  const refresh = useCallback(async () => {
    try {
      const { files } = (await library({ action: "list", kind: "design" })) as { files: LibraryFile[] };
      const withThumbs = await Promise.all(files.map(async (f) => {
        const thumb = f.thumbUrl ? await fetch(f.thumbUrl).then((r) => (r.ok ? r.arrayBuffer() : null)).catch(() => null) : null;
        return { id: f.id, name: f.name, detail: edited(f.updatedAt), thumb: thumb ? new Uint8Array(thumb) : null };
      }));
      await request("setLibrary", { title: "Clearmark Library", files: withThumbs });
    } catch (e) {
      toast(e instanceof Error ? e.message : "Couldn't load the Library");
    }
  }, [request, toast]);

  const open = useCallback(async (id: string) => {
    try {
      const { url, name } = await library({ action: "download-url", id });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Couldn't download the file");
      const reply = await request("open", { name: `${name}.figcraft`, bytes: new Uint8Array(await res.arrayBuffer()), libraryId: id });
      if (!reply.ok) throw new Error(reply.error || "FigCraft couldn't open the file");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Couldn't open the file");
    }
  }, [request, toast]);

  const save = useCallback(async (m: Message) => {
    const bytes = m.bytes as Uint8Array, thumbnail = m.thumbnail as Uint8Array | null;
    try {
      const start = await library({ action: "upload-url", kind: "design", size: bytes.length, ...(m.id ? { id: m.id } : {}) });
      await upload(start.file.uploadUrl, bytes, "application/octet-stream");
      if (thumbnail && start.thumb) await upload(start.thumb.uploadUrl, thumbnail, "image/png");
      await library({ action: "commit", id: start.id, kind: "design", name: String(m.name || "Untitled"), size: bytes.length, thumb: !!(thumbnail && start.thumb) });
      await request("saved", { uid: m.uid, libraryId: start.id });
      refresh();
    } catch (e) {
      request("saveFailed", { uid: m.uid, error: e instanceof Error ? e.message : "Couldn't save to the Library" });
    }
  }, [request, refresh]);

  useEffect(() => {
    let opened = false;
    const onMessage = (e: MessageEvent<Message>) => {
      if (e.origin !== location.origin || e.source !== frame.current?.contentWindow) return;
      const m = e.data;
      if (m.type === "figcraft:reply" && typeof m.id === "number") {
        pending.current.get(m.id)?.(m);
        pending.current.delete(m.id);
      } else if (m.type === "figcraft:ready") {
        refresh().then(() => {
          // /apps/create/figcraft?file=<id> opens that file once the Library is in.
          if (openFile && !opened) {
            opened = true;
            open(openFile);
          }
        });
      } else if (m.type === "figcraft:event") {
        if (m.event === "open" && typeof m.id === "string") open(m.id);
        else if (m.event === "save") save(m);
        else if (m.event === "refresh") refresh();
        else if (m.event === "leave") location.href = "/apps/create";
      }
    };
    addEventListener("message", onMessage);
    return () => removeEventListener("message", onMessage);
  }, [refresh, open, save, openFile]);

  return (
    <iframe
      ref={frame}
      src={APP}
      title="FigCraft interface design tool"
      className="craft-frame craft-frame-full"
      allow="fullscreen; clipboard-read; clipboard-write"
      allowFullScreen
    />
  );
}
