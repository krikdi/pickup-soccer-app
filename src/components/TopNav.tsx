'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
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
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const isActive = (href: string) =>
    pathname === href || (href === '/matches' && pathname?.startsWith('/matches'));

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

  return (
    <header className="w-full border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-3xl px-4 py-3 flex items-center justify-between">
        <nav className="flex items-center gap-2">
          <NavLink href="/matches" label="Matches" active={isActive('/matches')} />
          <NavLink href="/my-matches" label="My Matches" active={isActive('/my-matches')} />
        </nav>

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
    </header>
  );
}
