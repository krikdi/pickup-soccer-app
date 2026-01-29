'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import TopNav from '@/components/TopNav';
import { createMatch, supabase } from '@/lib/supabaseClient';

export default function NewMatchPage() {
  const router = useRouter();

  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function check() {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user ?? null;

      if (!mounted) return;

      if (!user) {
        router.replace('/login');
        return;
      }

      setCheckingAuth(false);
    }

    check();

    return () => {
      mounted = false;
    };
  }, [router]);

  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [timeLocal, setTimeLocal] = useState(''); // datetime-local
  const [slotsTotal, setSlotsTotal] = useState<number>(20);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!timeLocal) {
      setError('Pick date/time');
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session?.user) {
      setError('You must be logged in to create a match.');
      router.replace('/login');
      return;
    }

    setSaving(true);
    try {
      const utcIso = new Date(timeLocal).toISOString();
      const safeSlots = Number(slotsTotal) || 20;


      const { error } = await createMatch({
        title: title.trim(),
        location: location.trim(),
        time_utc: utcIso,
        slots_total: safeSlots,

        
      });

      if (error) throw error;

      router.push('/matches');
      router.refresh();
    } catch (err: any) {
      setError(err?.message ?? 'Failed to create match');
    } finally {
      setSaving(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    padding: '10px 12px',
    borderRadius: 10,
    border: '1px solid #2a2a2a',
    background: '#151515',
    color: 'white',
    outline: 'none',
  };

  const buttonStyle: React.CSSProperties = {
    padding: '10px 14px',
    borderRadius: 10,
    border: '1px solid #444',
    background: '#222',
    color: 'white',
    cursor: saving ? 'not-allowed' : 'pointer',
    fontWeight: 600,
    opacity: saving ? 0.85 : 1,
  };

  // ✅ No UI flash: while checking auth, show only a loading state
  if (checkingAuth) {
    return <div style={{ padding: 20, color: 'white' }}>Loading…</div>;
  }

  return (
    <>
      <TopNav />

      <main style={{ maxWidth: 768, margin: '0 auto', padding: 16 }}>
        <div style={{ padding: 20, color: 'white' }}>
          <h1 style={{ marginBottom: 12 }}>Create match</h1>

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12, marginTop: 12 }}>
            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ opacity: 0.85 }}>Title</span>
              <input value={title} onChange={(e) => setTitle(e.target.value)} required style={inputStyle} />
            </label>

            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ opacity: 0.85 }}>Location</span>
              <input value={location} onChange={(e) => setLocation(e.target.value)} required style={inputStyle} />
            </label>

            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ opacity: 0.85 }}>Time (local)</span>
              <input
                type="datetime-local"
                value={timeLocal}
                onChange={(e) => setTimeLocal(e.target.value)}
                required
                style={inputStyle}
              />
              <span style={{ fontSize: 12, opacity: 0.7 }}>We’ll save it as UTC.</span>
            </label>

            <label style={{ display: 'grid', gap: 6 }}>
  <span style={{ opacity: 0.85 }}>Slots total</span>

  <select
    value={slotsTotal}
    onChange={(e) => setSlotsTotal(Number(e.target.value))}
    required
    style={inputStyle}
  >
    {Array.from({ length: 39 }, (_, i) => i + 2).map((n) => (
      <option key={n} value={n}>
        {n}
      </option>
    ))}
  </select>

  <span style={{ fontSize: 12, opacity: 0.7 }}>Choose 2–40 players.</span>
</label>


            {error && <div style={{ color: 'red', marginTop: 6 }}>{error}</div>}

            <button type="submit" disabled={saving} style={buttonStyle}>
              {saving ? 'Creating…' : 'Create match'}
            </button>
          </form>
        </div>
      </main>
    </>
  );
}
