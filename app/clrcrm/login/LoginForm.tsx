"use client";

import { useActionState } from "react";
import { signIn, type LoginState } from "../actions";

export default function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(signIn, { error: "" });
  return (
    <form action={action} className="crm-login-form">
      <div className="field">
        <label htmlFor="username" className="text-sm-semi-bold">Username</label>
        <input id="username" name="username" autoComplete="username" autoCapitalize="none" required />
      </div>
      <div className="field">
        <label htmlFor="password" className="text-sm-semi-bold">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      {state.error && <p className="form-note-error text-sm-normal" role="alert">{state.error}</p>}
      <button type="submit" className="button button-action" disabled={pending}>
        {pending ? "Logging in…" : "Log in"}
      </button>
      <a href="/clrcrm/forgot" className="crm-login-link text-sm-normal">Forgot password?</a>
    </form>
  );
}
