'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createMatch } from '../../../lib/supabaseClient';

export default function NewMatchPage() {
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [timeUtc, setTimeUtc] = useState('');
  const [slotsTotal, setSlotsTotal] = useState(20);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);

    try {
      const { data, error } = await createMatch({
        title,
        location,
        time_utc: timeUtc,
        slots_total: slotsTotal,
      });

      if (error) {
        setMessage('❌ Ошибка: ' + error.message);
      } else {
        setMessage('✅ Матч успешно создан!');
        // очищаем форму
        setTitle('');
        setLocation('');
        setTimeUtc('');
        setSlotsTotal(20);
      }
    } catch (err: any) {
      setMessage('❌ Неизвестная ошибка: ' + err.message);
    }
  }

  return (
    <div style={{ padding: 20, color: 'white' }}>
      <h1>Create new match</h1>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 400 }}>
        <label>
          Title:
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ width: '100%' }}
            required
          />
        </label>

        <label>
          Location:
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            style={{ width: '100%' }}
            required
          />
        </label>

        <label>
          Time (UTC, YYYY-MM-DD HH:mm):
          <input
            value={timeUtc}
            onChange={(e) => setTimeUtc(e.target.value)}
            style={{ width: '100%' }}
            required
          />
        </label>

        <label>
          Slots total:
          <input
            type="number"
            value={slotsTotal}
            onChange={(e) => setSlotsTotal(Number(e.target.value))}
            style={{ width: '100%' }}
            min={1}
            required
          />
        </label>

        <button type="submit">Create match</button>
      </form>

      {message && (
        <p style={{ marginTop: 20 }}>
          {message}
        </p>
      )}
    </div>
  );
}
