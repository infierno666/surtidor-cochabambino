"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Droplet, AlertOctagon, Activity, Cpu } from "lucide-react"

export default function TanquesPage() {
  const supabase = createClient()
  
  const [tanques, setTanques] = useState<any[]>([])
  const [alertas, setAlertas] = useState<any[]>([])

  // Función para cargar los datos iniciales
  const cargarDatos = async () => {
    const { data: tanquesData } = await supabase.from("tanques").select("*").order("codigo_binario")
    const { data: alertasData } = await supabase.from("alertas").select("*, tanques(combustible)").eq("resuelta", false).order("created_at", { ascending: false })
    
    setTanques(tanquesData || [])
    setAlertas(alertasData || [])
  }

  useEffect(() => {
    cargarDatos()

    // Suscripción en Tiempo Real (Supabase Realtime)
    const channel = supabase.channel('monitor-tanques')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tanques' }, () => {
        cargarDatos() // Recargar datos si un tanque cambia
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alertas' }, () => {
        cargarDatos() // Recargar alertas si se genera o resuelve una
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Helpers para la UI basados en la lógica digital
  const getSensorBits = (nivel: number) => {
    return nivel.toString(2).padStart(2, '0')
  }

  const getUIColors = (nivel: number) => {
    if (nivel === 0) return { bg: "bg-destructive/20", border: "border-destructive", text: "text-destructive", led: "LED ROJO (Crítico)" }
    if (nivel === 1) return { bg: "bg-amber-500/20", border: "border-amber-500/50", text: "text-amber-500", led: "LED AMARILLO (Bajo)" }
    if (nivel === 2) return { bg: "bg-zinc-800", border: "border-zinc-700", text: "text-zinc-300", led: "Normal (Medio)" }
    return { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-500", led: "Normal (Lleno)" }
  }

  return (
    <div className="space-y-6">
      
      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Monitor de Tanques</h1>
          <p className="text-muted-foreground mt-1">Telemetría de sensores, niveles binarios y estado de hardware.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-zinc-500 border border-zinc-800 bg-zinc-950 px-3 py-1.5 rounded-full">
          <Activity className="h-4 w-4 animate-pulse text-emerald-500" />
          <span>Realtime Sync Activo</span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Sensores Físicos (Tanques) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            {tanques.map((tanque) => {
              const porcentaje = (tanque.volumen_actual / tanque.capacidad_maxima) * 100
              const ui = getUIColors(tanque.nivel_binario)
              
              return (
                <Card key={tanque.id} className={`border ${ui.border} bg-card overflow-hidden relative`}>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex justify-between items-center text-lg capitalize">
                      {tanque.combustible}
                      <Badge variant="outline" className={`${ui.text} ${ui.border} font-mono bg-background/50`}>
                        {getSensorBits(tanque.nivel_binario)}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Volumen: {tanque.volumen_actual} L / {tanque.capacidad_maxima} L
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mt-4 h-4 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                      <div 
                        className={`h-full transition-all duration-1000 ${tanque.nivel_binario <= 1 ? ui.bg.replace('/20', '') : 'bg-zinc-100'}`} 
                        style={{ width: `${porcentaje}%` }} 
                      />
                    </div>
                    <div className="mt-4 flex justify-between items-center text-xs font-medium">
                      <span className="text-zinc-400">Salida Decodificador:</span>
                      <span className={ui.text}>{ui.led}</span>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Tabla de Alertas Activas */}
          <Card className="border-destructive/20 shadow-[0_0_15px_rgba(220,38,38,0.05)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertOctagon className="h-5 w-5" />
                Alertas de Hardware Activas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50">
                    <TableHead className="text-zinc-400">Fecha/Hora</TableHead>
                    <TableHead className="text-zinc-400">Tanque</TableHead>
                    <TableHead className="text-zinc-400">LED / Tipo</TableHead>
                    <TableHead className="text-zinc-400">Mensaje del Sensor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alertas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-emerald-500 h-16">
                        No hay alertas activas. Sistema operando en parámetros normales.
                      </TableCell>
                    </TableRow>
                  ) : (
                    alertas.map((alerta) => (
                      <TableRow key={alerta.id} className="border-border/50 bg-destructive/5 hover:bg-destructive/10">
                        <TableCell className="text-zinc-300 text-xs">
                          {new Date(alerta.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell className="capitalize font-medium text-zinc-200">
                          {alerta.tanques?.combustible}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={alerta.tipo === 'LED_ROJO' ? 'bg-destructive/20 text-destructive border-destructive' : 'bg-amber-500/20 text-amber-500 border-amber-500'}>
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

        {/* Lógica Digital (Sistemas Digitales) */}
        <div className="space-y-6">
          <Card className="bg-zinc-950 border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-zinc-100">
                <Cpu className="h-5 w-5 text-emerald-500" />
                Lógica del Decodificador
              </CardTitle>
              <CardDescription>
                Tabla de verdad de los sensores de nivel.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-zinc-800 overflow-hidden">
                <Table>
                  <TableHeader className="bg-zinc-900">
                    <TableRow className="border-zinc-800">
                      <TableHead className="text-center text-zinc-400" colSpan={2}>Entradas (Sensores)</TableHead>
                      <TableHead className="text-center text-zinc-400" colSpan={2}>Salidas (LEDs)</TableHead>
                    </TableRow>
                    <TableRow className="border-zinc-800">
                      <TableHead className="text-center w-1/4 text-zinc-400">S1</TableHead>
                      <TableHead className="text-center w-1/4 text-zinc-400">S0</TableHead>
                      <TableHead className="text-center w-1/4 text-destructive">ROJO</TableHead>
                      <TableHead className="text-center w-1/4 text-amber-500">AMARILLO</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="text-center font-mono">
                    <TableRow className="border-zinc-800 text-destructive bg-destructive/10">
                      <TableCell>0</TableCell><TableCell>0</TableCell>
                      <TableCell>1</TableCell><TableCell>0</TableCell>
                    </TableRow>
                    <TableRow className="border-zinc-800 text-amber-500 bg-amber-500/10">
                      <TableCell>0</TableCell><TableCell>1</TableCell>
                      <TableCell>0</TableCell><TableCell>1</TableCell>
                    </TableRow>
                    <TableRow className="border-zinc-800 text-zinc-400">
                      <TableCell>1</TableCell><TableCell>0</TableCell>
                      <TableCell>0</TableCell><TableCell>0</TableCell>
                    </TableRow>
                    <TableRow className="border-zinc-800 text-zinc-400">
                      <TableCell>1</TableCell><TableCell>1</TableCell>
                      <TableCell>0</TableCell><TableCell>0</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              <div className="mt-6 space-y-4">
                <div className="bg-zinc-900 p-3 rounded-md border border-zinc-800">
                  <p className="text-xs text-zinc-500 mb-1">Ecuación Booleana (LED Rojo):</p>
                  <p className="font-mono text-destructive">R = S1' • S0' (Compuerta NOR)</p>
                </div>
                <div className="bg-zinc-900 p-3 rounded-md border border-zinc-800">
                  <p className="text-xs text-zinc-500 mb-1">Ecuación Booleana (LED Amarillo):</p>
                  <p className="font-mono text-amber-500">Y = S1' • S0</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}