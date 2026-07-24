import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

// ---------------------------------------------------------------------
// Patrón Singleton (creacional): en el navegador debe existir UNA sola
// instancia del cliente durante toda la vida de la pestaña. La cacheamos
// en una variable de módulo para que llamadas repetidas a createClient()
// devuelvan siempre la misma instancia (evita reconexiones innecesarias
// y múltiples listeners de auth duplicados durante el Fast Refresh).
// ---------------------------------------------------------------------
let browserClient: SupabaseClient | undefined

export function createClient(): SupabaseClient {
  if (!browserClient) {
    browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
    )
  }
  return browserClient
}