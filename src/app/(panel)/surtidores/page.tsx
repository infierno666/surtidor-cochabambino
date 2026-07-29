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
import { Fuel, Plus, Settings2, PowerOff, AlertTriangle, CheckCircle2, Loader2, Cpu, Layers } from "lucide-react"
import { toast } from "sonner"

export default function SurtidoresPage() {
  const supabase = createClient()

  // Estados de datos
  const [surtidores, setSurtidores] = useState<any[]>([])
  const [tanques, setTanques] = useState<any[]>([])

  // Estados de interfaz
  const [isSurtidorModalOpen, setIsSurtidorModalOpen] = useState(false)
  const [isMangueraModalOpen, setIsMangueraModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Estados de formularios
  const [codigoSurtidor, setCodigoSurtidor] = useState("")
  const [ubicacion, setUbicacion] = useState("Isla Central")
  const [surtidorSeleccionadoId, setSurtidorSeleccionadoId] = useState("")
  const [tanqueSeleccionadoId, setTanqueSeleccionadoId] = useState("")
  const [numeroManguera, setNumeroManguera] = useState("1")

  const cargarDatos = async () => {
    // 1. Cargar surtidores con mangueras y datos de tanques anidados
    const { data: surtidoresData } = await supabase
      .from("surtidores")
      .select(`
        *,
        surtidor_mangueras (
          id,
          numero_manguera,
          estado,
          tanques (
            combustible,
            volumen_actual,
            capacidad_maxima,
            nivel_binario
          )
        )
      `)
      .order("codigo_surtidor")

    // 2. Cargar tanques activos para mostrar sus nombres en el formulario
    const { data: tanquesData } = await supabase
      .from("tanques")
      .select("id, combustible")

    setSurtidores(surtidoresData || [])
    setTanques(tanquesData || [])
  }

  useEffect(() => {
    cargarDatos()

    // Suscripción Realtime para la infraestructura completa
    const channel = supabase.channel('infraestructura-surtidores')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'surtidores' }, () => cargarDatos())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'surtidor_mangueras' }, () => cargarDatos())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tanques' }, () => cargarDatos())
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const handleCrearSurtidor = async () => {
    if (!codigoSurtidor) {
      toast.error("Por favor, introduce un código identificador para el surtidor.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Insertamos el pedestal físico del surtidor
      const { data: nuevoSurtidor, error: errorSurtidor } = await supabase
        .from("surtidores")
        .insert({
          codigo_surtidor: codigoSurtidor,
          ubicacion: ubicacion,
          estado_operativo: "optimo"
        })
        .select()
        .single();

      if (errorSurtidor) {
        setIsSubmitting(false);
        toast.error(`Error al crear pedestal: ${errorSurtidor.message}`);
        return;
      }

      // 2. Mapeo seguro y sin duplicados de mangueras iniciales
      if (nuevoSurtidor && tanques && tanques.length > 0) {
        // Usamos un set o aseguramos un índice limpio basado estrictamente en la posición del array
        const manguerasIniciales = tanques.map((tanque, index) => ({
          surtidor_id: nuevoSurtidor.id,
          tanque_id: tanque.id,
          numero_manguera: Number(index + 1), // Asegura enteros limpios: 1, 2, 3...
          estado: "activo"
        }));

        const { error: errorMangueras } = await supabase
          .from("surtidor_mangueras")
          .insert(manguerasIniciales);

        if (errorMangueras) {
          console.error("Fallo controlado en mangueras:", errorMangueras);
          toast.warning("Surtidor creado, pero configura las mangueras manualmente en el panel.");
        }
      }

      // 3. Éxito y reseteo
      toast.success("¡Surtidor e infraestructura inicializados!");
      setIsSurtidorModalOpen(false);
      setCodigoSurtidor("");
      await cargarDatos();

    } catch (err: any) {
      console.error("Error general:", err);
      toast.error("Ocurrió un error inesperado.");
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleVincularManguera = async () => {
    if (!surtidorSeleccionadoId || !tanqueSeleccionadoId) {
      toast.error("Completa todos los campos para añadir la manguera de despacho.")
      return
    }

    setIsSubmitting(true)

    try {
      // 1. Buscamos qué mangueras ya tiene instaladas este surtidor específico
      const surtidorActual = surtidores.find(s => s.id === surtidorSeleccionadoId)
      const manguerasExistentes = surtidorActual?.surtidor_mangueras || []

      // 2. Calculamos el siguiente número correlativo disponible de forma automática (Ej: si hay 4, toca la 5)
      const siguienteNumeroManguera = manguerasExistentes.length > 0
        ? Math.max(...manguerasExistentes.map((m: any) => m.numero_manguera)) + 1
        : 1

      // 3. Insertamos en la base de datos garantizando un número único
      const { error } = await supabase.from("surtidor_mangueras").insert({
        surtidor_id: surtidorSeleccionadoId,
        tanque_id: tanqueSeleccionadoId,
        numero_manguera: siguienteNumeroManguera, // 👈 Asignación dinámica inteligente
        estado: "activo"
      })

      if (error) {
        console.error("Error al vincular:", error)
        toast.error("Error de hardware: El tanque seleccionado ya está vinculado a este surtidor.")
      } else {
        toast.success(`¡Manguera ${siguienteNumeroManguera} acoplada con éxito al surtidor!`)
        setIsMangueraModalOpen(false)
        setSurtidorSeleccionadoId("")
        setTanqueSeleccionadoId("")
        await cargarDatos()
      }
    } catch (err) {
      console.error(err)
      toast.error("Ocurrió un error inesperado al acoplar la manguera.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCambiarEstadoSurtidor = async (id: string, nuevoEstado: string) => {
    const { error } = await supabase
      .from("surtidores")
      .update({ estado_operativo: nuevoEstado })
      .eq("id", id)

    if (error) {
      toast.error(`Error: ${error.message}`)
    } else {
      toast.success("Estado maestro del surtidor modificado.")
      cargarDatos()
    }
  }

  // Helpers de Interfaz y Decodificadores
  const getEstadoUI = (estado: string) => {
    switch (estado) {
      case 'optimo':
        return { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20", label: "Óptimo" }
      case 'mantenimiento':
        return { icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20", label: "Mantenimiento" }
      case 'fuera_de_linea':
        return { icon: PowerOff, color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/20", label: "Bloqueado" }
      default:
        return { icon: Settings2, color: "text-zinc-400", bg: "bg-zinc-800/50", border: "border-zinc-700", label: "Inactivo" }
    }
  }

  const decondificarBits = (bits: number) => {
    switch (bits) {
      case 3: return "11 (100%)";
      case 2: return "10 (50%)";
      case 1: return "01 (25%)";
      case 0:
      default: return "00 (Crítico)";
    }
  }

  return (
    <div className="space-y-6">

      {/* Cabecera de Control */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Infraestructura de Surtidores</h1>
          <p className="text-muted-foreground mt-1">Gestión de islas centrales, acoplamiento de mangueras y decodificación de tanques.</p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          {/* Modal de Mangueras */}
          <Dialog open={isMangueraModalOpen} onOpenChange={setIsMangueraModalOpen}>
            <DialogTrigger className="w-full sm:w-auto inline-flex items-center justify-center rounded-md text-sm font-medium border border-border bg-zinc-900 text-zinc-100 hover:bg-zinc-800 h-10 px-4 py-2 transition-colors">
              <Layers className="h-4 w-4 mr-2 text-amber-500" />
              Acoplar Manguera
            </DialogTrigger>
            <DialogContent className="bg-card text-card-foreground border-border max-w-sm">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-zinc-100">Instalar Nueva Manguera</DialogTitle>
                <DialogDescription className="text-zinc-400">Vincula una salida física a un tanque de combustible.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-3">
                {/* 1. Selector de Surtidor Maestro */}
                <div className="space-y-1.5">
                  <Label>Seleccionar Surtidor Maestro</Label>
                  <Select value={surtidorSeleccionadoId} onValueChange={(val) => setSurtidorSeleccionadoId(val || "")}>
                    <SelectTrigger className="bg-zinc-900 border-border w-full">
                      <SelectValue placeholder="Surtidor destino">
                        {surtidores.find(s => s.id === surtidorSeleccionadoId)?.codigo_surtidor
                          ? `${surtidores.find(s => s.id === surtidorSeleccionadoId).codigo_surtidor} (${surtidores.find(s => s.id === surtidorSeleccionadoId).ubicacion})`
                          : undefined}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {surtidores.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.codigo_surtidor} ({s.ubicacion})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 2. Selector de Línea de Alimentación */}
                <div className="space-y-1.5">
                  <Label>Línea de Alimentación (Tanque Físico)</Label>
                  <Select value={tanqueSeleccionadoId} onValueChange={(val) => setTanqueSeleccionadoId(val || "")}>
                    <SelectTrigger className="bg-zinc-900 border-border w-full">
                      <SelectValue placeholder="Combustible origen">
                        {tanques.find(t => t.id === tanqueSeleccionadoId)?.combustible
                          ? `Tanque de ${tanques.find(t => t.id === tanqueSeleccionadoId).combustible}`
                          : undefined}
                      </SelectValue>
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
                <div className="space-y-1.5">
                  <Label>Número de Manguera en Pedestal</Label>
                  <Select value={numeroManguera} onValueChange={(val) => setNumeroManguera(val || "1")}>
                    <SelectTrigger className="bg-zinc-900 border-border"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Manguera 1 (Lado A)</SelectItem>
                      <SelectItem value="2">Manguera 2 (Lado B)</SelectItem>
                      <SelectItem value="3">Manguera 3 (Auxiliar)</SelectItem>
                      <SelectItem value="4">Manguera 4 (GNV)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleVincularManguera} disabled={isSubmitting} className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200 mt-2">
                  {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Registrar Conexión
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Modal de Surtidores */}
          <Dialog open={isSurtidorModalOpen} onOpenChange={setIsSurtidorModalOpen}>
            <DialogTrigger className="w-full sm:w-auto inline-flex items-center justify-center rounded-md text-sm font-medium bg-zinc-100 text-zinc-900 hover:bg-zinc-200 h-10 px-4 py-2 transition-colors">
              <Plus className="h-4 w-4 mr-2" />
              Crear Surtidor
            </DialogTrigger>
            <DialogContent className="bg-card text-card-foreground border-border max-w-sm">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-zinc-100"><Fuel className="h-5 w-5 text-emerald-500" /> Nuevo Pedestal Físico</DialogTitle>
                <DialogDescription className="text-zinc-400">Levanta una nueva isla de servicio en la planta del surtidor.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-3">
                <div className="space-y-1.5">
                  <Label>Código Identificador</Label>
                  <Input value={codigoSurtidor} onChange={(e) => setCodigoSurtidor(e.target.value.toUpperCase())} placeholder="SURTIDOR-XX" className="bg-zinc-900 border-border" />
                </div>
                <div className="space-y-1.5">
                  <Label>Ubicación Geográfica en Planta</Label>
                  <Select value={ubicacion} onValueChange={(val) => setUbicacion(val || "Isla Central 1")}>
                    <SelectTrigger className="bg-zinc-900 border-border"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Isla Central 1">Isla Central 1</SelectItem>
                      <SelectItem value="Isla Central 2">Isla Central 2</SelectItem>
                      <SelectItem value="Carril de Carga Pesada">Carril de Carga Pesada (Diésel)</SelectItem>
                      <SelectItem value="Zona Exclusiva GNV">Zona Exclusiva GNV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCrearSurtidor} disabled={isSubmitting} className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200 mt-2">
                  {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Habilitar Isla
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Grid Corporativo de Surtidores Avanzados */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {surtidores.map((surtidor) => {
          const ui = getEstadoUI(surtidor.estado_operativo)
          const Icon = ui.icon

          return (
            <Card key={surtidor.id} className={`border ${ui.border} bg-card overflow-hidden flex flex-col shadow-xl`}>
              <CardHeader className={`${ui.bg} pb-4 border-b ${ui.border}`}>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-xl font-bold flex items-center gap-2 text-zinc-100">
                      <Fuel className="h-5 w-5 text-zinc-400" />
                      {surtidor.codigo_surtidor}
                    </CardTitle>
                    <CardDescription className="text-zinc-400 text-xs font-medium">
                      Sector: {surtidor.ubicacion}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className={`${ui.color} border-current bg-background/50 flex items-center gap-1`}>
                    <Icon className="h-3 w-3" />
                    {ui.label}
                  </Badge>
                </div>
              </CardHeader>

              {/* Sección Interna Multimangueras */}
              <CardContent className="pt-4 flex-1 space-y-4">
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-1">
                    <Layers className="w-3 h-3 text-amber-500" /> Mangueras y Líneas de Flujo ({surtidor.surtidor_mangueras?.length || 0})
                  </h4>

                  {surtidor.surtidor_mangueras && surtidor.surtidor_mangueras.length > 0 ? (
                    <div className="space-y-2.5">
                      {/* Ordenamos las mangueras numéricamente para que se vean bien */}
                      {surtidor.surtidor_mangueras
                        .sort((a: any, b: any) => a.numero_manguera - b.numero_manguera)
                        .map((manguera: any) => {
                          const tanque = manguera.tanques
                          const porcentaje = tanque ? Math.round((tanque.volumen_actual / tanque.capacidad_maxima) * 100) : 0

                          return (
                            <div key={manguera.id} className="bg-zinc-950 p-3 rounded-lg border border-zinc-800/60 space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-medium text-zinc-200">
                                  Manguera {manguera.numero_manguera} — <span className="capitalize text-zinc-400 font-bold">{tanque?.combustible || "Sin Asignar"}</span>
                                </span>
                                <Badge variant="outline" className="text-[10px] bg-zinc-900 text-zinc-400 border-zinc-800 uppercase font-mono px-1.5 py-0">
                                  {manguera.estado}
                                </Badge>
                              </div>

                              {/* Barra de progreso de volumen vinculada */}
                              <div className="space-y-1">
                                <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                                  <span>Volumen: {tanque?.volumen_actual.toLocaleString()} L</span>
                                  <span>{porcentaje}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800/50">
                                  <div className={`h-full rounded-full ${porcentaje > 50 ? 'bg-zinc-400' : porcentaje > 20 ? 'bg-amber-500' : 'bg-destructive'}`} style={{ width: `${porcentaje}%` }} />
                                </div>
                              </div>

                              {/* Telemetría Digital del Sensor de ese Tanque */}
                              <div className="flex justify-between items-center pt-1 border-t border-zinc-900 text-[10px] font-mono">
                                <span className="text-zinc-500 flex items-center gap-1"><Cpu className="w-3 h-3 text-emerald-500" /> Sensor Binario:</span>
                                <span className="text-zinc-300 font-bold">{decondificarBits(tanque?.nivel_binario)}</span>
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  ) : (
                    <div className="text-center py-4 border border-dashed border-zinc-800 rounded-lg">
                      <p className="text-xs text-zinc-500">No hay mangueras instaladas en este pedestal.</p>
                    </div>
                  )}
                </div>
              </CardContent>

              {/* Control Maestro del Pedestal */}
              <CardFooter className="border-t border-border/50 pt-3 bg-zinc-950">
                <div className="w-full space-y-1.5">
                  <Label className="text-[11px] text-zinc-500">Control de Isla (Consola Principal)</Label>
                  <Select
                    value={surtidor.estado_operativo || "optimo"}
                    onValueChange={(val) => handleCambiarEstadoSurtidor(surtidor.id, val || "optimo")}
                  >
                    <SelectTrigger className="w-full h-8 text-xs bg-zinc-900 border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="optimo" className="text-emerald-500">Óptimo (Habilitar)</SelectItem>
                      <SelectItem value="inactiva" className="text-zinc-400">Inactivo (Pausar)</SelectItem>
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