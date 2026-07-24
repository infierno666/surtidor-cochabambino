'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LogoutButton() {
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      style={{
        background: 'none',
        border: '1px solid #2b3542',
        color: '#e8edf3',
        borderRadius: 6,
        padding: '6px 12px',
        cursor: 'pointer',
        fontFamily: 'monospace',
        fontSize: '0.8rem',
      }}
    >
      Cerrar sesión
    </button>
  )
}