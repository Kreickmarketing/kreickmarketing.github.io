// Where to send someone after they log in. Only pages inside /clrcrm are
// allowed, so a link can't use the login page to bounce people to another site.
export function safeNext(next: unknown) {
  const v = typeof next === "string" ? next : "";
  return /^\/clrcrm(\/|\?|$)/.test(v) && !v.startsWith("/clrcrm/login") ? v : "/clrcrm";
}
