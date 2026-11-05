"use client";

import { useEffect } from "react";

// Adds the playbook's interactive bits: Copy buttons, the timeline checklist
// (saved on this device), the current-section highlight, and opening a
// channel when you jump to it.
export default function PlaybookControls() {
  useEffect(() => {
    const root = document.getElementById("playbook");
    if (!root) return;

    function flash(btn: HTMLButtonElement, label: string, done: boolean) {
      btn.textContent = label;
      btn.classList.toggle("done", done);
      window.setTimeout(() => { btn.textContent = "Copy"; btn.classList.remove("done"); }, 1800);
    }

    function onClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      const btn = target.closest<HTMLButtonElement>("button.copy");
      if (btn) {
        const el = btn.closest(".block")?.querySelector<HTMLElement>(".copytext");
        if (!el) return;
        const text = el.innerText.trim();
        const selectIt = () => {
          const range = document.createRange();
          range.selectNodeContents(el);
          const sel = window.getSelection();
          sel?.removeAllRanges();
          sel?.addRange(range);
          flash(btn, "Selected, now copy", false);
        };
        if (navigator.clipboard?.writeText) {
          navigator.clipboard.writeText(text).then(() => flash(btn, "Copied", true), selectIt);
        } else {
          selectIt();
        }
        return;
      }
      const jump = target.closest<HTMLAnchorElement>("a.jump");
      if (jump) openDetails(jump.getAttribute("href"));
    }

    function openDetails(hash: string | null) {
      if (!hash || hash.length < 2) return;
      const el = document.getElementById(hash.slice(1));
      if (el instanceof HTMLDetailsElement) el.open = true;
    }
    const onHash = () => openDetails(location.hash);

    // Timeline checklist, stored in this browser only.
    const KEY = "clearmark-playbook-tasks";
    let state: Record<string, boolean> = {};
    try { state = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch { state = {}; }
    const boxes = Array.from(root.querySelectorAll<HTMLInputElement>(".task input[type=checkbox]"));
    const progress = document.getElementById("progress");
    const updateProgress = () => {
      if (progress) progress.textContent = `${boxes.filter((b) => b.checked).length} of ${boxes.length} done`;
    };
    const onChange = (e: Event) => {
      const b = e.target as HTMLInputElement;
      if (!b.matches(".task input[type=checkbox]")) return;
      state[b.dataset.key ?? ""] = b.checked;
      try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage blocked */ }
      updateProgress();
    };
    boxes.forEach((b) => { b.checked = !!state[b.dataset.key ?? ""]; });
    updateProgress();

    // Highlight the section you're reading in the sticky nav.
    const links = Array.from(root.querySelectorAll<HTMLAnchorElement>("nav.crm-sections a"));
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        links.forEach((a) => a.setAttribute("aria-current", String(a.getAttribute("href") === `#${en.target.id}`)));
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    links.forEach((a) => {
      const s = document.getElementById((a.getAttribute("href") ?? "").slice(1));
      if (s) observer.observe(s);
    });

    root.addEventListener("click", onClick);
    root.addEventListener("change", onChange);
    window.addEventListener("hashchange", onHash);
    onHash();
    return () => {
      root.removeEventListener("click", onClick);
      root.removeEventListener("change", onChange);
      window.removeEventListener("hashchange", onHash);
      observer.disconnect();
    };
  }, []);

  return null;
}
