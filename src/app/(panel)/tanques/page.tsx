"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter, } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Droplet, AlertOctagon, Activity, Cpu, Database, CheckCircle2 } from "lucide-react"

export default function TanquesPage() {
  const supabase = createClient()

  const [tanques, setTanques] = useState<any[]>([])
  const [alertas, setAlertas] = useState<any[]>([])

  // Función para cargar los datos iniciales de la base de datos[cite: 3]
  const cargarDatos = async () => {
    const { data: tanquesData } = await supabase.from("tanques").select("*").order("codigo_binario")
    const { data: alertasData } = await supabase
      .from("alertas")
      .select("*, tanques(combustible)")
      .eq("resuelta", false)
      .order("created_at", { ascending: false })

    setTanques(tanquesData || [])
    setAlertas(alertasData || [])
  }

  useEffect(() => {
    cargarDatos()

    // Suscripción en Tiempo Real (Supabase Realtime) para mantener la UI viva[cite: 3]
    const channel = supabase.channel('monitor-tanques')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tanques' }, () => {
        cargarDatos()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alertas' }, () => {
        cargarDatos()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Helpers para la UI basados en la lógica digital del hardware[cite: 3]
  const getSensorBits = (nivel: number) => {
    return nivel.toString(2).padStart(2, '0')
  }

  const getUIColors = (nivel: number) => {
    if (nivel === 0) return { fill: "bg-destructive", bg: "bg-destructive/10", border: "border-destructive/30", text: "text-destructive", led: "LED ROJO (Crítico)" }
    if (nivel === 1) return { fill: "bg-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-500", led: "LED AMARILLO (Bajo)" }
    if (nivel === 2) return { fill: "bg-zinc-400", bg: "bg-zinc-800/50", border: "border-zinc-700", text: "text-zinc-300", led: "Apagado (Medio)" }
    return { fill: "bg-zinc-100", bg: "bg-emerald-500/5", border: "border-emerald-500/20", text: "text-emerald-500", led: "Apagado (Lleno)" }
  }

  return (
    <div className="space-y-6">

      {/* Cabecera del Módulo */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Monitor de Tanques</h1>
          <p className="text-muted-foreground mt-1">Telemetría de sensores, niveles binarios y estado de hardware en depósitos.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-zinc-400 border border-zinc-800 bg-zinc-950 px-4 py-2 rounded-full shadow-inner">
          <Activity className="h-4 w-4 animate-pulse text-emerald-500" />
          <span className="font-medium">Realtime Sync Activo</span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Sensores Físicos (Tanques con diseño Cilíndrico Premium) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            {tanques.map((tanque) => {
              const porcentaje = Math.round((tanque.volumen_actual / tanque.capacidad_maxima) * 100)
              const ui = getUIColors(tanque.nivel_binario)

              return (
                <Card key={tanque.id} className={`border ${ui.border} bg-card overflow-hidden shadow-lg`}>
                  <CardHeader className={`${ui.bg} pb-4 border-b ${ui.border}`}>
                    <CardTitle className="flex justify-between items-center text-xl capitalize text-zinc-100">
                      <span className="flex items-center gap-2"><Database className="w-5 h-5 text-zinc-400" /> {tanque.combustible}</span>
                      <Badge variant="outline" className={`${ui.text} border-current bg-background/80 font-mono px-2 py-0.5 text-sm`}>
                        {getSensorBits(tanque.nivel_binario)}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 pb-2">
                    <div className="flex items-center gap-6">
                      {/* Representación visual cilíndrica del tanque */}
                      <div className="w-16 h-40 bg-zinc-950 rounded-lg border border-zinc-800 relative overflow-hidden flex items-end shadow-inner shrink-0">
                        <div
                          className={`w-full transition-all duration-1000 ease-out ${ui.fill}`}
                          style={{ height: `${porcentaje}%` }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                      </div>

                      {/* Datos del volumen y telemetría */}
                      <div className="flex-1 space-y-4">
                        <div>
                          <p className="text-sm text-zinc-500 font-medium mb-1">Volumen Disponible</p>
                          <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-zinc-100">{tanque.volumen_actual.toLocaleString()}</span>
                            <span className="text-sm text-zinc-500 font-mono">/ {tanque.capacidad_maxima.toLocaleString()} L</span>
                          </div>
                        </div>

                        <div className="space-y-2 pt-2 border-t border-zinc-800/60">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-zinc-500">Capacidad Relativa:</span>
                            <span className="font-mono text-zinc-300 font-bold">{porcentaje}%</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-zinc-500 flex items-center gap-1"><Cpu className="w-3 h-3" /> Estado LED:</span>
                            <span className={`font-mono font-bold ${ui.text}`}>{ui.led}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Tabla de Alertas Activas[cite: 3] */}
          <Card className={`border-zinc-800 bg-card ${alertas.length > 0 ? 'shadow-[0_0_15px_rgba(220,38,38,0.1)] border-destructive/30' : ''}`}>
            <CardHeader className="pb-3">
              <CardTitle className={`flex items-center gap-2 ${alertas.length > 0 ? 'text-destructive' : 'text-zinc-300'}`}>
                <AlertOctagon className="h-5 w-5" />
                Registro de Alertas de Hardware
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="text-zinc-500 w-[150px]">Fecha / Hora</TableHead>
                    <TableHead className="text-zinc-500 w-[120px]">Origen</TableHead>
                    <TableHead className="text-zinc-500 w-[120px]">Señal Física</TableHead>
                    <TableHead className="text-zinc-500">Diagnóstico del Sensor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alertas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-emerald-500 h-24 border-b-0">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <CheckCircle2 className="w-6 h-6 opacity-80" />
                          <span>No hay alertas activas. Sistema operando en parámetros normales.</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    alertas.map((alerta) => (
                      <TableRow key={alerta.id} className="border-border/50 bg-destructive/5 hover:bg-destructive/10 transition-colors">
                        <TableCell className="text-zinc-400 text-xs font-mono">
                          {new Date(alerta.created_at).toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' })}
                        </TableCell>
                        <TableCell className="capitalize font-medium text-zinc-200">
                          {alerta.tanques?.combustible}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={alerta.tipo === 'LED_ROJO' ? 'bg-destructive/10 text-destructive border-destructive/30 font-mono text-[10px]' : 'bg-amber-500/10 text-amber-500 border-amber-500/30 font-mono text-[10px]'}>
                            {alerta.tipo}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-zinc-300 text-sm">{alerta.mensaje}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Lógica Digital (Sistemas Digitales - Decodificador)[cite: 3] */}
        <div className="space-y-6">
          <Card className="bg-zinc-950 border-zinc-800 shadow-xl sticky top-6">
            <CardHeader className="border-b border-zinc-900 pb-4">
              <CardTitle className="flex items-center gap-2 text-zinc-100">
                <Cpu className="h-5 w-5 text-emerald-500" />
                Lógica del Decodificador
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Tabla de verdad de los sensores de nivel[cite: 3].
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">

              {/* Tabla de Verdad[cite: 3] */}
              <div className="rounded-lg border border-zinc-800 overflow-hidden bg-zinc-900/50">
                <Table>
                  <TableHeader className="bg-zinc-900">
                    <TableRow className="border-zinc-800 hover:bg-transparent">
                      <TableHead className="text-center text-zinc-400 text-xs uppercase tracking-wider" colSpan={2}>Entradas (Sensores)</TableHead>
                      <TableHead className="text-center text-zinc-400 text-xs uppercase tracking-wider" colSpan={2}>Salidas (LEDs)</TableHead>
                    </TableRow>
                    <TableRow className="border-zinc-800 hover:bg-transparent">
                      <TableHead className="text-center w-1/4 text-zinc-300 font-mono">S1</TableHead>
                      <TableHead className="text-center w-1/4 text-zinc-300 font-mono">S0</TableHead>
                      <TableHead className="text-center w-1/4 text-destructive font-mono">ROJO</TableHead>
                      <TableHead className="text-center w-1/4 text-amber-500 font-mono">AMAR</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="text-center font-mono text-sm">
                    <TableRow className="border-zinc-800/50 text-destructive bg-destructive/10 hover:bg-destructive/20">
                      <TableCell>0</TableCell><TableCell>0</TableCell>
                      <TableCell className="font-bold">1</TableCell><TableCell>0</TableCell>
                    </TableRow>
                    <TableRow className="border-zinc-800/50 text-amber-500 bg-amber-500/10 hover:bg-amber-500/20">
                      <TableCell>0</TableCell><TableCell>1</TableCell>
                      <TableCell>0</TableCell><TableCell className="font-bold">1</TableCell>
                    </TableRow>
                    <TableRow className="border-zinc-800/50 text-zinc-500 hover:bg-zinc-800/50">
                      <TableCell>1</TableCell><TableCell>0</TableCell>
                      <TableCell>0</TableCell><TableCell>0</TableCell>
                    </TableRow>
                    <TableRow className="border-zinc-800/50 text-zinc-500 hover:bg-zinc-800/50">
                      <TableCell>1</TableCell><TableCell>1</TableCell>
                      <TableCell>0</TableCell><TableCell>0</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              {/* Ecuaciones Booleanas[cite: 3] */}
              <div className="space-y-3">
                <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800 relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-destructive" />
                  <p className="text-[11px] text-zinc-500 mb-1.5 uppercase tracking-wider font-semibold">Ecuación Booleana (Crítico):</p>
                  <p className="font-mono text-destructive text-sm font-medium">R = S1' • S0' (Compuerta NOR)</p>
                </div>

                <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800 relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500" />
                  <p className="text-[11px] text-zinc-500 mb-1.5 uppercase tracking-wider font-semibold">Ecuación Booleana (Preventivo):</p>
                  <p className="font-mono text-amber-500 text-sm font-medium">Y = S1' • S0</p>
                </div>
              </div>

            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}