'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams} from 'next/navigation';
import { useEffect, useState } from 'react';
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

export default function TopNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
const from = searchParams.get('from'); // ожидаем "/my-matches"
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const isActive = (href: string) => {
    // если мы на странице матча (/matches/[id]) и пришли из my-matches
    if (pathname?.startsWith('/matches/') && from === '/my-matches') {
      return href === '/my-matches';
    }
  
    // обычное поведение
    if (href === '/matches') return pathname === '/matches' || pathname?.startsWith('/matches/');
    return pathname === href;
  };
  
  
  
  async function onLogout() {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await supabase.auth.signOut();
    } finally {
      router.replace('/login');
      router.refresh();
      setIsLoggingOut(false);
    }
  }
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
    });
  }, []);

  return (
    <header className="w-full border-b border-gray-200 bg-white">
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
        </div>
  
      </div>
    </header>
  );
}  