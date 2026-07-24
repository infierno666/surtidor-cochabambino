import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LogoutButton from '@/components/LogoutButton'

export default async function Home() {
  const supabase = await createClient()

  const { data: claims } = await supabase.auth.getClaims()
  if (!claims) {
    redirect('/login')
  }

  const { data: inventario, error: errorInventario } = await supabase
    .from('vista_inventario_actual')
    .select('*')
    .order('combustible')

  const { data: resumenHoy, error: errorResumen } = await supabase
    .from('vista_dashboard_hoy')
    .select('*')
    .maybeSingle()

  return (
    <main style={{ padding: 32, fontFamily: 'monospace', color: '#e8edf3', background: '#0e1319', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>⛽ El Surtidor Cochabambino</h1>
        <LogoutButton />
      </div>
      <p>Sesión activa como: {claims.claims.email}</p>

      {(errorInventario || errorResumen) && (
        <p style={{ color: '#ff4d4d' }}>
          Error: {errorInventario?.message || errorResumen?.message}
        </p>
      )}

      <h2 style={{ marginTop: 24 }}>Inventario actual</h2>
      {inventario && inventario.length > 0 ? (
        <table cellPadding={8} style={{ borderCollapse: 'collapse', marginTop: 8 }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #2b3542' }}>
              <th>Combustible</th>
              <th>Volumen</th>
              <th>Capacidad</th>
              <th>%</th>
              <th>Nivel binario</th>
            </tr>
          </thead>
          <tbody>
            {inventario.map((t) => (
              <tr key={t.combustible} style={{ borderBottom: '1px solid #2b3542' }}>
                <td>{t.combustible}</td>
                <td>{t.volumen_actual}</td>
                <td>{t.capacidad_maxima}</td>
                <td>{t.porcentaje}%</td>
                <td>{t.nivel_binario}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p style={{ color: '#8a99ab' }}>Sin datos (o la sesión no tiene permisos suficientes).</p>
      )}

      <h2 style={{ marginTop: 24 }}>Resumen de hoy</h2>
      {resumenHoy && (
        <ul>
          <li>Transacciones: {resumenHoy.transacciones_hoy}</li>
          <li>Combustible vendido: {resumenHoy.combustible_vendido_hoy} L</li>
          <li>Ingresos: Bs {resumenHoy.ingresos_totales_hoy}</li>
        </ul>
      )}
    </main>
  )
}