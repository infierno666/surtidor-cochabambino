"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { ClipboardList, TrendingUp, Archive, Droplet } from "lucide-react"

export default function InventarioPage() {
  const supabase = createClient()
  
  const [inventario, setInventario] = useState<any[]>([])
  const [dashboardHoy, setDashboardHoy] = useState<any>(null)
  const [totales, setTotales] = useState({ capacidad: 0, actual: 0 })

  useEffect(() => {
    const cargarReportes = async () => {
      // 1. Cargar la vista de inventario consolidado
      const { data: invData } = await supabase
        .from("vista_inventario_actual")
        .select("*")
      
      if (invData) {
        setInventario(invData)
        // Calcular totales globales
        const capTotal = invData.reduce((acc, item) => acc + Number(item.capacidad_maxima), 0)
        const actTotal = invData.reduce((acc, item) => acc + Number(item.volumen_actual), 0)
        setTotales({ capacidad: capTotal, actual: actTotal })
      }

      // 2. Cargar la vista de rendimiento diario
      const { data: dashData } = await supabase
        .from("vista_dashboard_hoy")
        .select("*")
        .single()
      
      if (dashData) {
        setDashboardHoy(dashData)
      }
    }

    cargarReportes()
  }, [])

  // Adaptar datos para el gráfico de Recharts
  const chartData = inventario.map(item => ({
    combustible: item.combustible.toUpperCase(),
    volumen: Number(item.volumen_actual),
    capacidad: Number(item.capacidad_maxima),
  }))

  const chartConfig = {
    volumen: {
      label: "Volumen Actual (L)",
      color: "var(--primary)",
    },
  }

  const porcentajeGlobal = totales.capacidad > 0 
    ? ((totales.actual / totales.capacidad) * 100).toFixed(1) 
    : "0.0"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Inventario y Reportes</h1>
        <p className="text-muted-foreground mt-1">Análisis de capacidad instalada y métricas de rendimiento diario.</p>
      </div>

      {/* KPIs de Reporte Rápido */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Volumen Global Actual</CardTitle>
            <Archive className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-100">{totales.actual.toLocaleString()} L</div>
            <p className="text-xs text-zinc-500 mt-1">
              De {totales.capacidad.toLocaleString()} L de capacidad instalada
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Reserva Total</CardTitle>
            <Droplet className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">{porcentajeGlobal}%</div>
            <p className="text-xs text-zinc-500 mt-1">
              Nivel de abastecimiento general
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Despachos (Hoy)</CardTitle>
            <TrendingUp className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-100">
              {dashboardHoy?.transacciones_hoy || 0}
            </div>
            <p className="text-xs text-emerald-500 mt-1">
              Bs. {dashboardHoy?.ingresos_totales_hoy?.toLocaleString() || "0.00"} generados
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Gráfico de Barras: Inventario */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Niveles de Abastecimiento</CardTitle>
            <CardDescription>Comparativa de volumen actual vs capacidad máxima por tanque.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
              <BarChart accessibilityLayer data={chartData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis 
                  dataKey="combustible" 
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
                <Bar dataKey="volumen" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Tabla Detallada */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-emerald-500" />
              Desglose de Inventario Físico
            </CardTitle>
            <CardDescription>Métricas exactas derivadas de la base de datos.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-border/50">
                  <TableHead className="text-zinc-400">Producto</TableHead>
                  <TableHead className="text-right text-zinc-400">Vol. Actual (L)</TableHead>
                  <TableHead className="text-right text-zinc-400">Capacidad (L)</TableHead>
                  <TableHead className="text-right text-zinc-400">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventario.map((item, i) => (
                  <TableRow key={i} className="border-border/50 hover:bg-zinc-800/20">
                    <TableCell className="font-medium text-zinc-100 capitalize">
                      {item.combustible}
                    </TableCell>
                    <TableCell className="text-right font-mono text-zinc-300">
                      {Number(item.volumen_actual).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-mono text-zinc-500">
                      {Number(item.capacidad_maxima).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge 
                        variant="outline" 
                        className={
                          Number(item.porcentaje) > 25 
                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                            : "bg-destructive/10 text-destructive border-destructive/20"
                        }
                      >
                        {item.porcentaje}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}