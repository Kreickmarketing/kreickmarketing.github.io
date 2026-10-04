import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Runs before every /clrcrm request: keeps the login cookie fresh and sends
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
  const isPublic = ["/clrcrm/login", "/clrcrm/forgot", "/clrcrm/auth"].some((p) => path.startsWith(p));
  if (!user && !isPublic) {
    return NextResponse.redirect(new URL("/clrcrm/login", request.url));
  }

  // Keep the CRM out of search engines.
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

export const config = {
  matcher: ["/clrcrm", "/clrcrm/:path*"],
};
