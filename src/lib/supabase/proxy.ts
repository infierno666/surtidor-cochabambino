import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Refresca el token de Auth en cada request y lo propaga tanto a los
// Server Components (via request.cookies) como al navegador (via
// response.cookies), tal como recomienda la guía oficial de Supabase.
// Hoy el proyecto no usa Auth todavía (RLS abierto para la fase
// académica), pero dejarlo listo evita re-trabajo cuando se agregue login.
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Valida el JWT localmente (WebCrypto + JWKS cacheado) y refresca si hace falta.
  await supabase.auth.getClaims()

  return supabaseResponse
}