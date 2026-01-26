'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase, fetchMyMatches } from '../../lib/supabaseClient';
import { formatDateTime } from '@/lib/date';
import TopNav from '@/components/TopNav';



type Match = {
  id: string;
  title: string;
  location: string | null;
  time_utc: string;
  slots_total: number;
  slots_taken: number;
};

export default function MyMatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;

      if (!user) {
        window.location.href = '/login';
        return;
      }

      const { data, error } = await fetchMyMatches(user.id);

      if (error) {
        setError(error.message ?? 'Failed to load my matches');
        setMatches([]);
      } else {
        setMatches((data ?? []) as Match[]);
      }

      setLoading(false);
    }

    load();
  }, []);

  if (loading) return <div style={{ padding: 20, color: 'white' }}>Loading…</div>;

  return (
    <>
      <TopNav />
  
      <main style={{ maxWidth: 768, margin: '0 auto', padding: 16 }}>
        <div style={{ padding: 20, color: 'white' }}>
        <div style={{ marginBottom: 12, opacity: 0.85 }}>
  <Link href="/matches" style={{ color: 'white', textDecoration: 'none' }}>
    ← Back to matches
  </Link>
</div>

  
<h1 style={{ marginBottom: 6 }}>My Matches</h1>
<div style={{ opacity: 0.7, fontSize: 14, marginBottom: 12 }}>
  Games you’ve already joined
</div>

  
          {error && <p style={{ color: 'red', marginTop: 10 }}>Error: {error}</p>}
  
          {matches.length === 0 ? (
            <p style={{ marginTop: 10, opacity: 0.8 }}>
              You haven’t joined any matches yet.
            </p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, marginTop: 10 }}>
            {matches.map((match) => {
              return (
                <li
                key={match.id}
                style={{
                  marginBottom: 12,
                  padding: 14,
                  border: '1px solid #2a2a2a',
                  borderLeft: '4px solid #2d5a2d',
                  background: '#151515',
                  borderRadius: 10,
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 12,
                }}
              >
                {/* LEFT */}
                <div style={{ minWidth: 0 }}>
                  <Link
                  href={`/matches/${match.id}?from=/my-matches`}

                    style={{ color: 'white', textDecoration: 'none', display: 'inline-block' }}
                  >
                    <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.2 }}>
                      {match.title}
                    </div>
                  </Link>
              
                  <div style={{ marginTop: 6, opacity: 0.85, fontSize: 14 }}>
                  {match.location ?? 'Unknown location'} — {formatDateTime(match.time_utc)}
                  </div>
              
                  <div style={{ marginTop: 6, fontSize: 14, opacity: 0.9 }}>
                    Slots: {match.slots_taken}/{match.slots_total}
                  </div>
                </div>
              
                {/* RIGHT */}
                <button
                  disabled
                  style={{
                    padding: '8px 12px',
                    borderRadius: 10,
                    border: '1px solid #2d5a2d',
                    background: '#2d5a2d',
                    color: 'white',
                    cursor: 'not-allowed',
                    opacity: 0.85,
                    whiteSpace: 'nowrap',
                    minWidth: 92,
                    textAlign: 'center',
                    fontWeight: 600,
                  }}
                >
                  Joined
                </button>
              </li>
              
              );
            })}
          </ul>
          
          )}
        </div>
      </main>
    </>
  );
}
