'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function TestSupabasePage() {
  const [data, setData] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .limit(5);

      if (error) {
        setError(error.message);
      } else {
        setData(data);
      }
    })();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>Supabase test</h1>

      {error && (
        <>
          <p>❌ Error:</p>
          <pre>{error}</pre>
        </>
      )}

      <p>Data:</p>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
