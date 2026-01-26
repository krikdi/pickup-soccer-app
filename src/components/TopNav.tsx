'use client';

import Link from 'next/link';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

function NavLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={[
        'px-3 py-2 rounded-md text-sm font-medium',
        active ? 'bg-black text-white' : 'bg-gray-100 text-gray-900 hover:bg-gray-200',
      ].join(' ')}
    >
      {label}
    </Link>
  );
}

function FromReader({ onFrom }: { onFrom: (value: string | null) => void }) {
  const searchParams = useSearchParams();
  const from = searchParams.get('from');

  useEffect(() => {
    onFrom(from);
  }, [from, onFrom]);

  return null;
}

export default function TopNav() {
  const pathname = usePathname();
  const router = useRouter();

  const [from, setFrom] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const [email, setEmail] = useState<string | null>(null);
  const [hasSession, setHasSession] = useState(false);

  const isActive = (href: string) => {
    if (pathname?.startsWith('/matches/') && from === '/my-matches') {
      return href === '/my-matches';
    }
    if (href === '/matches') return pathname === '/matches' || pathname?.startsWith('/matches/');
    return pathname === href;
  };

  // ✅ session-first approach + live updates
  useEffect(() => {
    let mounted = true;

    async function init() {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user ?? null;

      if (!mounted) return;
      setHasSession(!!user);
      setEmail(user?.email ?? null);
    }

    init();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      setHasSession(!!user);
      setEmail(user?.email ?? null);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function onLogout() {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await supabase.auth.signOut();
    } finally {
      setIsLoggingOut(false);
      router.replace('/login');
      router.refresh();
    }
  }

  return (
    <header className="w-full border-b border-gray-200 bg-white">
      <Suspense fallback={null}>
        <FromReader onFrom={setFrom} />
      </Suspense>

      <div className="mx-auto max-w-3xl px-4 py-3 flex items-center justify-between">
        {/* LEFT */}
        <nav className="flex items-center gap-2">
          <NavLink href="/matches/new" label="Create" active={isActive('/matches/new')} />
          <NavLink href="/matches" label="Matches" active={isActive('/matches')} />
          <NavLink href="/my-matches" label="My Matches" active={isActive('/my-matches')} />
        </nav>

        {/* RIGHT */}
        <div className="flex items-center gap-3 flex-wrap justify-end">
          {email && (
            <div className="px-3 py-2 rounded-md bg-gray-100 text-gray-800 text-sm whitespace-nowrap">
              {email}
            </div>
          )}

          {/* ✅ Logout only when session exists */}
          {hasSession && (
            <button
              onClick={onLogout}
              disabled={isLoggingOut}
              className={[
                'px-3 py-2 rounded-md text-sm font-medium',
                isLoggingOut
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-100 text-gray-900 hover:bg-gray-200',
              ].join(' ')}
            >
              {isLoggingOut ? 'Logging out…' : 'Logout'}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
