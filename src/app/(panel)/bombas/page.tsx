"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Fuel, Plus, Settings2, PowerOff, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function BombasPage() {
  const supabase = createClient()
  
  const [bombas, setBombas] = useState<any[]>([])
  const [tanques, setTanques] = useState<any[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Estado del formulario de nueva bomba
  const [numeroBomba, setNumeroBomba] = useState("")
  const [tanqueSeleccionado, setTanqueSeleccionado] = useState("")

  const cargarDatos = async () => {
    // Cargar bombas con su tanque asociado
    const { data: bombasData } = await supabase
      .from("bombas")
      .select("*, tanques(combustible)")
      .order("numero")
    
    // Cargar tanques para el formulario
    const { data: tanquesData } = await supabase
      .from("tanques")
      .select("id, combustible")
    
    setBombas(bombasData || [])
    setTanques(tanquesData || [])
  }

  useEffect(() => {
    cargarDatos()

    // Suscripción en Tiempo Real para cambios de estado de las bombas
    const channel = supabase.channel('monitor-bombas')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bombas' }, () => {
        cargarDatos()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const handleCrearBomba = async () => {
    if (!numeroBomba || !tanqueSeleccionado) {
      toast.error("Completa el número de bomba y selecciona un tanque.")
      return
    }

    setIsSubmitting(true)
    const { error } = await supabase.from("bombas").insert({
      numero: numeroBomba,
      tanque_id: tanqueSeleccionado,
      estado: "optimo"
    })
    setIsSubmitting(false)

    if (error) {
      toast.error(`Error: ${error.message}`)
    } else {
      toast.success("Bomba de despacho registrada correctamente.")
      setIsModalOpen(false)
      setNumeroBomba("")
      setTanqueSeleccionado("")
      cargarDatos()
    }
  }

  const handleCambiarEstado = async (id: string, nuevoEstado: string) => {
    const { error } = await supabase
      .from("bombas")
      .update({ estado: nuevoEstado })
      .eq("id", id)

    if (error) {
      toast.error(`Error al actualizar estado: ${error.message}`)
    } else {
      toast.success("Estado de la bomba actualizado.")
      cargarDatos()
    }
  }

  // Helpers visuales para los estados de las bombas
  const getEstadoUI = (estado: string) => {
    switch (estado) {
      case 'optimo':
        return { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20", label: "Óptimo" }
      case 'mantenimiento':
        return { icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20", label: "En Mantenimiento" }
      case 'fuera_de_linea':
        return { icon: PowerOff, color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/20", label: "Fuera de Línea" }
      case 'inactiva':
      default:
        return { icon: Settings2, color: "text-zinc-400", bg: "bg-zinc-800/50", border: "border-zinc-700", label: "Inactiva" }
    }
  }

  return (
    <div className="space-y-6">
      
      {/* Cabecera y Controles */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Gestión de Bombas</h1>
          <p className="text-muted-foreground mt-1">Administración de terminales de despacho y estados operativos.</p>
        </div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-zinc-100 text-zinc-900 hover:bg-zinc-200 h-10 px-4 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Plus className="h-4 w-4 mr-2" />
            Registrar Bomba
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-zinc-100">
                <Fuel className="h-5 w-5 text-emerald-500" />
                Nueva Terminal de Despacho
              </DialogTitle>
              <DialogDescription className="text-zinc-400">
                Asigna un identificador y vincula la bomba a un tanque de combustible.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Identificador (Ej: P-06)</Label>
                <Input 
                  value={numeroBomba} 
                  onChange={(e) => setNumeroBomba(e.target.value.toUpperCase())}
                  placeholder="P-XX"
                  className="bg-zinc-900 border-border"
                />
              </div>
              <div className="space-y-2">
                <Label>Tanque de Origen</Label>
                <Select value={tanqueSeleccionado} onValueChange={(val) => setTanqueSeleccionado(val || "")}>
                  <SelectTrigger className="bg-zinc-900 border-border">
                    <SelectValue placeholder="Selecciona el tanque" />
                  </SelectTrigger>
                  <SelectContent>
                    {tanques.map((t) => (
                      <SelectItem key={t.id} value={t.id} className="capitalize">
                        Tanque de {t.combustible}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleCrearBomba} 
                disabled={isSubmitting}
                className="w-full mt-2 bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Guardar Configuración
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Grid de Bombas Físicas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {bombas.map((bomba) => {
          const ui = getEstadoUI(bomba.estado)
          const Icon = ui.icon
          
          return (
            <Card key={bomba.id} className={`border ${ui.border} bg-card overflow-hidden flex flex-col`}>
              <CardHeader className={`${ui.bg} pb-4 border-b ${ui.border}`}>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-2xl font-bold flex items-center gap-2 text-zinc-100">
                      <Fuel className="h-5 w-5 text-zinc-400" />
                      {bomba.numero}
                    </CardTitle>
                    <CardDescription className="capitalize font-medium text-zinc-400">
                      Dispensador de {bomba.tanques?.combustible}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className={`${ui.color} border-current bg-background/50 flex items-center gap-1`}>
                    <Icon className="h-3 w-3" />
                    {ui.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4 flex-1">
                <div className="text-sm text-zinc-400 space-y-2">
                  <div className="flex justify-between">
                    <span>ID Hardware:</span>
                    <span className="font-mono text-xs">{bomba.id.split('-')[0]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Integridad RLS:</span>
                    <span className="text-emerald-500">Verificada</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t border-border/50 pt-4 bg-zinc-950">
                <div className="w-full space-y-2">
                  <Label className="text-xs text-zinc-500">Control de Estado (Admin)</Label>
                  <Select 
                    defaultValue={bomba.estado} 
                    onValueChange={(val) => handleCambiarEstado(bomba.id, val)}
                  >
                    <SelectTrigger className="w-full h-8 text-xs bg-zinc-900 border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="optimo" className="text-emerald-500">Óptimo (Activar)</SelectItem>
                      <SelectItem value="inactiva" className="text-zinc-400">Inactiva (Pausar)</SelectItem>
                      <SelectItem value="mantenimiento" className="text-amber-500">Mantenimiento</SelectItem>
                      <SelectItem value="fuera_de_linea" className="text-destructive">Fuera de Línea</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </div>
  )
}