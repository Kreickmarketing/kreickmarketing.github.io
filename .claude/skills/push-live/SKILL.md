---
name: push-live
description: Put ClearMark Studio design template changes that /push-check already brought in and checked live on clearmark.bz. Use when Andrew types /push-live, or comments "push live" on the "ClearMark Studio Templates" canvas and sends it to Claude.
---

# /push-live: checked work → clearmark.bz

Runs after `/push-check`. **Andrew running /push-live (or a "push live" comment he sent to Claude) is his OK to push to `main`**, which Vercel puts on clearmark.bz. It only ships work `/push-check` already brought in and checked; it doesn't pull new designs from the canvas.

## Steps

1. **What's waiting.** `git fetch -q origin main`, then `git log --oneline origin/main..HEAD` and `git diff --stat origin/main...HEAD`. Nothing waiting → say so and stop. List for Andrew, in plain words, everything that will go live (design changes and anything else on the branch). If something other than checked template work is waiting and Andrew hasn't approved it, **stop and ask**.
2. **Canvas changed since the check?** If the canvas boards for these templates now differ from `docs/prototypes/claude-design-templates/`, stop and tell Andrew to run `/push-check` again first.
3. **Re-check** (all must pass): `npx tsc --noEmit`, then `npx next build`. A failure → stop and report; **never push a failing change to `main`**.
4. **Push.** If `main` has moved on (`git merge-base --is-ancestor origin/main HEAD` fails), merge `origin/main` in, re-run step 3, push the merge to the backup branch. Then `git push origin HEAD:main`. Network errors: retry up to 4 times (2s, 4s, 8s, 16s).
5. **Log it.** Mark the entries in `docs/studio-plan.md` as live (update `docs/project-status.md` if needed); commit and push to the backup branch and `main`.
6. **Tell Andrew**: what went live and "on clearmark.bz in about 2 minutes (Vercel rebuilds)". If it came from a canvas comment, reply under that comment (ArtifactComments) as well.

## Never

- Push anything that failed a check or that `/push-check` hasn't brought in.
- Touch Supabase (data, tables or settings).
- Put secret keys in code.
