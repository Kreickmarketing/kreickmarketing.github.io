import { NextResponse, type NextRequest } from "next/server";
import { getServerSupabase } from "@/lib/supabase-server";
import { safeNext as toSafeNext } from "../../next-path";

// The password-reset email links here with a one-time code. Trading the code
// for a login lets /apps/reset save the new password.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const safeNext = toSafeNext(searchParams.get("next"));

  if (code) {
    const supabase = await getServerSupabase();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(safeNext, origin));
  }
  return NextResponse.redirect(new URL("/apps/forgot?expired=1", origin));
}
