'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchMatches, joinMatch } from '../../lib/supabaseClient';
import { supabase } from '@/lib/supabaseClient';
import { fetchMyParticipantMatchIds } from '@/lib/supabaseClient';





type Match = {
  id: string;
  title: string;
  location: string | null;
  time_utc: string;
  slots_total: number;
  slots_taken: number;
};

export default function MatchesPage() {
    const [matches, setMatches] = useState<Match[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [joiningId, setJoiningId] = useState<string | null>(null);
    const [user, setUser] = useState<any>(null);
    const [joinedMatchIds, setJoinedMatchIds] = useState<Set<string>>(new Set());


    

  
    useEffect(() => {
      async function load() {
        try {
          const { data: authData } = await supabase.auth.getUser();
setUser(authData.user);

          const { data, error } = await fetchMatches();
          console.log('fetchMatches result:', { data, error });
  
          if (error) {
            console.error('Error loading matches:', error);
            setError(error.message ?? 'Unknown error');
          } else {
            setMatches((data ?? []) as Match[]);
          }
          const { data: joinedIds, error: joinedError } =
        await fetchMyParticipantMatchIds();

      if (joinedError) {
        console.error('Error loading joined matches:', joinedError);
        setError(joinedError.message ?? 'Failed to load joined matches');
      } else {
        setJoinedMatchIds(new Set(joinedIds ?? []));
      }
        } catch (err: any) {
          console.error('Error loading matches:', err);
          setError(err?.message ?? 'Unknown error');
        } finally {
          setLoading(false);
        }
      }
  
      load();
    }, []);
  
    async function handleJoin(matchId: string) {
      if (!user) {
        window.location.href = '/login';
        return;
      }
      
      setJoiningId(matchId);
      setError(null);
  
      try {
        const { data, error } = await joinMatch(matchId);
  
        if (error) {
          console.error('Error joining match:', error);
          setError(error.message ?? 'Failed to join match');
          return;
        }
  
        if (!data) return;

        setJoinedMatchIds(prev => {
          const next = new Set(prev);
          next.add(matchId);
          return next;
        });
  
        // Обновляем этот матч в state
        setMatches(prev =>
          prev.map(m => (m.id === matchId ? (data as Match) : m)),
        );
      } catch (err: any) {
        console.error('Error joining match:', err);
        setError(err?.message ?? 'Failed to join match');
      } finally {
        setJoiningId(null);
      }
    }
  
    if (loading) {
      return <div style={{ padding: 20, color: 'white' }}>Loading…</div>;
    }
  
    return (
      <div style={{ padding: 20, color: 'white' }}>
        <h1>Upcoming Matches</h1>
        <div style={{ marginBottom: 12, display: 'flex', gap: 12, alignItems: 'center' }}>
  <span style={{ opacity: 0.8 }}>
    {user ? `Logged in: ${user.email}` : 'Not logged in'}
  </span>
  <Link
  href="/my-matches"
  style={{ textDecoration: 'underline', color: 'white' }}
>
  My Matches
</Link>


  {user ? (
    <button
      onClick={async () => {
        await supabase.auth.signOut();
        window.location.href = '/login';
      }}
      style={{ padding: '6px 12px' }}
    >
      Logout
    </button>
  ) : (
    <Link href="/login" style={{ textDecoration: 'underline', color: 'white' }}>
      Login
    </Link>
  )}
</div>

  
        {error && (
          <p style={{ color: 'red', marginTop: 10 }}>Error: {error}</p>
        )}
  
        {matches.length === 0 ? (
          <p>No matches found.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, marginTop: 10 }}>
            {matches.map(match => {
              const isFull = match.slots_taken >= match.slots_total;
              const isJoining = joiningId === match.id;
              const isJoined = joinedMatchIds.has(match.id);
  
              return (
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
                      {match.location ?? 'Unknown location'} —{' '}
                      {match.time_utc}
                    </div>
                    <div>
                      Slots: {match.slots_taken}/{match.slots_total}
                    </div>
                  </div>
  
                  <button
                    onClick={() => handleJoin(match.id)}
                    disabled={isFull || isJoining || isJoined}
                    style={{
                      padding: '6px 12px',
                      cursor: isFull ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {isFull
  ? 'Full'
  : isJoined
  ? 'Joined'
  : isJoining
  ? 'Joining…'
  : 'Join'}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    );
  }
  