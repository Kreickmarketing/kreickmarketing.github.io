"use client";

import { useEffect, useState } from "react";
import StudioPage from "@/components/StudioPage";
import type { CardContent } from "@/components/Card";
import type { PageContent, SiteSettings } from "@/lib/studio";

// Redraws the page whenever the editor (the window around this frame) sends
// new content. Only messages from this same site are accepted.
export default function LivePreview({ initial, settings, cards }: { initial: PageContent; settings: SiteSettings; cards: Record<string, CardContent> }) {
  const [content, setContent] = useState(initial);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type === "studio-preview" && Array.isArray(e.data.content?.sections)) setContent(e.data.content);
      // Scroll to the section being edited and outline it for a moment.
      if (e.data?.type === "studio-focus" && typeof e.data.id === "string") {
        const el = document.getElementById(e.data.id);
        if (!el) return;
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        el.classList.add("sp-focus");
        setTimeout(() => el.classList.remove("sp-focus"), 1500);
      }
    };
    window.addEventListener("message", onMessage);
    window.parent.postMessage({ type: "studio-preview-ready" }, window.location.origin);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  // Links stay inside the preview harmlessly; clicking one shouldn't leave the editor.
  return (
    <div onClickCapture={(e) => { if ((e.target as HTMLElement).closest("a")) e.preventDefault(); }}>
      <StudioPage content={content} settings={settings} cards={cards} />
    </div>
  );
}
