"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { DollarSign, Droplet, Fuel, AlertOctagon, Cpu } from "lucide-react"

const chartConfig = {
  ventas: {
    label: "Ventas (Bs)",
    color: "var(--primary)",
  },
} satisfies ChartConfig

export default function DashboardPage() {
  const supabase = createClient()

  // Estados dinámicos conectados a la base de datos
  const [kpis, setKpis] = useState({ ingresos: 0, volumen: 0, surtidoresActivos: 0, alertas: 0 })
  const [graficoVentas, setGraficoVentas] = useState<any[]>([])
  const [tanques, setTanques] = useState<any[]>([])
  const [ultimasVentas, setUltimasVentas] = useState<any[]>([])

  const cargarDashboard = async () => {
    // 1. Cargar Vista Consolidada de Reporte Diario (vista_dashboard_hoy)
    const { data: metrics } = await supabase.from("vista_dashboard_hoy").select("*").single()

    // 2. Cargar Surtidores para contar los activos (Nueva tabla maestra)
    const { data: surtidores } = await supabase.from("surtidores").select("estado_operativo")
    const activos = surtidores?.filter((s: any) => s.estado_operativo === 'optimo').length || 0

    // 3. Cargar Alertas Críticas activas
    const { data: alertasData } = await supabase.from("alertas").select("id").eq("resuelta", false)

    if (metrics) {
      setKpis({
        ingresos: Number(metrics.ingresos_totales_hoy || 0),
        volumen: Number(metrics.volumen_total_hoy || 0),
        surtidoresActivos: activos,
        alertas: alertasData?.length || 0
      })
    }

    // 4. Cargar datos reales para los Medidores de Tanques (Telemetría digital)
    const { data: tanquesData } = await supabase.from("tanques").select("*").order("id")
    if (tanquesData) {
      const mapeados = tanquesData.map((t: any) => {
        const porcentaje = Math.round((t.volumen_actual / t.capacidad_maxima) * 100)
        return {
          id: `T${t.id.split('-')[0].substring(0, 1).toUpperCase()}`, // ID corto visual
          tipo: t.combustible,
          nivel: porcentaje,
          bits: t.nivel_binario === 3 ? "11" : t.nivel_binario === 2 ? "10" : t.nivel_binario === 1 ? "01" : "00",
          color: porcentaje > 50 ? "bg-zinc-100" : porcentaje > 20 ? "bg-amber-500" : "bg-destructive",
          textColor: porcentaje > 50 ? "text-zinc-900" : "text-zinc-950"
        }
      })
      setTanques(mapeados)
    }

    // 5. Cargar últimas 5 transacciones (Adaptado a tu tabla y columnas exactas)
    const { data: ventasData } = await supabase
      .from("ventas")
      .select(`
        id, 
        created_at, 
        total, 
        litros, 
        surtidores (codigo_surtidor)
      `)
      .order("created_at", { ascending: false })
      .limit(5)

    if (ventasData) {
      setUltimasVentas(ventasData)
    }

    // 6. Cargar flujo de ventas (Mock de respaldo si la RPC no está lista aún)
    const { data: flujoData, error: errorFlujo } = await supabase.rpc("obtener_flujo_ventas_horas")
    if (flujoData && !errorFlujo) {
      setGraficoVentas(flujoData)
    } else {
      setGraficoVentas([
        { hora: "08:00", ventas: 1200 },
        { hora: "10:00", ventas: 2100 },
        { hora: "12:00", ventas: 3400 },
        { hora: "14:00", ventas: 2800 },
        { hora: "16:00", ventas: 1900 },
        { hora: "18:00", ventas: 2500 },
      ])
    }
  }

  useEffect(() => {
    cargarDashboard()

    // Suscripción en Tiempo Real para todo el panel
    const channel = supabase.channel('dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ventas' }, () => cargarDashboard())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tanques' }, () => cargarDashboard())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alertas' }, () => cargarDashboard())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'surtidores' }, () => cargarDashboard())
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <div className="space-y-6">

      {/* Cabecera */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Panel de Control</h1>
        <p className="text-muted-foreground mt-1">Resumen operativo de la planta en tiempo real.</p>
      </div>

      {/* Grid de KPIs Dinámicos */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card border-border shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ingresos Hoy</CardTitle>
            <DollarSign className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">Bs {kpis.ingresos.toLocaleString('es-BO', { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-emerald-500 font-medium mt-1">Ingresos de transacciones (ALU)</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Volumen Despachado</CardTitle>
            <Droplet className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{kpis.volumen.toLocaleString()} L</div>
            <p className="text-xs text-zinc-500 mt-1">Flujo total extraído de tanques</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Surtidores Activos</CardTitle>
            <Fuel className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{kpis.surtidoresActivos}</div>
            <p className="text-xs text-emerald-500 font-medium mt-1">Terminales en estado óptimo</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Alertas Lógicas</CardTitle>
            <AlertOctagon className={`h-4 w-4 ${kpis.alertas > 0 ? 'text-destructive animate-pulse' : 'text-zinc-500'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{kpis.alertas}</div>
            <p className={`text-xs font-medium mt-1 ${kpis.alertas > 0 ? 'text-destructive' : 'text-zinc-500'}`}>
              {kpis.alertas > 0 ? 'Sensores críticos activados' : 'Sin fallas de compuertas'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">

        {/* Gráfico de Ventas Dinámico */}
        <Card className="lg:col-span-4 bg-card border-border shadow-md">
          <CardHeader>
            <CardTitle>Flujo de Ventas</CardTitle>
            <CardDescription>Distribución de operaciones aritméticas en el tiempo.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="min-h-[250px] w-full mt-4">
              <BarChart accessibilityLayer data={graficoVentas} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis
                  dataKey="hora"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tick={{ fill: 'var(--muted-foreground)' }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: 'var(--muted-foreground)' }}
                />
                <ChartTooltip cursor={{ fill: 'var(--accent)' }} content={<ChartTooltipContent />} />
                <Bar dataKey="ventas" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Medidores de Tanques con Bits de Sensor */}
        <Card className="lg:col-span-3 bg-card border-border shadow-md">
          <CardHeader>
            <CardTitle>Estado de Tanques</CardTitle>
            <CardDescription>Decodificación de sensores binarios (Tiempo Real).</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-around items-end h-[280px] pb-4">
            {tanques.map((t) => (
              <div key={t.id} className="flex flex-col items-center gap-2">
                <div className="w-14 h-40 bg-zinc-950 rounded-md border border-zinc-800 relative overflow-hidden flex items-end justify-center shadow-inner">
                  <div
                    className={`w-full transition-all duration-1000 ease-out ${t.color}`}
                    style={{ height: `${t.nivel}%` }}
                  />
                  <span className={`absolute top-1/2 -translate-y-1/2 text-xs font-bold z-10 ${t.nivel > 50 ? t.textColor : 'text-zinc-100'}`}>
                    {t.nivel}%
                  </span>
                </div>
                <div className="text-center space-y-0.5">
                  <p className="text-xs font-bold text-foreground capitalize">{t.tipo}</p>
                  <div className="flex items-center gap-0.5 justify-center text-[10px] text-zinc-500 font-mono bg-zinc-900 border border-zinc-800 px-1.5 rounded">
                    <Cpu className="w-2.5 h-2.5 text-emerald-500" />
                    <span>S:{t.bits}</span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Tabla de Transacciones Conectada */}
      <Card className="bg-card border-border shadow-md">
        <CardHeader>
          <CardTitle>Últimas Transacciones (ALU)</CardTitle>
          <CardDescription>Historial reciente de despachos completados en la planta.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="w-[120px] text-zinc-400">ID Venta</TableHead>
                <TableHead className="text-zinc-400">Hora</TableHead>
                <TableHead className="text-zinc-400">Surtidor Físico</TableHead>
                <TableHead className="text-right text-zinc-400">Volumen</TableHead>
                <TableHead className="text-right text-zinc-400">Total Validado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ultimasVentas.map((tx) => (
                <TableRow key={tx.id} className="border-border/50 hover:bg-zinc-800/20">
                  <TableCell className="font-mono font-medium text-xs text-zinc-300">
                    {tx.id.split('-')[0].toUpperCase()}
                  </TableCell>
                  <TableCell className="text-zinc-400 text-xs">
                    {new Date(tx.created_at).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })}
                  </TableCell>
                  <TableCell className="font-semibold text-zinc-200">
                    {tx.surtidores?.codigo_surtidor || "Indefinido"}
                  </TableCell>
                  <TableCell className="text-right font-mono text-zinc-300">{tx.litros} L</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-mono">
                      Bs {Number(tx.total).toFixed(2)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

    </div>
  )
}