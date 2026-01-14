'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function sendLink() {
    setLoading(true);
    setMsg(null);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: 'http://localhost:3000/auth/callback',
      },
    });

    if (error) setMsg(error.message);
    else setMsg('Check your email for the login link');

    setLoading(false);
  }

  return (
    <div style={{ padding: 20, color: 'white' }}>
      <h1>Login</h1>
      <input
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="you@example.com"
        style={{ padding: 10, width: 320 }}
      />
      <div style={{ marginTop: 10 }}>
        <button onClick={sendLink} disabled={loading || !email}>
          {loading ? 'Sending…' : 'Send magic link'}
        </button>
      </div>
      {msg && <p style={{ marginTop: 10 }}>{msg}</p>}
    </div>
  );
}
