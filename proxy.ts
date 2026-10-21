import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Runs before every /apps request (except Social Studio, a separate app): keeps the login cookie fresh and sends
// logged-out visitors to the login page. The page itself does the full check.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  // Pages a logged-out visitor may open: log in, ask for a reset email, and the
  // link that email contains.
  const path = request.nextUrl.pathname;
  const isPublic = ["/apps/login", "/apps/forgot", "/apps/auth"].some((p) => path.startsWith(p));
  if (!user && !isPublic) {
    // Remember the page they asked for, so logging in takes them straight there.
    const login = new URL("/apps/login", request.url);
    if (path !== "/apps") login.searchParams.set("next", path + request.nextUrl.search);
    return NextResponse.redirect(login);
  }

  // Keep the CRM out of search engines.
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

export const config = {
  // Old /clrcrm addresses are forwarded by next.config.ts before this runs.
  matcher: ["/apps", "/apps/((?!socialstudio(?:/|$)).*)"],
};
