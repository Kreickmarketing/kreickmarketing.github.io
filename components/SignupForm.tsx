"use client";

import { useActionState } from "react";
import { joinMailingList, type SignupState } from "@/app/actions";

const initial: SignupState = { status: "idle", message: "" };

// The words can be set in Studio (mailing list section); without them, the defaults below.
type Words = { nameLabel?: string; emailLabel?: string; button?: string; thanks?: string };

export default function SignupForm({ nameLabel = "Name", emailLabel = "Email", button = "Join the list", thanks }: Words = {}) {
  const [state, action, pending] = useActionState(joinMailingList, initial);
  // A new sign-up shows Studio's thank-you message; "already on the list" and errors keep their own.
  const message = state.status === "success" && thanks && state.message !== "You're already on the list." ? thanks : state.message;

  return (
    <form action={action} className="signup">
      <label className="field">
        <span className="text-sm-medium">{nameLabel}</span>
        <input name="name" type="text" autoComplete="name" required />
      </label>
      <label className="field">
        <span className="text-sm-medium">{emailLabel}</span>
        <input name="email" type="email" autoComplete="email" required />
      </label>
      <button type="submit" className="button button-dark" disabled={pending}>
        {pending ? "Sending..." : button}
      </button>
      {message && (
        <p role="status" className={`text-sm-normal form-note form-note-${state.status}`}>
          {message}
        </p>
      )}
    </form>
  );
}
