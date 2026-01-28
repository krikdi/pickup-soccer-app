// src/app/auth/callback/route.ts
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const url = new URL(request.url);

  const code = url.searchParams.get("code");
  const token_hash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {}
        },
      },
    }
  );

  // ✅ Новый/правильный способ: code exchange (PKCE)
  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
    return NextResponse.redirect(new URL("/matches", url.origin));
  }

  // ✅ Поддержка старого варианта: token_hash + type
  if (token_hash && type) {
    await supabase.auth.verifyOtp({ token_hash, type: type as any });
    return NextResponse.redirect(new URL("/matches", url.origin));
  }

  // fallback
  return NextResponse.redirect(new URL("/login?error=missing_callback_params", url.origin));
}
