"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// Clearmark Drive in the browser: folders and files (Drive API, app/apps/drive/api), as cards or a
// list, with drag-and-drop and multi-file upload straight to Supabase (one-time links, as Studio).

const API = "/apps/drive/api";
const MAX_FILE = 50 * 1024 * 1024;
const PARALLEL = 3;

type Item = {
  id: string; parentId: string | null; kind: "folder" | "file"; name: string; mime: string | null; size: number;
  app: string | null; role: string | null; publicFolder: boolean; updatedAt: string; website: boolean; previewUrl: string | null;
};
type Crumb = { id: string; name: string };
type Upload = { key: number; name: string; size: number; progress: number; state: "waiting" | "sending" | "done" | "failed" | "cancelled"; error?: string; xhr?: XMLHttpRequest };

async function call<T = Record<string, unknown>>(action: string, body: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch(API, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action, ...body }), redirect: "manual" });
  if (res.type === "opaqueredirect" || res.status === 401) throw new Error("You're logged out. Log in again");
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || "Drive didn't answer");
  return json as T;
}

const ago = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
function edited(iso: string) {
  const minutes = Math.round((Date.parse(iso) - Date.now()) / 60000);
  if (Math.abs(minutes) < 60) return ago.format(minutes, "minute");
  if (Math.abs(minutes) < 60 * 24) return ago.format(Math.round(minutes / 60), "hour");
  if (Math.abs(minutes) < 60 * 24 * 30) return ago.format(Math.round(minutes / 1440), "day");
  return new Date(iso).toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" });
}
function bytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / 1024 / 1024).toFixed(n < 10 * 1024 * 1024 ? 1 : 0)} MB`;
}
const isDesign = (i: Item) => i.app === "figcraft" && i.role !== "export" || /\.figcraft$/i.test(i.name);
const canPreview = (i: Item) => !!i.mime && (i.mime.startsWith("image/") || i.mime.startsWith("video/") || i.mime === "application/pdf");

// A small label for files without a picture.
function typeLabel(i: Item) {
  if (i.kind === "folder") return "";
  if (isDesign(i)) return "FIG";
  const ext = i.name.includes(".") ? i.name.split(".").pop()! : "";
  return ext.slice(0, 4).toUpperCase() || "FILE";
}

function FolderIcon({ open }: { open?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="drive-folder-icon">
      <path d={open ? "M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v1H7l-4 8z" : "M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"} fill="currentColor" />
    </svg>
  );
}

export default function DriveApp({ initialFolder }: { initialFolder: string | null }) {
  const [folder, setFolder] = useState<string | null>(initialFolder);
  const [path, setPath] = useState<Crumb[]>([]);
  const [isPublic, setPublic] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [top, setTop] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Item[] | null>(null);
  const [menu, setMenu] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ item: Item; url: string } | null>(null);
  const [naming, setNaming] = useState<{ title: string; value: string; done: (name: string) => void } | null>(null);
  const [moving, setMoving] = useState<Item | null>(null);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const uploadKey = useRef(0);

  const say = useCallback((text: string) => { setNotice(text); setTimeout(() => setNotice((n) => (n === text ? null : n)), 4000); }, []);

  const load = useCallback(async (id: string | null) => {
    setLoading(true);
    try {
      const r = await call<{ folder: string | null; path: Crumb[]; public: boolean; items: Item[] }>("list", { folder: id });
      setFolder(r.folder);
      setPath(r.path);
      setPublic(r.public);
      setItems(r.items);
      if (!r.folder) setTop(r.items.filter((i) => i.kind === "folder"));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't open that folder");
    } finally {
      setLoading(false);
    }
  }, []);

  // The view the browser remembers; the top folders for the sidebar; the folder in the address.
  useEffect(() => {
    try { if (localStorage.getItem("drive-view") === "list") setView("list"); } catch {}
    call<{ items: Item[] }>("list").then((r) => setTop(r.items.filter((i) => i.kind === "folder"))).catch(() => {});
    load(initialFolder);
    const onPop = () => load(new URLSearchParams(location.search).get("folder"));
    addEventListener("popstate", onPop);
    return () => removeEventListener("popstate", onPop);
  }, [initialFolder, load]);

  const go = useCallback((id: string | null) => {
    setQuery("");
    setResults(null);
    history.pushState(null, "", id ? `?folder=${id}` : location.pathname);
    load(id);
  }, [load]);

  const switchView = (v: "grid" | "list") => {
    setView(v);
    try { localStorage.setItem("drive-view", v); } catch {}
  };

  // Search across the whole Drive as you type.
  useEffect(() => {
    const q = query.trim();
    if (!q) { setResults(null); return; }
    const t = setTimeout(() => call<{ items: Item[] }>("search", { q }).then((r) => setResults(r.items)).catch((e) => setError(e.message)), 250);
    return () => clearTimeout(t);
  }, [query]);

  // ── Uploads: a few at a time, each with its own progress ──
  const queue = useRef<{ key: number; file: File; parent: string | null }[]>([]);
  const running = useRef(0);
  const patch = (key: number, change: Partial<Upload>) => setUploads((list) => list.map((u) => (u.key === key ? { ...u, ...change } : u)));

  const pump = useCallback(() => {
    while (running.current < PARALLEL && queue.current.length) {
      const job = queue.current.shift()!;
      running.current++;
      (async () => {
        try {
          const start = await call<{ id: string; path: string; uploadUrl: string }>("upload-url", { parent: job.parent, name: job.file.name, type: job.file.type, size: job.file.size });
          await new Promise<void>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            patch(job.key, { state: "sending", xhr });
            xhr.open("PUT", start.uploadUrl);
            xhr.setRequestHeader("x-upsert", "false");
            xhr.upload.onprogress = (e) => e.lengthComputable && patch(job.key, { progress: e.loaded / e.total });
            xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error("The upload didn't go through")));
            xhr.onerror = () => reject(new Error("The upload didn't go through"));
            xhr.onabort = () => reject(new Error("cancelled"));
            const form = new FormData();
            form.append("cacheControl", "3600");
            form.append("", job.file);
            xhr.send(form);
          });
          await call("commit", { id: start.id, path: start.path, parent: job.parent, name: job.file.name, type: job.file.type, size: job.file.size });
          patch(job.key, { state: "done", progress: 1, xhr: undefined });
        } catch (e) {
          const message = e instanceof Error ? e.message : "Upload failed";
          patch(job.key, message === "cancelled" ? { state: "cancelled", xhr: undefined } : { state: "failed", error: message, xhr: undefined });
        } finally {
          running.current--;
          if (!queue.current.length && running.current === 0) load(folderRef.current);
          pump();
        }
      })();
    }
  }, [load]);

  const folderRef = useRef(folder);
  useEffect(() => { folderRef.current = folder; }, [folder]);

  const addFiles = useCallback((files: FileList | File[]) => {
    const list = Array.from(files);
    if (!list.length) return;
    const added: Upload[] = [];
    for (const file of list) {
      const key = ++uploadKey.current;
      if (file.size > MAX_FILE) {
        added.push({ key, name: file.name, size: file.size, progress: 0, state: "failed", error: "Over 50 MB" });
        continue;
      }
      added.push({ key, name: file.name, size: file.size, progress: 0, state: "waiting" });
      queue.current.push({ key, file, parent: folderRef.current });
    }
    setUploads((u) => [...u.filter((x) => x.state === "waiting" || x.state === "sending"), ...added]);
    pump();
  }, [pump]);

  // Files dropped anywhere on the page go to the folder that's open.
  useEffect(() => {
    let depth = 0;
    const hasFiles = (e: DragEvent) => !!e.dataTransfer && Array.from(e.dataTransfer.types).includes("Files");
    const enter = (e: DragEvent) => { if (hasFiles(e)) { depth++; setDragging(true); } };
    const leave = (e: DragEvent) => { if (hasFiles(e) && --depth <= 0) { depth = 0; setDragging(false); } };
    const over = (e: DragEvent) => { if (hasFiles(e)) e.preventDefault(); };
    const drop = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth = 0;
      setDragging(false);
      if (e.dataTransfer?.files.length) addFiles(e.dataTransfer.files);
    };
    addEventListener("dragenter", enter);
    addEventListener("dragleave", leave);
    addEventListener("dragover", over);
    addEventListener("drop", drop);
    return () => {
      removeEventListener("dragenter", enter);
      removeEventListener("dragleave", leave);
      removeEventListener("dragover", over);
      removeEventListener("drop", drop);
    };
  }, [addFiles]);

  // ── Actions on an item ──
  const act = useCallback(async (job: () => Promise<unknown>, done?: string) => {
    try {
      await job();
      if (done) say(done);
      await load(folderRef.current);
      if (query.trim()) call<{ items: Item[] }>("search", { q: query.trim() }).then((r) => setResults(r.items)).catch(() => {});
    } catch (e) {
      setError(e instanceof Error ? e.message : "That didn't work");
    }
  }, [load, query, say]);

  const open = useCallback(async (item: Item) => {
    setMenu(null);
    if (item.kind === "folder") return go(item.id);
    if (isDesign(item)) { location.href = `/apps/create/figcraft?file=${item.id}`; return; }
    try {
      if (canPreview(item)) {
        const r = await call<{ url: string }>("download-url", { id: item.id, inline: true });
        setPreview({ item, url: r.url });
      } else {
        const r = await call<{ url: string }>("download-url", { id: item.id });
        location.href = r.url;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't open the file");
    }
  }, [go]);

  const download = async (item: Item) => {
    setMenu(null);
    try { location.href = (await call<{ url: string }>("download-url", { id: item.id })).url; }
    catch (e) { setError(e instanceof Error ? e.message : "Couldn't download the file"); }
  };
  const copyLink = async (item: Item) => {
    setMenu(null);
    try {
      const { url } = await call<{ url: string }>("public-link", { id: item.id });
      await navigator.clipboard.writeText(url);
      say("Public link copied");
    } catch (e) { setError(e instanceof Error ? e.message : "Couldn't copy the link"); }
  };
  const rename = (item: Item) => {
    setMenu(null);
    setNaming({ title: `Rename ${item.kind}`, value: item.name, done: (name) => act(() => call("rename", { id: item.id, name }), "Renamed") });
  };
  const remove = (item: Item) => {
    setMenu(null);
    const what = item.kind === "folder" ? `the folder "${item.name}" and everything in it` : `"${item.name}"`;
    if (confirm(`Delete ${what}? This can't be undone.`)) act(() => call("delete", { ids: [item.id] }), "Deleted");
  };
  const newFolder = () => setNaming({ title: "New folder", value: "Untitled folder", done: (name) => act(() => call("create-folder", { parent: folder, name }), "Folder created") });

  const shownItems = results ?? items;
  const folders = useMemo(() => shownItems.filter((i) => i.kind === "folder"), [shownItems]);
  const files = useMemo(() => shownItems.filter((i) => i.kind === "file"), [shownItems]);
  const here = path.length ? path[path.length - 1].name : "Drive";
  const busy = uploads.some((u) => u.state === "waiting" || u.state === "sending");

  const itemMenu = (item: Item) => (
    <div className="drive-menu" role="menu" onClick={(e) => e.stopPropagation()}>
      <button role="menuitem" onClick={() => open(item)}>{item.kind === "folder" ? "Open" : isDesign(item) ? "Open in FigCraft" : "Open"}</button>
      {item.kind === "file" && <button role="menuitem" onClick={() => download(item)}>Download</button>}
      <button role="menuitem" onClick={() => rename(item)}>Rename</button>
      <button role="menuitem" onClick={() => { setMenu(null); setMoving(item); }}>Move to…</button>
      {item.kind === "file" && isPublic && !results && <button role="menuitem" onClick={() => copyLink(item)}>Copy public link</button>}
      <button role="menuitem" className="drive-danger" onClick={() => remove(item)}>Delete</button>
    </div>
  );

  const more = (item: Item) => (
    <span className="drive-more-wrap">
      <button className="drive-more" aria-label={`More actions for ${item.name}`} aria-haspopup="menu" onClick={(e) => { e.stopPropagation(); setMenu(menu === item.id ? null : item.id); }}>⋯</button>
      {menu === item.id && itemMenu(item)}
    </span>
  );

  const thumb = (item: Item) => (
    <div className="drive-thumb">
      {item.kind === "folder"
        ? <FolderIcon />
        // eslint-disable-next-line @next/next/no-img-element
        : item.previewUrl ? <img src={item.previewUrl} alt="" loading="lazy" />
        : <span className="drive-type">{typeLabel(item)}</span>}
    </div>
  );

  return (
    <div className="drive-app" onClick={() => setMenu(null)}>
      <aside className="drive-side">
        <button className="drive-new" onClick={newFolder}>+ New folder</button>
        <button className="drive-new drive-upload" onClick={() => fileInput.current?.click()}>Upload files</button>
        <input ref={fileInput} type="file" multiple hidden onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ""; }} />
        <nav aria-label="Drive folders">
          <button className={!folder && !results ? "drive-nav current" : "drive-nav"} onClick={() => go(null)}><FolderIcon /> My Drive</button>
          {top.map((f) => (
            <button key={f.id} className={path[0]?.id === f.id ? "drive-nav current" : "drive-nav"} onClick={() => go(f.id)}><FolderIcon /> {f.name}</button>
          ))}
        </nav>
      </aside>

      <section className="drive-main">
        <div className="drive-top">
          <input className="drive-search" type="search" placeholder="Search Drive" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search Drive" />
          <div className="drive-views" role="group" aria-label="View">
            <button className={view === "grid" ? "on" : ""} aria-pressed={view === "grid"} onClick={() => switchView("grid")} title="Grid view">▦</button>
            <button className={view === "list" ? "on" : ""} aria-pressed={view === "list"} onClick={() => switchView("list")} title="List view">☰</button>
          </div>
        </div>

        <div className="drive-crumbs">
          {results ? <h1>Search results</h1> : (
            <h1>
              <button onClick={() => go(null)}>My Drive</button>
              {path.map((c, i) => (
                <span key={c.id}> <span aria-hidden="true">›</span> {i === path.length - 1 ? c.name : <button onClick={() => go(c.id)}>{c.name}</button>}</span>
              ))}
            </h1>
          )}
          {isPublic && !results && <span className="studio-pill" title="Files here can be shown on the live website">Website folder · public links</span>}
        </div>

        {error && <p className="drive-error" role="alert">{error} <button onClick={() => setError(null)}>Dismiss</button></p>}
        {loading && !shownItems.length && <p className="studio-hint">Loading…</p>}
        {!loading && !shownItems.length && (
          <div className="drive-empty">
            <p>{results ? "Nothing matches your search." : "This folder is empty."}</p>
            {!results && <p className="studio-hint">Drag files here, or use Upload files.</p>}
          </div>
        )}

        {view === "grid" ? (
          <>
            {folders.length > 0 && <h2 className="drive-group">Folders</h2>}
            <ul className="drive-folders">
              {folders.map((f) => (
                <li key={f.id} className="drive-folder" onDoubleClick={() => open(f)} onClick={() => open(f)}>
                  <FolderIcon /> <span className="drive-name">{f.name}</span>{f.publicFolder && <span className="drive-tag">Website</span>}{more(f)}
                </li>
              ))}
            </ul>
            {files.length > 0 && <h2 className="drive-group">Files</h2>}
            <ul className="drive-grid">
              {files.map((f) => (
                <li key={f.id} className="drive-card" onClick={() => open(f)}>
                  {thumb(f)}
                  <div className="drive-card-body">
                    <span className="drive-name" title={f.name}>{f.name}</span>
                    {more(f)}
                  </div>
                  <span className="drive-meta">Edited {edited(f.updatedAt)}</span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          shownItems.length > 0 && (
            <table className="drive-list">
              <thead><tr><th>Name</th><th>Modified</th><th>Size</th><th aria-label="Actions" /></tr></thead>
              <tbody>
                {[...folders, ...files].map((i) => (
                  <tr key={i.id} onClick={() => open(i)}>
                    <td><span className="drive-row-name">{i.kind === "folder" ? <FolderIcon /> : <span className="drive-type small">{typeLabel(i)}</span>}{i.name}</span></td>
                    <td>{edited(i.updatedAt)}</td>
                    <td>{i.kind === "folder" ? "—" : bytes(i.size)}</td>
                    <td onClick={(e) => e.stopPropagation()}>{more(i)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}
      </section>

      {dragging && <div className="drive-drop" aria-hidden="true"><p>Drop to upload to <strong>{here}</strong></p></div>}

      {uploads.length > 0 && (
        <div className="drive-uploads" role="status" aria-live="polite">
          <div className="drive-uploads-head">
            <strong>{busy ? `Uploading ${uploads.filter((u) => u.state === "waiting" || u.state === "sending").length}…` : `${uploads.filter((u) => u.state === "done").length} uploaded`}</strong>
            {!busy && <button onClick={() => setUploads([])} aria-label="Close uploads">✕</button>}
          </div>
          <ul>
            {uploads.map((u) => (
              <li key={u.key}>
                <span className="drive-name" title={u.name}>{u.name}</span>
                <span className="drive-upload-state">
                  {u.state === "sending" && <progress value={u.progress} max={1} aria-label={`${u.name} upload`} />}
                  {u.state === "waiting" && "Waiting"}
                  {u.state === "done" && "✓"}
                  {u.state === "failed" && <span className="drive-danger">{u.error}</span>}
                  {u.state === "cancelled" && "Cancelled"}
                  {(u.state === "sending" || u.state === "waiting") && (
                    <button onClick={() => {
                      if (u.xhr) u.xhr.abort();
                      else { queue.current = queue.current.filter((j) => j.key !== u.key); patch(u.key, { state: "cancelled" }); }
                    }}>Cancel</button>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {notice && <div className="drive-notice" role="status">{notice}</div>}

      {preview && (
        <div className="drive-modal" role="dialog" aria-label={preview.item.name} onClick={() => setPreview(null)}>
          <div className="drive-preview" onClick={(e) => e.stopPropagation()}>
            <div className="drive-preview-head">
              <strong>{preview.item.name}</strong>
              <span>
                <button onClick={() => download(preview.item)}>Download</button>
                <button onClick={() => setPreview(null)} aria-label="Close">✕</button>
              </span>
            </div>
            {preview.item.mime?.startsWith("image/") && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview.url} alt={preview.item.name} />
            )}
            {preview.item.mime?.startsWith("video/") && <video src={preview.url} controls autoPlay />}
            {preview.item.mime === "application/pdf" && <iframe src={preview.url} title={preview.item.name} />}
          </div>
        </div>
      )}

      {naming && <NameDialog {...naming} close={() => setNaming(null)} />}
      {moving && <MoveDialog item={moving} close={() => setMoving(null)} move={(parent) => act(() => call("move", { ids: [moving.id], parent }), "Moved")} />}
    </div>
  );
}

function NameDialog({ title, value, done, close }: { title: string; value: string; done: (name: string) => void; close: () => void }) {
  const [name, setName] = useState(value);
  return (
    <div className="drive-modal" role="dialog" aria-label={title} onClick={close}>
      <form className="drive-dialog" onClick={(e) => e.stopPropagation()} onSubmit={(e) => { e.preventDefault(); if (name.trim()) { done(name.trim()); close(); } }}>
        <h2>{title}</h2>
        <input autoFocus value={name} onChange={(e) => setName(e.target.value)} onFocus={(e) => e.target.select()} maxLength={255} />
        <div className="drive-dialog-actions">
          <button type="button" onClick={close}>Cancel</button>
          <button type="submit" className="primary">OK</button>
        </div>
      </form>
    </div>
  );
}

// Pick a folder to move an item into, browsing from the top.
function MoveDialog({ item, close, move }: { item: Item; close: () => void; move: (parent: string | null) => void }) {
  const [at, setAt] = useState<string | null>(null);
  const [trail, setTrail] = useState<Crumb[]>([]);
  const [folders, setFolders] = useState<Item[]>([]);
  useEffect(() => {
    call<{ path: Crumb[]; items: Item[] }>("list", { folder: at })
      .then((r) => { setTrail(r.path); setFolders(r.items.filter((i) => i.kind === "folder" && i.id !== item.id)); })
      .catch(() => {});
  }, [at, item.id]);
  return (
    <div className="drive-modal" role="dialog" aria-label={`Move ${item.name}`} onClick={close}>
      <div className="drive-dialog" onClick={(e) => e.stopPropagation()}>
        <h2>Move “{item.name}”</h2>
        <p className="studio-hint">
          <button className="drive-link" onClick={() => setAt(null)}>My Drive</button>
          {trail.map((c) => <span key={c.id}> › <button className="drive-link" onClick={() => setAt(c.id)}>{c.name}</button></span>)}
        </p>
        <ul className="drive-pick">
          {folders.length === 0 && <li className="studio-hint">No folders here</li>}
          {folders.map((f) => <li key={f.id}><button onClick={() => setAt(f.id)}><FolderIcon /> {f.name}</button></li>)}
        </ul>
        <div className="drive-dialog-actions">
          <button type="button" onClick={close}>Cancel</button>
          <button className="primary" onClick={() => { move(at); close(); }}>Move here</button>
        </div>
      </div>
    </div>
  );
}
