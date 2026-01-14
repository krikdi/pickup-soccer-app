'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  fetchMatchById,
  joinMatch,
  leaveMatch,
  fetchParticipantsByMatchId,
  fetchProfilesByUserIds, 
  ensureProfile,
  supabase,
} from '../../../lib/supabaseClient';

type Match = {
  id: string;
  title: string;
  location: string | null;
  time_utc: string;
  slots_total: number;
  slots_taken: number;
};

export default function MatchPage() {
  function formatDate(iso: string) {
    return new Date(iso).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  const params = useParams<{ id?: string | string[] }>();
  const rawId = params?.id;
  const matchId = Array.isArray(rawId) ? rawId[0] : rawId;
  

  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);
  const [participants, setParticipants] = useState<
  {
    user_id: string;
    joined_at: string;
    profiles?: { display_name: string } | null;
  }[]
>([]);
const [currentUserId, setCurrentUserId] = useState<string | null>(null);

async function refreshParticipants(mid: string) {
  // 1) получаем участников
  const { data: pData, error: pErr } = await fetchParticipantsByMatchId(mid);
  if (pErr) {
    console.warn('[participants] load error', pErr);
    setParticipants([]);
    return;
  }

  const rows = (pData ?? []) as { user_id: string; joined_at: string }[];

  // 2) если пусто — ставим пусто
  if (rows.length === 0) {
    setParticipants([]);
    return;
  }

  // 3) вытаскиваем уникальные user_id
  const ids = Array.from(new Set(rows.map((r) => r.user_id)));

  // 4) тянем профили
  const { data: профили, error: profErr } = await fetchProfilesByUserIds(ids);
  if (profErr) {
    console.warn('[profiles] load error', profErr);
    // профили не пришли — покажем хотя бы uuid
    setParticipants(rows.map((r) => ({ ...r, profiles: null })));
    return;
  }

  const map = new Map(профили.map((p) => [p.id, p.display_name]));

  // 5) склеиваем: rows + profiles.display_name
  setParticipants(
    rows.map((r) => ({
      ...r,
      profiles: { display_name: map.get(r.user_id) ?? '' },
    }))
  );
}

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!matchId) return;

      setError(null);
      setLoading(true);

      try {
        const { data, error } = await fetchMatchById(matchId);
if (cancelled) return;

if (error || !data) {
  setError(error?.message ?? 'Failed to load match');
  setMatch(null);
  return;
}

const m = data as Match;
setMatch(m);

// ✅ load participants list (ОДИН РАЗ) — по m.id
await refreshParticipants(matchId);


        // check joined status
      // check joined status (for this match only)
try {
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;

  setCurrentUserId(user?.id ?? null);

  if (user) {
    await ensureProfile(); // ✅ ШАГ 3 ВОТ ТУТ

    const { data: participant, error: pErr } = await supabase
    .from('participants')
    .select('id')
    .eq('match_id', m.id)
    .eq('user_id', user.id)
    .maybeSingle();
  

    if (pErr) {
      console.warn('[load] participant check error', pErr);
      setJoined(false);
    } else {
      setJoined(!!participant);
    }
  }
} catch (e) {
  console.warn('[load] joined check failed', e);
}

      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message ?? 'Load crashed');
          setMatch(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [matchId]);

  async function handleJoin() {
    if (!match || joining || joined) return;

    setJoining(true);
    setError(null);

    try {
      const { data, error } = await joinMatch(match.id);

      if (error || !data) {
        setError(error?.message ?? 'Failed to join match');
        return;
      }

      setMatch(data as Match);
      setJoined(true);
      const { data: authData } = await supabase.auth.getUser();
setCurrentUserId(authData.user?.id ?? null);

await refreshParticipants(match.id);


    } catch (e: any) {
      console.error('[join] crash', e);
      setError(e?.message ?? 'Join crashed');
    } finally {
      setJoining(false);
    }
  }

  async function handleLeave() {
    if (!match || joining || !joined) return;

    setJoining(true);
    setError(null);

    try {
      const { data, error } = await leaveMatch(match.id);

      if (error || !data) {
        setError(error?.message ?? 'Failed to leave match');
        return;
      }

      setMatch(data as Match);
      setJoined(false);
      const { data: authData } = await supabase.auth.getUser();
setCurrentUserId(authData.user?.id ?? null);

await refreshParticipants(match.id);


    } catch (e: any) {
      console.error('[leave] crash', e);
      setError(e?.message ?? 'Leave crashed');
    } finally {
      setJoining(false);
    }
  }

  return (
    
    <div style={{ padding: 20, color: 'white' }}>
      <Link href="/matches" style={{ color: 'white' }}>
        ← Back to matches
      </Link>

      {loading ? (
        <p style={{ marginTop: 10 }}>Loading…</p>
      ) : error ? (
        <p style={{ marginTop: 10, color: 'red' }}>{error}</p>
      ) : !match ? (
        <p style={{ marginTop: 10, color: 'red' }}>Match not found</p>
      ) : (
        <div style={{ marginTop: 10 }}>
          <h1 style={{ marginBottom: 8 }}>{match.title}</h1>
          <div>{match.location ?? 'Unknown location'}</div>
          <div>{formatDate(match.time_utc)}</div>
          <div style={{ marginTop: 6 }}>
            Slots: {match.slots_taken}/{match.slots_total}
          </div>

          <div style={{ marginTop: 12 }}>
  <div style={{ opacity: 0.8, marginBottom: 6 }}>
    Participants ({participants.length}/{match.slots_total})
  </div>

  {participants.length === 0 ? (
    <div style={{ opacity: 0.7 }}>No participants yet</div>
  ) : (
    <ul style={{ margin: 0, paddingLeft: 18 }}>
      {participants.map((p) => {
        const name =
          p.user_id === currentUserId
      ? 'You'
      : p.profiles?.display_name?.trim() || `${p.user_id.slice(0, 8)}…`;

        return (
          <li key={p.user_id} style={{ marginBottom: 4 }}>
            {name}
          </li>
        );
      })}
    </ul>
  )}
</div>




          {(() => {
            const isFull = match.slots_taken >= match.slots_total;

            return (
              <button
                onClick={joined ? handleLeave : handleJoin}
                disabled={joining || (!joined && isFull)}
                style={{
                  marginTop: 12,
                  padding: '8px 14px',
                  border: '1px solid #444',
                  borderRadius: 6,
                  background: joined ? '#2d5a2d' : '#222',
                  color: 'white',
                  cursor: 'pointer',
                }}
              >
                {joining ? 'Working…' : joined ? 'Leave' : isFull ? 'Full' : 'Join'}
              </button>
            );
          })()}
        </div>
      )}
    </div>
  );
}

