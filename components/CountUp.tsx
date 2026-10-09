"use client";
import { useEffect } from "react";

// Counts the Hero stat chart's numbers up from zero alongside their lines (lib/builder-site.ts
// marks them with data-count and data-delay). Skipped for reduced motion; the HTML already holds
// the final numbers, so nothing is lost if this never runs.
export default function CountUp() {
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const els = [...document.querySelectorAll<HTMLElement>(".site [data-count]")];
    if (!els.length) return;
    const num = (v: string) => parseFloat(v.replace(/[^0-9.-]/g, "")) || 0;
    const show = (el: HTMLElement, k: number) => {
      const raw = el.dataset.count ?? "", dp = (raw.split(".")[1] || "").replace(/\D/g, "").length, v = num(raw) * k;
      el.textContent = raw.includes(",") ? v.toLocaleString("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp }) : v.toFixed(dp);
    };
    const t0 = performance.now();
    let frame = 0;
    els.forEach((el) => show(el, 0));
    const step = (now: number) => {
      let busy = false;
      els.forEach((el) => {
        const t = Math.min(1, Math.max(0, (now - t0 - Number(el.dataset.delay || 0)) / 1600));
        show(el, 1 - Math.pow(1 - t, 3));
        if (t < 1) busy = true;
      });
      if (busy) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => { cancelAnimationFrame(frame); els.forEach((el) => show(el, 1)); };
  }, []);
  return null;
}
