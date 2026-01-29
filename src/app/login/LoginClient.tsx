'use client'

import { useState, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type Step = 'email' | 'code'

export default function LoginClient() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const errorFromUrl = useMemo(() => {
    const e = searchParams.get('error')
    return e ? decodeURIComponent(e) : null
  }, [searchParams])

  async function sendCode() {
    setLoading(true)
    setMsg(null)

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    })

    if (error) {
      setMsg(error.message)
    } else {
      setStep('code')
    }

    setLoading(false)
  }

  async function verifyCode() {
    setLoading(true)
    setMsg(null)

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'email',
    })

    if (error) {
      setMsg(error.message)
    } else {
      router.replace('/matches')
    }

    setLoading(false)
  }

  return (
    <div style={{ padding: 20, color: 'white' }}>
      <h1>Login</h1>

      {errorFromUrl && (
        <p style={{ color: 'red' }}>{errorFromUrl}</p>
      )}

      {step === 'email' && (
        <>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            style={{ padding: 10, width: 320 }}
          />

          <div style={{ marginTop: 10 }}>
            <button onClick={sendCode} disabled={loading || !email}>
              {loading ? 'Sending…' : 'Send code'}
            </button>
          </div>
        </>
      )}

      {step === 'code' && (
        <>
          <p>Enter the 8-digit code from your email:</p>

          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="12345678"
            style={{ padding: 10, width: 200 }}
          />

          <div style={{ marginTop: 10 }}>
            <button onClick={verifyCode} disabled={loading || !code}>
              {loading ? 'Verifying…' : 'Verify'}
            </button>
          </div>
        </>
      )}

      {msg && <p style={{ marginTop: 10 }}>{msg}</p>}
    </div>
  )
}
