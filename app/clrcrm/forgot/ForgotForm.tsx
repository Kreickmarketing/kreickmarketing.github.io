"use client";

import { useActionState } from "react";
import { requestPasswordReset, type ResetState } from "../actions";

export default function ForgotForm() {
  const [state, action, pending] = useActionState<ResetState, FormData>(requestPasswordReset, { error: "" });
  if (state.sent) {
    return (
      <>
        <p className="form-note-success text-sm-normal" role="status">
          If that username has an account, a reset link is on its way. Open it on this device. It works once.
        </p>
        <a href="/clrcrm/login" className="crm-login-link text-sm-normal">Back to log in</a>
      </>
    );
  }
  return (
    <form action={action} className="crm-login-form">
      <div className="field">
        <label htmlFor="username" className="text-sm-semi-bold">Username</label>
        <input id="username" name="username" autoComplete="username" autoCapitalize="none" required />
      </div>
      {state.error && <p className="form-note-error text-sm-normal" role="alert">{state.error}</p>}
      <button type="submit" className="button button-action" disabled={pending}>
        {pending ? "Sending…" : "Email me a reset link"}
      </button>
      <a href="/clrcrm/login" className="crm-login-link text-sm-normal">Back to log in</a>
    </form>
  );
}
