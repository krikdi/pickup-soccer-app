'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
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
    // если мы на странице матча (/matches/[id]) и пришли из my-matches
    if (pathname?.startsWith('/matches/') && from === '/my-matches') {
      return href === '/my-matches';
    }
  
    // строго: /matches активен только на /matches и /matches/[id]
    if (href === '/matches') {
      return pathname === '/matches' || (pathname?.startsWith('/matches/') && !pathname?.startsWith('/matches/new'));
    }
  
    // строго: create активен только на /matches/new
    if (href === '/matches/new') {
      return pathname === '/matches/new';
    }
  
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
  const goProtected = (href: string) => {
    if (!hasSession) {
      router.push('/login');
      return;
    }
    router.push(href);
  };


  return (
    <header className="w-full border-b border-gray-200 bg-white">
      <Suspense fallback={null}>
        <FromReader onFrom={setFrom} />
      </Suspense>

      <div className="mx-auto max-w-3xl px-4 py-3 flex flex-wrap items-center gap-2">

        {/* LEFT */}
        <nav className="flex items-center gap-2 flex-wrap">

  {/* Create (protected) */}
  {hasSession ? (
    <NavLink href="/matches/new" label="Create" active={isActive('/matches/new')} />
  ) : (
    <button
      onClick={() => goProtected('/matches/new')}
      className="px-3 py-2 rounded-md text-sm font-medium bg-gray-100 text-gray-900 hover:bg-gray-200"
    >
      Create
    </button>
  )}

  {/* Matches (public) */}
  <NavLink href="/matches" label="Matches" active={isActive('/matches')} />

  {/* My Matches (protected) */}
  {hasSession ? (
    <NavLink href="/my-matches" label="My Matches" active={isActive('/my-matches')} />
  ) : (
    <button
      onClick={() => goProtected('/my-matches')}
      className="px-3 py-2 rounded-md text-sm font-medium bg-gray-100 text-gray-900 hover:bg-gray-200"
    >
      My Matches
    </button>
  )}
</nav>



                {/* RIGHT */}
                <div className="ml-auto flex items-center gap-2 flex-wrap min-w-0">

          {hasSession ? (
            <>
              {email && (
                <div className="px-3 py-2 rounded-md bg-gray-100 text-gray-800 text-sm max-w-[140px] truncate">
                {email}
              </div>              
              
              )}

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
            </>
          ) : (
            <button
            onClick={() => router.replace('/login')}

              className="px-3 py-2 rounded-md text-sm font-medium bg-gray-100 text-gray-900 hover:bg-gray-200"
            >
              Login
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
