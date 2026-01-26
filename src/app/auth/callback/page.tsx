'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForSession(maxTries = 12, delayMs = 200) {
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
    let cancelled = false;

    async function run() {
      const url = new URL(window.location.href);
      const token_hash = url.searchParams.get('token_hash');
      const type = url.searchParams.get('type') as any;

      // 1) OTP via query
      if (token_hash && type) {
        const { error } = await supabase.auth.verifyOtp({ token_hash, type });

        if (error) {
          console.error('verifyOtp error:', error);
          if (!cancelled) router.replace(`/login?error=${encodeURIComponent(error.message)}`);
          return;
        }
      }

      // 2) In both cases (query OTP or hash tokens), wait for session to persist
      const ok = await waitForSession();

      if (!ok) {
        if (!cancelled) router.replace('/login?error=No%20session%20after%20callback');
        return;
      }

      if (!cancelled) router.replace('/matches');
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return <div style={{ padding: 20, color: 'white' }}>Signing you in…</div>;
}
