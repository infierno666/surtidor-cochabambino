"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Cpu, Loader2 } from "lucide-react"
import { simularMultiplicacionALU } from "@/lib/alu"
import { toast } from "sonner"

export default function VentasPage() {
  const supabase = createClient()
  
  // Estados de la base de datos
  const [ventas, setVentas] = useState<any[]>([])
  const [bombas, setBombas] = useState<any[]>([])
  const [turnoActivo, setTurnoActivo] = useState<any>(null)
  
  // Estados del formulario
  const [litros, setLitros] = useState<number>(0)
  const [precio, setPrecio] = useState<number>(3.74)
  const [bombaSeleccionada, setBombaSeleccionada] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const aluResult = simularMultiplicacionALU(litros, precio)

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    // 1. Cargar el último turno abierto del usuario actual
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: turno } = await supabase
        .from("turnos")
        .select("id")
        .eq("operador_id", user.id)
        .eq("estado", "abierto")
        .single()
      setTurnoActivo(turno)
    }

    // 2. Cargar bombas operativas (con los datos de su tanque)
    const { data: bombasData } = await supabase
      .from("bombas")
      .select("id, numero, tanques(combustible)")
      .eq("estado", "optimo")
    setBombas(bombasData || [])

    // 3. Cargar historial de ventas
    const { data: ventasData } = await supabase
      .from("ventas")
      .select("*, bombas(numero)")
      .order("created_at", { ascending: false })
      .limit(10)
    setVentas(ventasData || [])
  }

  const handleGuardarVenta = async () => {
    if (!turnoActivo) {
      toast.error("No tienes un turno abierto. Abre un turno primero.")
      return
    }
    if (!bombaSeleccionada || litros <= 0 || precio <= 0) {
      toast.error("Por favor completa todos los campos correctamente.")
      return
    }

    setIsSubmitting(true)
    
    // Generar un número de factura simulado
    const nroFactura = `F-${Math.floor(Math.random() * 100000)}`

    // El trigger en PostgreSQL calculará el total y descontará el inventario
    const { error } = await supabase.from("ventas").insert({
      factura_nro: nroFactura,
      bomba_id: bombaSeleccionada,
      turno_id: turnoActivo.id,
      litros: litros,
      precio_unitario: precio,
      // El total se omite, la DB se encarga.
    })

    setIsSubmitting(false)

    if (error) {
      toast.error(`Error de base de datos: ${error.message}`)
    } else {
      toast.success("Venta procesada y calculada en la ALU exitosamente.")
      setIsModalOpen(false)
      cargarDatos() // Recargar la tabla
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Registro de Ventas</h1>
          <p className="text-muted-foreground mt-1">Gestión de despachos y cálculo aritmético de transacciones.</p>
        </div>
        
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-zinc-100 text-zinc-900 hover:bg-zinc-200 h-10 px-4 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Venta (ALU)
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] bg-card text-card-foreground border-border">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-zinc-100">
                <Cpu className="h-5 w-5 text-emerald-500" />
                Despacho con Procesamiento ALU
              </DialogTitle>
              <DialogDescription className="text-zinc-400">
                El cálculo del costo total se procesa mediante multiplicación binaria.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-6 py-4">
              <div className="space-y-2">
                <Label>Seleccionar Bomba Origen</Label>
               <Select value={bombaSeleccionada} onValueChange={(val) => setBombaSeleccionada(val || "")}>
                  <SelectTrigger className="bg-zinc-900 border-border">
                    <SelectValue placeholder="Elige una bomba operativa" />
                  </SelectTrigger>
                  <SelectContent>
                    {bombas.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.numero} - {b.tanques.combustible.toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Litros Despachados</Label>
                  <Input 
                    type="number" 
                    value={litros} 
                    onChange={(e) => setLitros(Number(e.target.value))}
                    className="bg-zinc-900 border-border"
                  />
                  <span className="text-xs text-zinc-500 font-mono">BIN: {aluResult.binLitros}</span>
                </div>
                <div className="space-y-2">
                  <Label>Precio Unitario (Bs)</Label>
                  <Input 
                    type="number" 
                    value={precio} 
                    onChange={(e) => setPrecio(Number(e.target.value))}
                    className="bg-zinc-900 border-border"
                  />
                  <span className="text-xs text-zinc-500 font-mono">BIN: {aluResult.binPrecio}</span>
                </div>
              </div>

              {/* Visualizador de la ALU */}
              <div className="bg-zinc-950 p-4 rounded-md border border-zinc-800 font-mono text-sm space-y-2 max-h-48 overflow-y-auto">
                <div className="text-zinc-400 mb-2 border-b border-zinc-800 pb-2">Registro de Desplazamientos (Shift & Add):</div>
                {aluResult.pasos.map((p, i) => (
                  <div key={i} className="flex justify-between text-zinc-300">
                    <span>Paso {p.paso}:</span>
                    <span className="text-emerald-500">{p.acumulador}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-2 border-t border-zinc-800 font-bold text-zinc-100 mt-2">
                  <span>TOTAL BINARIO:</span>
                  <span>{aluResult.totalBinario}</span>
                </div>
              </div>

              <Button 
                onClick={handleGuardarVenta} 
                disabled={isSubmitting}
                className="w-full bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Confirmar Transacción
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabla de Ventas en Vivo */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Turno</CardTitle>
          <CardDescription>Datos sincronizados con Supabase.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="text-zinc-400">Factura</TableHead>
                <TableHead className="text-zinc-400">Bomba</TableHead>
                <TableHead className="text-right text-zinc-400">Volumen</TableHead>
                <TableHead className="text-right text-zinc-400">Total (Calc. BD)</TableHead>
                <TableHead className="text-right text-zinc-400">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ventas.map((venta) => (
                <TableRow key={venta.id} className="border-border/50 hover:bg-zinc-800/20">
                  <TableCell className="font-mono font-medium text-zinc-100">{venta.factura_nro}</TableCell>
                  <TableCell className="text-zinc-300">{venta.bombas?.numero}</TableCell>
                  <TableCell className="text-right text-zinc-300">{venta.litros} L</TableCell>
                  <TableCell className="text-right font-medium text-emerald-400">Bs {venta.total?.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                      {venta.estado}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {ventas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-zinc-500 h-24">
                    No hay ventas registradas aún.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}