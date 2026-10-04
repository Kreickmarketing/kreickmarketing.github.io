"use client";

import { useActionState } from "react";
import { updatePassword, type ResetState } from "../actions";

export default function ResetForm() {
  const [state, action, pending] = useActionState<ResetState, FormData>(updatePassword, { error: "" });
  return (
    <form action={action} className="crm-login-form">
      <div className="field">
        <label htmlFor="password" className="text-sm-semi-bold">New password</label>
        <input id="password" name="password" type="password" autoComplete="new-password" minLength={10} required />
      </div>
      <div className="field">
        <label htmlFor="confirm" className="text-sm-semi-bold">Type it again</label>
        <input id="confirm" name="confirm" type="password" autoComplete="new-password" minLength={10} required />
      </div>
      {state.error && <p className="form-note-error text-sm-normal" role="alert">{state.error}</p>}
      <button type="submit" className="button button-action" disabled={pending}>
        {pending ? "Saving…" : "Save and log in"}
      </button>
    </form>
  );
}
