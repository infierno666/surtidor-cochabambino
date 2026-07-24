'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [modo, setModo] = useState<'login' | 'registro'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nombreCompleto, setNombreCompleto] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setCargando(true)

    const { error } =
      modo === 'login'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: { data: { nombre_completo: nombreCompleto } },
          })

    setCargando(false)

    if (error) {
      setError(error.message)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0e1319',
        color: '#e8edf3',
        fontFamily: 'monospace',
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: 320,
          padding: 24,
          border: '1px solid #2b3542',
          borderRadius: 8,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <h1 style={{ fontSize: '1.1rem', margin: 0 }}>⛽ El Surtidor Cochabambino</h1>
        <p style={{ margin: 0, color: '#8a99ab', fontSize: '0.85rem' }}>
          {modo === 'login' ? 'Inicia sesión' : 'Crea tu cuenta'}
        </p>

        {modo === 'registro' && (
          <input
            type="text"
            placeholder="Nombre completo"
            value={nombreCompleto}
            onChange={(e) => setNombreCompleto(e.target.value)}
            required
            style={inputStyle}
          />
        )}

        <input
          type="email"
          placeholder="correo@ejemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={inputStyle}
        />
        <input
          type="password"
          placeholder="Contraseña (mín. 6 caracteres)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          style={inputStyle}
        />

        {error && <p style={{ color: '#ff4d4d', fontSize: '0.8rem', margin: 0 }}>{error}</p>}

        <button type="submit" disabled={cargando} style={buttonStyle}>
          {cargando ? 'Procesando...' : modo === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
        </button>

        <button
          type="button"
          onClick={() => setModo(modo === 'login' ? 'registro' : 'login')}
          style={{ background: 'none', border: 'none', color: '#46d9c6', cursor: 'pointer', fontSize: '0.8rem' }}
        >
          {modo === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
        </button>
      </form>
    </main>
  )
}

const inputStyle: React.CSSProperties = {
  background: '#181f28',
  border: '1px solid #2b3542',
  borderRadius: 6,
  color: '#e8edf3',
  padding: '8px 10px',
  fontFamily: 'inherit',
  fontSize: '0.85rem',
}

const buttonStyle: React.CSSProperties = {
  background: '#46d9c6',
  color: '#06201d',
  border: 'none',
  borderRadius: 6,
  padding: '10px 12px',
  fontWeight: 600,
  cursor: 'pointer',
}