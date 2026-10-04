"use client";

import { useRef } from "react";
import { ALL_STAGES } from "./data";
import { moveStage } from "./actions";

// Stage dropdown that saves as soon as a new stage is picked.
// The Move button is there for when JavaScript is off.
export default function StageSelect({ id, stage, label }: { id: string; stage: string | null; label: string }) {
  const form = useRef<HTMLFormElement>(null);
  return (
    <form action={moveStage} ref={form} className="crm-move">
      <input type="hidden" name="id" value={id} />
      <select
        name="stage"
        defaultValue={stage ?? ""}
        aria-label={`Move ${label} to stage`}
        onChange={() => form.current?.requestSubmit()}
      >
        {!stage && <option value="" disabled>Pick a stage…</option>}
        {ALL_STAGES.map((s) => <option key={s} value={s}>{s === "LOST" ? "Lost" : s}</option>)}
      </select>
      <noscript><button type="submit" className="button button-dark">Move</button></noscript>
    </form>
  );
}
