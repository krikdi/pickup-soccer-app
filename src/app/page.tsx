import Link from 'next/link';

export default function HomePage() {
  return (
    <div style={{ padding: 24, color: 'white' }}>
      <h1>Pickup Soccer MVP</h1>

      <ul style={{ marginTop: 20 }}>
        <li>
          <Link href="/matches">⚽ View matches</Link>
        </li>
        <li style={{ marginTop: 10 }}>
          <Link href="/matches/new">➕ Create new match</Link>
        </li>
      </ul>
    </div>
  );
}
