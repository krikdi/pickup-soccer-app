// src/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function fetchMatches(): Promise<{
  data: Match[] | null;
  error: any;
}> {
  console.log("FETCH_MATCHES_CALLED ✅");

  const { data, error } = await supabase
    .from("matches")
    .select("*")
    .order("time_utc", { ascending: true });

  console.log("FETCH_MATCHES_RAW ✅", { data, error });

  if (error) {
    console.error("Supabase error in fetchMatches:", error);
  }

  return { data: data as Match[] | null, error };
}

export type Match = {
  id: string;
  title: string;
  location: string | null;
  time_utc: string;
  slots_total: number;
  slots_taken: number;
  created_at: string;
};

type NewMatchInput = {
  title: string;
  location: string;
  time_utc: string;
  slots_total: number;
};

export async function createMatch(match: {
  title: string;
  location: string;
  time_utc: string;
  slots_total: number;
}) {
  const { data, error } = await supabase
    .from('matches')
    .insert([
      {
        title: match.title,
        location: match.location,
        time_utc: match.time_utc,
        slots_total: match.slots_total,
        slots_taken: 0,
      },
    ])
    .select('*')
    .single();

  return { data, error };
}

export async function joinMatch(matchId: string) {
  // ВАЖНО: имя параметра должно быть p_match_id (как в SQL функции)
  return await supabase.rpc("join_match", {
    p_match_id: matchId,
  });
}
export async function leaveMatch(matchId: string) {
  return supabase.rpc('leave_match', { p_match_id: matchId });
}


export async function fetchMatchById(matchId: string) {
  if (!matchId) {
    console.error('fetchMatchById called with empty matchId');
    return { data: null, error: { message: 'Invalid match id' } };
  }

  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('id', matchId)
    .single();

  if (error) {
    console.error('Supabase error in fetchMatchById:', error);
  }

  return { data, error };
}
export async function fetchMyParticipantMatchIds() {
  const { data: authData, error: authErr } = await supabase.auth.getUser();
  if (authErr) return { data: null, error: authErr };

  const user = authData?.user;
  if (!user) return { data: [], error: null };

  const { data, error } = await supabase
    .from('participants')
    .select('match_id')
    .eq('user_id', user.id);

  if (error) return { data: null, error };

  // вернём массив match_id строками
  return { data: (data ?? []).map((r: any) => r.match_id), error: null };
}
export async function fetchMyMatches(userId: string) {
  if (!userId) return { data: [], error: null };

  const { data, error } = await supabase
    .from('participants')
    .select(
      `
      match_id,
      matches (
        id,
        title,
        location,
        time_utc,
        slots_total,
        slots_taken
      )
    `,
    )
    .eq('user_id', userId);

  if (error) return { data: [], error };

  // participants[] -> Match[]
  const matches = (data ?? [])
    .map((row: any) => row.matches)
    .filter(Boolean);

  return { data: matches, error: null };
}
export async function fetchParticipantsByMatchId(matchId: string) {
  if (!matchId) return { data: null, error: { message: 'Missing matchId' } as any };

  const { data, error } = await supabase
    .from('participants')
    .select('user_id, joined_at')
    .eq('match_id', matchId)
    .order('joined_at', { ascending: true });

  return { data, error };
}



export async function ensureProfile() {
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;
  if (!user) return;

  const displayName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split('@')[0] ||
    'Player';

  await supabase
    .from('profiles')
    .upsert(
      { id: user.id, display_name: displayName },
      { onConflict: 'id' }
    );
}
export async function fetchProfilesByUserIds(userIds: string[]) {
  if (!userIds.length) return { data: [], error: null };

  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name')
    .in('id', userIds);

  return { data: data ?? [], error };
}







