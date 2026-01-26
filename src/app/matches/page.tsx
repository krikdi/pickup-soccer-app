'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchMatches, joinMatch } from '../../lib/supabaseClient';
import { supabase } from '@/lib/supabaseClient';
import { formatDateTime } from '@/lib/date';
import { fetchMyParticipantMatchIds } from '@/lib/supabaseClient';
import TopNav from '@/components/TopNav';






type Match = {
  id: string;
  title: string;
  location: string | null;
  time_utc: string;
  slots_total: number;
  slots_taken: number;
};

type CardState = 'open' | 'joined' | 'full';

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
      <>
        <TopNav />
        <main style={{ maxWidth: 768, margin: '0 auto', padding: 16 }}>
          <div style={{ padding: 20, color: 'white' }}>
          <h1 style={{ marginBottom: 6 }}>Upcoming Matches</h1>
<div style={{ opacity: 0.7, fontSize: 14, marginBottom: 12 }}>
  Join a game in your area
</div>

    
            {error && (
              <p style={{ color: 'red', marginTop: 10 }}>Error: {error}</p>
            )}
    
            {matches.length === 0 ? (
            <p style={{ opacity: 0.7 }}>
            No upcoming games yet.
          </p>
          
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, marginTop: 10 }}>
                {matches.map(match => {
                  const isFull = match.slots_taken >= match.slots_total;
                  const isJoining = joiningId === match.id;
                  const isJoined = joinedMatchIds.has(match.id);

                  const state: CardState =
                  isFull ? 'full'
                  : isJoined ? 'joined'
                  : 'open';



    
                  return (
                    <li
  key={match.id}
  style={{
    marginBottom: 12,
    padding: 14,
    border: '1px solid #2a2a2a',
    borderLeft: `4px solid ${
      state === 'full' ? '#6b2a2a'
      : state === 'joined' ? '#2d5a2d'
      : '#2a2a2a'
    }`,    
    
    
    background: '#151515',
    borderRadius: 10,
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  }}
>
  {/* LEFT: text */}
  <div style={{ minWidth: 0 }}>
    <Link
      href={`/matches/${match.id}`}
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

  {/* RIGHT: button */}
  <button
    onClick={() => handleJoin(match.id)}
    disabled={state !== 'open' || isJoining}
    style={{
      padding: '8px 12px',
      borderRadius: 10,
      border: `1px solid ${
        state === 'full' ? '#6b2a2a'
        : state === 'joined' ? '#2d5a2d'
        : '#444'
      }`,
      
      
      background:
  state === 'full' ? '#3a1f1f'
  : state === 'joined' ? '#2d5a2d'
  : '#222',



      color: 'white',
      cursor: state !== 'open' || isJoining ? 'not-allowed' : 'pointer',
      opacity: state !== 'open' || isJoining ? 0.85 : 1,
      whiteSpace: 'nowrap',
      minWidth: 92,
      textAlign: 'center',
      fontWeight: 600,
    }}
  >
    {isJoining ? 'Joining…' : state === 'full' ? 'Full' : state === 'joined' ? 'Joined' : 'Join'}


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
  