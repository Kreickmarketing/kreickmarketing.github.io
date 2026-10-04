import { NextResponse, type NextRequest } from "next/server";
import { getServerSupabase } from "@/lib/supabase-server";

// The password-reset email links here with a one-time code. Trading the code
// for a login lets /clrcrm/reset save the new password.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/clrcrm";
  const safeNext = next.startsWith("/clrcrm") ? next : "/clrcrm";

  if (code) {
    const supabase = await getServerSupabase();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(safeNext, origin));
  }
  return NextResponse.redirect(new URL("/clrcrm/forgot?expired=1", origin));
}
