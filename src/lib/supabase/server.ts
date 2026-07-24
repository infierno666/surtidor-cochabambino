import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// ---------------------------------------------------------------------
// A propósito NO es un Singleton: cada request de servidor necesita su
// propia instancia atada a las cookies de ESA request (si se compartiera
// una sola instancia global entre requests, se mezclarían sesiones entre
// usuarios distintos). El Singleton real del proyecto vive en client.ts,
// donde sí es seguro reutilizar una única instancia.
// ---------------------------------------------------------------------
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Se llamó desde un Server Component (no puede escribir cookies).
            // No pasa nada: el proxy.ts se encarga de refrescar la sesión.
          }
        },
      },
    }
  )
}