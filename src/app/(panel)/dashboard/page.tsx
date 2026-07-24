"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { DollarSign, Droplet, Fuel, AlertOctagon } from "lucide-react"

// --- Mock Data ---
const chartData = [
  { hora: "08:00", ventas: 1200 },
  { hora: "10:00", ventas: 2100 },
  { hora: "12:00", ventas: 3400 },
  { hora: "14:00", ventas: 2800 },
  { hora: "16:00", ventas: 1900 },
  { hora: "18:00", ventas: 2500 },
]

const chartConfig = {
  ventas: {
    label: "Ventas (Bs)",
    color: "var(--primary)", // Usa el zinc-100 configurado en globales
  },
} satisfies ChartConfig

const tanques = [
  { id: "T1", tipo: "Especial", nivel: 75, color: "bg-zinc-100", textColor: "text-zinc-900" },
  { id: "T2", tipo: "Premium", nivel: 30, color: "bg-zinc-100", textColor: "text-zinc-900" },
  { id: "T3", tipo: "Diésel", nivel: 90, color: "bg-zinc-100", textColor: "text-zinc-900" },
  { id: "T4", tipo: "GNV", nivel: 12, color: "bg-amber-500", textColor: "text-amber-950" }, // Alerta Preventiva
]

const transacciones = [
  { id: "V-1029", cliente: "Juan Pérez", bomba: "Bomba 1", monto: "Bs 150.00", estado: "Completado" },
  { id: "V-1028", cliente: "Empresa de Taxis S.R.L.", bomba: "Bomba 3", monto: "Bs 420.00", estado: "Completado" },
  { id: "V-1027", cliente: "María Gómez", bomba: "Bomba 2", monto: "Bs 85.00", estado: "Completado" },
  { id: "V-1026", cliente: "Cliente Anónimo", bomba: "Bomba 4", monto: "Bs 120.00", estado: "Completado" },
]

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      
      {/* Cabecera */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Panel de Control</h1>
        <p className="text-muted-foreground mt-1">Resumen operativo del surtidor en tiempo real.</p>
      </div>

      {/* Grid de KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ingresos Hoy</CardTitle>
            <DollarSign className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">Bs 12,450.00</div>
            <p className="text-xs text-emerald-500 font-medium mt-1">+14% desde ayer</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Volumen Despachado</CardTitle>
            <Droplet className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">3,450 L</div>
            <p className="text-xs text-zinc-500 mt-1">Total de todos los combustibles</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Bombas Activas</CardTitle>
            <Fuel className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">4 / 4</div>
            <p className="text-xs text-emerald-500 font-medium mt-1">Operatividad óptima</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Alertas de Nivel</CardTitle>
            <AlertOctagon className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">1</div>
            <p className="text-xs text-amber-500 font-medium mt-1">Revisar tanque GNV</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        
        {/* Gráfico de Ventas */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Flujo de Ventas</CardTitle>
            <CardDescription>Ingresos generados durante el turno actual.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="min-h-[250px] w-full mt-4">
              <BarChart accessibilityLayer data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                  tickFormatter={(value) => `${value}`} 
                />
                <ChartTooltip cursor={{ fill: 'var(--accent)' }} content={<ChartTooltipContent />} />
                <Bar dataKey="ventas" fill="var(--color-ventas)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Medidores de Tanques */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Estado de Tanques</CardTitle>
            <CardDescription>Niveles en tiempo real (Sensores Binarios).</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-around items-end h-[280px] pb-4">
            {tanques.map((t) => (
              <div key={t.id} className="flex flex-col items-center gap-3">
                <div className="w-16 h-48 bg-zinc-900 rounded-md border border-border relative overflow-hidden flex items-end justify-center shadow-inner">
                  {/* Barra de llenado */}
                  <div 
                    className={`w-full transition-all duration-1000 ease-out ${t.color}`} 
                    style={{ height: `${t.nivel}%` }} 
                  />
                  {/* Porcentaje en el centro */}
                  <span className={`absolute top-1/2 -translate-y-1/2 text-sm font-bold z-10 ${t.nivel > 50 ? t.textColor : 'text-zinc-100'}`}>
                    {t.nivel}%
                  </span>
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-foreground">{t.id}</p>
                  <p className="text-xs text-muted-foreground">{t.tipo}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Tabla de Transacciones */}
      <Card>
        <CardHeader>
          <CardTitle>Últimas Transacciones</CardTitle>
          <CardDescription>Despachos completados en las últimas horas.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="w-[100px] text-zinc-400">Factura</TableHead>
                <TableHead className="text-zinc-400">Cliente</TableHead>
                <TableHead className="text-zinc-400">Origen</TableHead>
                <TableHead className="text-right text-zinc-400">Monto</TableHead>
                <TableHead className="text-right text-zinc-400">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transacciones.map((tx) => (
                <TableRow key={tx.id} className="border-border/50 hover:bg-zinc-800/20">
                  <TableCell className="font-mono font-medium">{tx.id}</TableCell>
                  <TableCell>{tx.cliente}</TableCell>
                  <TableCell>{tx.bomba}</TableCell>
                  <TableCell className="text-right font-medium">{tx.monto}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/10 hover:text-emerald-500">
                      {tx.estado}
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