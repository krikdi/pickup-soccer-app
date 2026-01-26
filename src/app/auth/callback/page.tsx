'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForSession(maxTries = 10, delayMs = 150) {
  for (let i = 0; i < maxTries; i++) {
    const { data } = await supabase.auth.getSession();
    if (data.session) return true;
    await sleep(delayMs);
  }
  return false;
}

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    async function run() {
      const url = new URL(window.location.href);
      const token_hash = url.searchParams.get('token_hash');
      const type = url.searchParams.get('type') as any; // 'magiclink' | 'recovery' | etc

      // 1) email OTP приходит как query: ?token_hash=...&type=magiclink
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

        // avoid race condition: wait until session is persisted
        await waitForSession();

        router.replace('/matches');
        router.refresh();
        return;
      }

      // 2) иногда Supabase возвращает сессию в hash (#access_token=...)
      // подождём, пока Supabase подхватит сессию, и только потом редирект
      await waitForSession();

      router.replace('/matches');
      router.refresh();
    }

    run();
  }, [router]);

  return <div style={{ padding: 20, color: 'white' }}>Signing you in…</div>;
}
