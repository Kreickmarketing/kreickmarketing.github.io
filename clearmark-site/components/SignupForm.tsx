"use client";

import { useActionState } from "react";
import { joinMailingList, type SignupState } from "@/app/actions";

const initial: SignupState = { status: "idle", message: "" };

export default function SignupForm() {
  const [state, action, pending] = useActionState(joinMailingList, initial);

  return (
    <form action={action} className="signup">
      <label className="field">
        <span className="text-sm-medium">Name</span>
        <input name="name" type="text" autoComplete="name" required />
      </label>
      <label className="field">
        <span className="text-sm-medium">Email</span>
        <input name="email" type="email" autoComplete="email" required />
      </label>
      <button type="submit" className="button button-dark" disabled={pending}>
        {pending ? "Sending..." : "Join the list"}
      </button>
      {state.message && (
        <p role="status" className={`text-sm-normal form-note form-note-${state.status}`}>
          {state.message}
        </p>
      )}
    </form>
  );
}
