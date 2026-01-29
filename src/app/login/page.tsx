import { Suspense } from 'react'
import LoginClient from './LoginClient'

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ padding: 20, color: 'white' }}>Loading…</div>}>
      <LoginClient />
    </Suspense>
  )
}
