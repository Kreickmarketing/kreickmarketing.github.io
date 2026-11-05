"use client";
import { useEffect } from "react";

// Moving parts of Studio graphs (lib/builder-site.ts marks numbers with data-count and data-delay):
// - Hero stat chart: its numbers count up from zero on page load, alongside the CSS line drawing.
// - Photo + text graph cards: hidden (.wait) until scrolled into view, then .play starts the CSS
//   animation and the numbers count up.
// Skipped for reduced motion. The HTML already holds the final numbers and shows the graphs, so
// nothing is lost if this never runs.
export default function CountUp() {
  useEffect(() => {
    // Hero video per screen size: a video only picks its file when the page loads, so after a resize or a
    // tablet turned sideways, load the one that's now showing (it chooses its file again).
    const heroMQ = ["(min-width: 1001px)", "(min-width: 701px) and (max-width: 1000px)", "(max-width: 700px)"].map((q) => matchMedia(q));
    const heroSwap = () => document.querySelectorAll<HTMLVideoElement>(".site .hero-bg > video.hb").forEach((v) => {
      if (getComputedStyle(v).display !== "none" && !v.currentSrc) { v.load(); if (!matchMedia("(prefers-reduced-motion: reduce)").matches) v.play().catch(() => {}); }
    });
    heroMQ.forEach((m) => m.addEventListener("change", heroSwap));
    // Offer card background videos: visitors who turn motion off see the first frame, paused.
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document.querySelectorAll<HTMLVideoElement>(".site .oc > video").forEach((v) => { v.removeAttribute("autoplay"); v.pause(); });
      return () => heroMQ.forEach((m) => m.removeEventListener("change", heroSwap));
    }
    const num = (v: string) => parseFloat(v.replace(/[^0-9.-]/g, "")) || 0;
    const show = (el: HTMLElement, k: number) => {
      const raw = el.dataset.count ?? "", dp = (raw.split(".")[1] || "").replace(/\D/g, "").length, v = num(raw) * k;
      el.textContent = raw.includes(",") ? v.toLocaleString("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp }) : v.toFixed(dp);
    };
    const frames = new Set<number>(), counted: HTMLElement[] = [];
    const count = (root: Element) => {
      const els = [...root.querySelectorAll<HTMLElement>("[data-count]")], t0 = performance.now();
      counted.push(...els);
      els.forEach((el) => show(el, 0));
      const step = (now: number) => {
        let busy = false;
        els.forEach((el) => {
          const t = Math.min(1, Math.max(0, (now - t0 - Number(el.dataset.delay || 0)) / 1600));
          show(el, 1 - Math.pow(1 - t, 3));
          if (t < 1) busy = true;
        });
        if (busy) frames.add(requestAnimationFrame(step));
      };
      frames.add(requestAnimationFrame(step));
    };
    document.querySelectorAll(".site .hstat").forEach(count);
    const cards = document.querySelectorAll<HTMLElement>(".site .gfx");
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      e.target.classList.remove("wait");
      e.target.classList.add("play");
      count(e.target);
    }), { threshold: 0.4 });
    cards.forEach((el) => { el.classList.add("wait"); io.observe(el); });
    return () => {
      heroMQ.forEach((m) => m.removeEventListener("change", heroSwap));
      io.disconnect();
      frames.forEach(cancelAnimationFrame);
      counted.forEach((el) => show(el, 1));
      cards.forEach((el) => el.classList.remove("wait"));
    };
  }, []);
  return null;
}
