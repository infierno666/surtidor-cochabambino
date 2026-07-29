"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { jsPDF } from "jspdf"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import { ClipboardList, TrendingUp, Archive, Droplet, Download, FileText } from "lucide-react"
import { toast } from "sonner"

// Helper para colores dinámicos
const getCombustibleColor = (nombre: string) => {
  const comb = nombre.toLowerCase();
  if (comb.includes("especial")) return "#34d399"; // emerald-400
  if (comb.includes("premium")) return "#fbbf24";  // amber-400
  if (comb.includes("diesel")) return "#fb923c";   // orange-400
  if (comb.includes("gnv")) return "#60a5fa";      // blue-400
  return "#a1a1aa"; // zinc-400
}

const getEstiloCombustible = (nombre: string) => {
  const comb = nombre.toLowerCase();
  if (comb.includes("especial")) return "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
  if (comb.includes("premium")) return "text-amber-400 border-amber-500/30 bg-amber-500/10";
  if (comb.includes("diesel")) return "text-orange-400 border-orange-500/30 bg-orange-500/10";
  if (comb.includes("gnv")) return "text-blue-400 border-blue-500/30 bg-blue-500/10";
  return "text-zinc-400 border-zinc-700 bg-zinc-800/50";
}

export default function InventarioPage() {
  const supabase = createClient()

  const [inventario, setInventario] = useState<any[]>([])
  const [dashboardHoy, setDashboardHoy] = useState<any>(null)
  const [totales, setTotales] = useState({ capacidad: 0, actual: 0 })
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    const cargarReportes = async () => {
      // 1. Cargar vista de inventario consolidado[cite: 3]
      const { data: invData } = await supabase
        .from("vista_inventario_actual")
        .select("*")

      if (invData) {
        setInventario(invData)
        // Calcular totales globales[cite: 3]
        const capTotal = invData.reduce((acc, item) => acc + Number(item.capacidad_maxima), 0)
        const actTotal = invData.reduce((acc, item) => acc + Number(item.volumen_actual), 0)
        setTotales({ capacidad: capTotal, actual: actTotal })
      }

      // 2. Cargar métricas diarias[cite: 3]
      const { data: dashData } = await supabase
        .from("vista_dashboard_hoy")
        .select("*")
        .single()

      if (dashData) {
        setDashboardHoy(dashData)
      }
    }

    cargarReportes()

    // Suscripción Realtime para mantener el dashboard vivo
    const channel = supabase.channel('inventario-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tanques' }, () => cargarReportes())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ventas' }, () => cargarReportes())
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Adaptar datos para el gráfico inyectando el color exacto[cite: 3]
  const chartData = inventario.map(item => ({
    combustible: item.combustible.toUpperCase(),
    volumen: Number(item.volumen_actual),
    capacidad: Number(item.capacidad_maxima),
    color: getCombustibleColor(item.combustible)
  }))

  const chartConfig = {
    volumen: {
      label: "Volumen (L)",
      color: "var(--primary)",
    },
  }

  const porcentajeGlobal = totales.capacidad > 0
    ? ((totales.actual / totales.capacidad) * 100).toFixed(1)
    : "0.0"

  // ==========================================
  // GENERACIÓN DEL REPORTE PDF
  // ==========================================
  const exportarReportePDF = () => {
    try {
      setIsExporting(true)
      const doc = new jsPDF()

      // Cabecera Corporativa
      doc.setFont("helvetica", "bold")
      doc.setFontSize(16)
      doc.text("REPORTE DE INVENTARIO Y ABASTECIMIENTO", 105, 20, { align: "center" })

      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      doc.text("Estación de Servicio - Cochabamba, Bolivia", 105, 26, { align: "center" })
      doc.text(`Fecha de Emisión: ${new Date().toLocaleString('es-BO')}`, 105, 32, { align: "center" })

      doc.line(15, 38, 195, 38)

      // Sección 1: Métricas Globales
      doc.setFont("helvetica", "bold")
      doc.text("1. RESUMEN GLOBAL DE PLANTA", 15, 48)
      doc.setFont("helvetica", "normal")
      doc.text(`Capacidad Total Instalada: ${totales.capacidad.toLocaleString()} Litros`, 20, 56)
      doc.text(`Volumen Actual en Reserva: ${totales.actual.toLocaleString()} Litros`, 20, 63)
      doc.text(`Nivel de Abastecimiento: ${porcentajeGlobal}%`, 20, 70)
      doc.text(`Despachos Registrados Hoy: ${dashboardHoy?.transacciones_hoy || 0} transacciones`, 120, 56)
      doc.text(`Ingresos Estimados Hoy: Bs ${dashboardHoy?.ingresos_totales_hoy?.toLocaleString() || "0.00"}`, 120, 63)

      // Sección 2: Tabla de Detalles
      doc.setFont("helvetica", "bold")
      doc.text("2. DESGLOSE FÍSICO POR DEPÓSITO", 15, 85)

      // Cabecera de Tabla
      doc.setFillColor(240, 240, 240)
      doc.rect(15, 90, 180, 8, "F")
      doc.setFontSize(9)
      doc.text("TIPO DE COMBUSTIBLE", 20, 95.5)
      doc.text("VOL. ACTUAL", 85, 95.5)
      doc.text("CAPACIDAD MAX.", 125, 95.5)
      doc.text("ESTADO (%)", 170, 95.5)

      doc.setFont("helvetica", "normal")
      let startY = 105

      // Filas de Tabla
      inventario.forEach((item, index) => {
        doc.text(item.combustible.toUpperCase(), 20, startY)
        doc.text(`${Number(item.volumen_actual).toLocaleString()} L`, 85, startY)
        doc.text(`${Number(item.capacidad_maxima).toLocaleString()} L`, 125, startY)
        doc.text(`${item.porcentaje}%`, 175, startY)

        doc.line(15, startY + 3, 195, startY + 3)
        startY += 10
      })

      // Pie de Página
      doc.setFontSize(8)
      doc.setFont("helvetica", "italic")
      doc.text("Documento generado automáticamente por el Sistema de Telemetría.", 105, 280, { align: "center" })

      // Exportar
      doc.save(`Reporte_Inventario_${new Date().toISOString().split('T')[0]}.pdf`)
      toast.success("Reporte PDF generado exitosamente.")
    } catch (error) {
      toast.error("Hubo un error al generar el PDF.")
      console.error(error)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Inventario y Reportes</h1>
          <p className="text-muted-foreground mt-1">Análisis de capacidad instalada y métricas de rendimiento diario[cite: 3].</p>
        </div>

        <Button
          onClick={exportarReportePDF}
          disabled={isExporting || inventario.length === 0}
          className="bg-emerald-500 text-zinc-950 hover:bg-emerald-400 font-bold shadow-lg shadow-emerald-500/20"
        >
          <Download className="w-4 h-4 mr-2" />
          Exportar Auditoría (PDF)
        </Button>
      </div>

      {/* ================= KPIs DE REPORTE ================= */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-zinc-950 border-zinc-800 shadow-xl overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Archive className="w-24 h-24" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between pb-2 z-10 relative">
            <CardTitle className="text-sm font-medium text-zinc-400">Volumen Global Actual</CardTitle>
            <Archive className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent className="z-10 relative">
            <div className="text-3xl font-bold text-zinc-100 font-mono tracking-tight">{totales.actual.toLocaleString()} L</div>
            <p className="text-xs text-zinc-500 mt-1">
              De {totales.capacidad.toLocaleString()} L de capacidad instalada[cite: 3]
            </p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-950 border-zinc-800 shadow-xl overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Droplet className="w-24 h-24" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between pb-2 z-10 relative">
            <CardTitle className="text-sm font-medium text-zinc-400">Reserva Total</CardTitle>
            <Droplet className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent className="z-10 relative">
            <div className="text-3xl font-bold text-emerald-400 font-mono tracking-tight">{porcentajeGlobal}%</div>
            <p className="text-xs text-zinc-500 mt-1">
              Nivel de abastecimiento general[cite: 3]
            </p>
            {/* Barra de progreso visual */}
            <div className="w-full h-1 bg-zinc-900 rounded-full mt-3 overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${porcentajeGlobal}%` }} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-950 border-zinc-800 shadow-xl overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <TrendingUp className="w-24 h-24" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between pb-2 z-10 relative">
            <CardTitle className="text-sm font-medium text-zinc-400">Despachos (Hoy)</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent className="z-10 relative">
            <div className="text-3xl font-bold text-zinc-100 font-mono tracking-tight">
              {dashboardHoy?.transacciones_hoy || 0} <span className="text-base text-zinc-500 font-normal">Tx</span>
            </div>
            <p className="text-xs text-emerald-500 mt-1 font-medium bg-emerald-500/10 inline-block px-2 py-0.5 rounded">
              Bs. {dashboardHoy?.ingresos_totales_hoy?.toLocaleString() || "0.00"} procesados[cite: 3]
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ================= GRÁFICO INTELIGENTE ================= */}
        <Card className="bg-card border-border shadow-xl">
          <CardHeader className="border-b border-zinc-800/50 pb-4">
            <CardTitle className="text-lg">Niveles de Abastecimiento</CardTitle>
            <CardDescription>Comparativa de volumen actual vs capacidad máxima por tanque[cite: 3].</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
              <BarChart accessibilityLayer data={chartData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" opacity={0.5} />
                <XAxis
                  dataKey="combustible"
                  tickLine={false}
                  tickMargin={15}
                  axisLine={false}
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 12, fontWeight: 600 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                  tickFormatter={(value) => `${value / 1000}k`}
                />
                {/* Tooltip con efecto blur para mejor UX */}
                <Tooltip
                  cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-zinc-950/80 backdrop-blur-md border border-zinc-800 p-3 rounded-lg shadow-xl">
                          <p className="font-bold text-zinc-100 mb-1">{data.combustible}</p>
                          <p className="text-sm font-mono text-zinc-300">Vol: <span style={{ color: data.color }}>{data.volumen.toLocaleString()} L</span></p>
                          <p className="text-sm font-mono text-zinc-500">Max: {data.capacidad.toLocaleString()} L</p>
                        </div>
                      )
                    }
                    return null;
                  }}
                />
                <Bar dataKey="volumen" radius={[6, 6, 0, 0]} maxBarSize={60}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* ================= TABLA DE DESGLOSE ================= */}
        <Card className="bg-card border-border shadow-xl">
          <CardHeader className="border-b border-zinc-800/50 pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ClipboardList className="h-5 w-5 text-emerald-500" />
              Desglose de Inventario Físico
            </CardTitle>
            <CardDescription>Métricas exactas derivadas de la base de datos[cite: 3].</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 p-0 sm:p-6">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="text-zinc-400">Producto</TableHead>
                  <TableHead className="text-right text-zinc-400">Vol. Actual (L)</TableHead>
                  <TableHead className="text-right text-zinc-400 hidden sm:table-cell">Capacidad (L)</TableHead>
                  <TableHead className="text-right text-zinc-400">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventario.map((item, i) => {
                  const badgeStyle = getEstiloCombustible(item.combustible);
                  const isCritico = Number(item.porcentaje) < 20;

                  return (
                    <TableRow key={i} className="border-border/50 hover:bg-zinc-800/20 transition-colors">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${isCritico ? 'bg-destructive animate-pulse' : 'bg-emerald-500'}`} />
                          <span className="text-zinc-100 capitalize">{item.combustible}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-zinc-200">
                        {Number(item.volumen_actual).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono text-zinc-500 hidden sm:table-cell">
                        {Number(item.capacidad_maxima).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant="outline"
                          className={`font-mono font-bold px-2 py-0.5 ${isCritico ? 'bg-destructive/10 text-destructive border-destructive/30' : badgeStyle}`}
                        >
                          {item.porcentaje}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {inventario.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-zinc-500 h-32">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <FileText className="w-6 h-6 opacity-50" />
                        <span>Cargando datos de telemetría...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}