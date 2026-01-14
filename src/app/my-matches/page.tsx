'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase, fetchMyMatches } from '../../lib/supabaseClient';

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
    <div style={{ padding: 20, color: 'white' }}>
      <div style={{ marginBottom: 12 }}>
        <Link href="/matches" style={{ color: 'white', textDecoration: 'underline' }}>
          ← Back to matches
        </Link>
      </div>

      <h1>My Matches</h1>

      {error && <p style={{ color: 'red', marginTop: 10 }}>Error: {error}</p>}

      {matches.length === 0 ? (
        <p style={{ marginTop: 10, opacity: 0.8 }}>You haven’t joined any matches yet.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, marginTop: 10 }}>
          {matches.map(match => (
            <li
              key={match.id}
              style={{
                marginBottom: 12,
                padding: 10,
                border: '1px solid #444',
                borderRadius: 4,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div>
                  <Link
                    href={`/matches/${match.id}`}
                    style={{ color: 'white', textDecoration: 'underline' }}
                  >
                    <strong>{match.title}</strong>
                  </Link>
                </div>
                <div>
                  {match.location ?? 'Unknown location'} — {match.time_utc}
                </div>
                <div>
                  Slots: {match.slots_taken}/{match.slots_total}
                </div>
              </div>

              <span style={{ opacity: 0.8 }}>Joined</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
