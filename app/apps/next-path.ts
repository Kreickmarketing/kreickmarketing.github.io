// Where to send someone after they log in. Only pages inside /apps are
// allowed, so a link can't use the login page to bounce people to another site.
// Old /clrcrm links still count: next.config.ts forwards them to /apps.
export function safeNext(next: unknown) {
  const v = typeof next === "string" ? next : "";
  const inside = /^\/(apps|clrcrm)(\/|\?|$)/.test(v) && !/^\/(apps|clrcrm)\/login/.test(v);
  return inside ? v : "/apps";
}
