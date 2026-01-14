'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    async function run() {
      // 1) email OTP приходит как query: ?token_hash=...&type=magiclink
      const url = new URL(window.location.href);
      const token_hash = url.searchParams.get('token_hash');
      const type = url.searchParams.get('type') as any; // 'magiclink' | 'recovery' | etc

      if (token_hash && type) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash,
          type,
        });

        if (error) {
          console.error('verifyOtp error:', error);
          router.replace(`/login?error=${encodeURIComponent(error.message)}`);
          return;
        }

        router.replace('/matches');
        return;
      }

      // 2) иногда Supabase возвращает сессию в hash (#access_token=...)
      // Supabase сам может подхватить это через getSession, просто редиректим
      router.replace('/matches');
    }

    run();
  }, [router]);

  return <div style={{ padding: 20, color: 'white' }}>Signing you in…</div>;
}
