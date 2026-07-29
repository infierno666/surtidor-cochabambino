"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { jsPDF } from "jspdf"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Cpu, Loader2, FileText, Download, Fuel, User } from "lucide-react"
import { simularMultiplicacionALU } from "@/lib/alu"
import { toast } from "sonner"

// Helper para colores corporativos de combustible
const getEstiloCombustible = (combustible: string) => {
  const comb = combustible?.toLowerCase() || "";
  if (comb.includes("especial")) return "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
  if (comb.includes("premium")) return "text-amber-400 border-amber-500/30 bg-amber-500/10";
  if (comb.includes("diesel")) return "text-orange-400 border-orange-500/30 bg-orange-500/10";
  if (comb.includes("gnv")) return "text-blue-400 border-blue-500/30 bg-blue-500/10";
  return "text-zinc-400 border-zinc-700 bg-zinc-800/50";
}

export default function VentasPage() {
  const supabase = createClient()

  // ==========================================
  // ESTADOS DEL SISTEMA Y BASE DE DATOS
  // ==========================================
  const [ventas, setVentas] = useState<any[]>([])
  const [mangueras, setMangueras] = useState<any[]>([])
  const [clientes, setClientes] = useState<any[]>([])
  const [turnoActivo, setTurnoActivo] = useState<any>(null)

  // ==========================================
  // ESTADOS DEL FORMULARIO
  // ==========================================
  const [litros, setLitros] = useState<number>(0)
  const [precio, setPrecio] = useState<number>(3.74)
  const [mangueraSeleccionada, setMangueraSeleccionada] = useState<string>("")
  const [clienteSeleccionado, setClienteSeleccionado] = useState<string>("anonimo")

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Motor ALU en tiempo real
  const aluResult = simularMultiplicacionALU(litros, precio)

  // ==========================================
  // CARGA INICIAL DE DATOS
  // ==========================================
  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
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

    const { data: manguerasData } = await supabase
      .from("surtidor_mangueras")
      .select("id, numero_manguera, surtidor_id, surtidores(codigo_surtidor), tanques(combustible)")
      .eq("estado", "activo")
    setMangueras(manguerasData || [])

    const { data: clientesData } = await supabase.from("clientes").select("*").order("razon_social")
    setClientes(clientesData || [])

    // 👇 AQUÍ MEJORAMOS LA CONSULTA: Pedimos a BD que también traiga el combustible desde el tanque asociado
    const { data: ventasData } = await supabase
      .from("ventas")
      .select("*, surtidores(codigo_surtidor), surtidor_mangueras(numero_manguera, tanques(combustible)), clientes(razon_social, nit_ci)")
      .order("created_at", { ascending: false })
      .limit(15)
    setVentas(ventasData || [])
  }

  // ==========================================
  // MOTOR DE FACTURACIÓN PDF
  // ==========================================
  const generarFacturaPDF = (venta: any) => {
    const doc = new jsPDF()

    doc.setFont("helvetica", "bold")
    doc.setFontSize(18)
    doc.text("ESTACIÓN DE SERVICIO", 105, 20, { align: "center" })

    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text("Cochabamba, Bolivia", 105, 26, { align: "center" })
    doc.text("NIT: 1029384756", 105, 31, { align: "center" })

    doc.line(20, 35, 190, 35)

    doc.setFont("helvetica", "bold")
    doc.text(`FACTURA NRO: ${venta.factura_nro}`, 20, 45)
    doc.setFont("helvetica", "normal")
    doc.text(`Fecha y Hora: ${new Date(venta.created_at).toLocaleString('es-BO')}`, 20, 52)
    doc.text(`Cliente: ${venta.clientes?.razon_social || "S/N"}`, 20, 59)
    doc.text(`NIT/CI: ${venta.clientes?.nit_ci || "0"}`, 20, 66)

    doc.text(`Surtidor: ${venta.surtidores?.codigo_surtidor || "N/A"}`, 120, 52)
    doc.text(`Manguera: ${venta.surtidor_mangueras?.numero_manguera || "N/A"}`, 120, 59)

    doc.line(20, 72, 190, 72)
    doc.setFont("helvetica", "bold")
    doc.text("PRODUCTO", 20, 80)
    doc.text("CANTIDAD", 90, 80)
    doc.text("P. UNITARIO", 130, 80)
    doc.text("SUBTOTAL", 170, 80)
    doc.line(20, 83, 190, 83)

    // 👇 AQUÍ USAMOS EL DATO REAL DEL COMBUSTIBLE EN LA FACTURA
    const tipoCombustible = venta.surtidor_mangueras?.tanques?.combustible?.toUpperCase() || "COMB. LIQUIDO"

    doc.setFont("helvetica", "normal")
    doc.text(tipoCombustible, 20, 92)
    doc.text(`${venta.litros} L`, 90, 92)
    doc.text(`Bs ${venta.precio_unitario}`, 130, 92)
    doc.text(`Bs ${Number(venta.total).toFixed(2)}`, 170, 92)

    doc.line(20, 100, 190, 100)

    doc.setFont("helvetica", "bold")
    doc.setFontSize(12)
    doc.text("TOTAL A PAGAR:", 130, 110)
    doc.text(`Bs ${Number(venta.total).toFixed(2)}`, 170, 110)

    doc.setFontSize(8)
    doc.setFont("helvetica", "italic")
    doc.text("Cálculo procesado y validado mediante sistema aritmético ALU.", 105, 130, { align: "center" })
    doc.text("¡Gracias por su preferencia!", 105, 135, { align: "center" })

    doc.save(`Factura_${venta.factura_nro}.pdf`)
  }

  // ==========================================
  // REGISTRO DE TRANSACCIÓN EN BD
  // ==========================================
  const handleGuardarVenta = async () => {
    if (!turnoActivo) {
      toast.error("Requiere apertura de turno para operar.")
      return
    }
    if (!mangueraSeleccionada || litros <= 0 || precio <= 0) {
      toast.error("Parámetros de despacho incompletos o inválidos.")
      return
    }

    setIsSubmitting(true)

    const nroFactura = `F-${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`
    const manguera = mangueras.find(m => m.id === mangueraSeleccionada)
    const clienteIdFinal = clienteSeleccionado === "anonimo" ? null : clienteSeleccionado

    // 👇 Al insertar, también pedimos los datos anidados de la tabla para imprimir el PDF al instante
    const { data: nuevaVenta, error } = await supabase
      .from("ventas")
      .insert({
        factura_nro: nroFactura,
        manguera_id: manguera.id,
        surtidor_id: manguera.surtidor_id,
        turno_id: turnoActivo.id,
        cliente_id: clienteIdFinal,
        litros: litros,
        precio_unitario: precio,
      })
      .select("*, surtidores(codigo_surtidor), surtidor_mangueras(numero_manguera, tanques(combustible)), clientes(razon_social, nit_ci)")
      .single()

    setIsSubmitting(false)

    if (error) {
      toast.error(`Falla en transacción: ${error.message}`)
    } else {
      toast.success("Venta procesada. Total validado por ALU.")
      generarFacturaPDF(nuevaVenta)
      setIsModalOpen(false)
      cargarDatos()
    }
  }

  return (
    <div className="space-y-6">

      {/* ================= HEADER ================= */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Terminal de Despacho</h1>
          <p className="text-muted-foreground mt-1">Facturación inteligente y procesamiento aritmético de combustibles.</p>
        </div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger className="inline-flex items-center justify-center rounded-md text-sm bg-emerald-500 text-zinc-950 hover:bg-emerald-400 h-10 px-5 py-2 transition-all shadow-lg hover:shadow-emerald-500/20 font-bold">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Transacción
          </DialogTrigger>
          <DialogContent className="sm:max-w-175 bg-card text-card-foreground border-border shadow-2xl">
            <DialogHeader className="border-b border-zinc-800/50 pb-4">
              <DialogTitle className="flex items-center gap-2 text-zinc-100 text-xl">
                <Cpu className="h-6 w-6 text-emerald-500" />
                Despacho con Procesamiento ALU
              </DialogTitle>
              <DialogDescription className="text-zinc-400">
                Llene los parámetros de flujo. El costo total es resuelto mediante operaciones de multiplicación binaria en tiempo real.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-6 py-4">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-zinc-300"><User className="w-4 h-4 text-zinc-500" /> Cliente (Facturación)</Label>
                  <Select value={clienteSeleccionado} onValueChange={(val) => setClienteSeleccionado(val || "anonimo")}>
                    <SelectTrigger className="bg-zinc-950 border-zinc-800 h-12 hover:bg-zinc-900 transition-colors shadow-inner w-full">
                      <SelectValue placeholder="Selecciona un cliente">
                        {clienteSeleccionado === "anonimo"
                          ? <span className="italic text-zinc-500 font-medium">S/N - Sin Nombre</span>
                          : (() => {
                            const c = clientes.find(x => x.id === clienteSeleccionado);
                            return c ? <span className="font-semibold text-emerald-400 truncate">{c.razon_social}</span> : "Selecciona";
                          })()
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent sideOffset={4} className="bg-zinc-900 border-zinc-800 w-[--radix-select-trigger-width] max-h-62.5">
                      <SelectItem value="anonimo" className="italic text-zinc-500 py-2">S/N - Venta Rápida (Sin Nombre)</SelectItem>
                      {clientes.map((c) => (
                        <SelectItem key={c.id} value={c.id} className="py-2 cursor-pointer">
                          <span className="font-medium truncate">{c.razon_social}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-zinc-300"><Fuel className="w-4 h-4 text-zinc-500" /> Línea de Surtidor</Label>
                  <Select value={mangueraSeleccionada} onValueChange={(val) => setMangueraSeleccionada(val || "")}>
                    <SelectTrigger className="bg-zinc-950 border-zinc-800 h-12 hover:bg-zinc-900 transition-colors shadow-inner text-left w-full">
                      <SelectValue placeholder="Seleccione un origen">
                        {mangueraSeleccionada ? (() => {
                          const m = mangueras.find(x => x.id === mangueraSeleccionada);
                          return m ? (
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-zinc-200">{m.surtidores?.codigo_surtidor}</span>
                              <span className="text-zinc-600">/</span>
                              <span className="text-zinc-400 font-mono text-sm">M{m.numero_manguera}</span>
                            </div>
                          ) : "Seleccionar origen";
                        })() : null}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent sideOffset={4} className="max-h-75 w-[--radix-select-trigger-width] bg-zinc-900 border-zinc-800">
                      {Object.entries(
                        mangueras.reduce((acc, m) => {
                          const surtidor = m.surtidores?.codigo_surtidor || "Otros";
                          if (!acc[surtidor]) acc[surtidor] = [];
                          acc[surtidor].push(m);
                          return acc;
                        }, {})
                      ).map(([surtidor, manguerasDelSurtidor]: [string, any]) => (
                        <SelectGroup key={surtidor}>
                          <SelectLabel className="text-emerald-500 font-bold bg-zinc-950 border-b border-zinc-800/80 sticky top-0 z-10 px-3 py-1.5 text-xs">
                            {surtidor}
                          </SelectLabel>
                          {manguerasDelSurtidor
                            .sort((a: any, b: any) => a.numero_manguera - b.numero_manguera)
                            .map((m: any) => {
                              const comb = m.tanques?.combustible?.toLowerCase() || "";
                              const badgeStyle = getEstiloCombustible(comb);

                              return (
                                <SelectItem key={m.id} value={m.id} className="cursor-pointer py-2 px-3 focus:bg-zinc-800/80">
                                  <div className="flex items-center justify-between w-full gap-4">
                                    <span className="text-zinc-300 font-medium font-mono text-sm">
                                      Mang. {m.numero_manguera}
                                    </span>
                                    <Badge variant="outline" className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0 ${badgeStyle}`}>
                                      {m.tanques?.combustible}
                                    </Badge>
                                  </div>
                                </SelectItem>
                              );
                            })}
                        </SelectGroup>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5 mt-2">
                <div className="space-y-2">
                  <Label className="text-zinc-300">Volumen (Litros)</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={litros || ""}
                      onChange={(e) => setLitros(Number(e.target.value))}
                      className="bg-zinc-950 border-zinc-800 text-xl font-bold font-mono h-14 pl-4 pr-10 shadow-inner focus-visible:ring-emerald-500/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      placeholder="0.00"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold pointer-events-none">L</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-zinc-500 font-mono mt-1 px-1">
                    <span>Conversión ALU:</span>
                    <span className="text-zinc-400">{aluResult.binLitros}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-300">Precio Base (Bs/L)</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={precio || ""}
                      onChange={(e) => setPrecio(Number(e.target.value))}
                      className="bg-zinc-950 border-zinc-800 text-xl font-bold font-mono h-14 pl-10 pr-4 shadow-inner focus-visible:ring-emerald-500/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      placeholder="0.00"
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold pointer-events-none">Bs</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-zinc-500 font-mono mt-1 px-1">
                    <span>Conversión ALU:</span>
                    <span className="text-zinc-400">{aluResult.binPrecio}</span>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-950 p-5 rounded-lg border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.05)] mt-2">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
                  <span className="text-sm text-zinc-400 font-medium uppercase tracking-wider">Total Calculado en ALU:</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-emerald-500 font-bold text-lg">Bs</span>
                    <span className="text-4xl font-black text-emerald-400 tracking-tight font-mono">
                      {Number(aluResult.totalDecimal).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleGuardarVenta}
                disabled={isSubmitting}
                className="w-full bg-zinc-100 text-zinc-900 hover:bg-zinc-200 h-14 text-base font-bold rounded-lg mt-2"
              >
                {isSubmitting ? (
                  <Loader2 className="h-6 w-6 mr-2 animate-spin" />
                ) : (
                  <FileText className="h-5 w-5 mr-2 text-zinc-700" />
                )}
                Confirmar Despacho y Emitir Factura PDF
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* ================= TABLA DE HISTORIAL ================= */}
      <Card className="bg-card border-border shadow-xl">
        <CardHeader className="border-b border-zinc-800/50 pb-4">
          <CardTitle className="text-lg">Auditoría de Transacciones</CardTitle>
          <CardDescription>Registro inmutable de los despachos realizados en el sistema.</CardDescription>
        </CardHeader>
        <CardContent className="pt-4 p-0 sm:p-6">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="text-zinc-400 w-30">Nro. Factura</TableHead>
                <TableHead className="text-zinc-400">Datos del Cliente</TableHead>
                <TableHead className="text-zinc-400">Surtidor Físico</TableHead>
                <TableHead className="text-right text-zinc-400">Volumen</TableHead>
                <TableHead className="text-right text-zinc-400">Importe Final</TableHead>
                <TableHead className="text-right text-zinc-400">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ventas.map((venta) => {
                // Obtenemos el nombre del combustible de la base de datos para la tabla
                const combustible = venta.surtidor_mangueras?.tanques?.combustible || "Desc.";
                const badgeStyle = getEstiloCombustible(combustible);

                return (
                  <TableRow key={venta.id} className="border-border/50 hover:bg-zinc-800/30 transition-colors">
                    <TableCell className="font-mono font-bold text-zinc-200">
                      <Badge variant="outline" className="bg-zinc-900 border-zinc-700 text-zinc-300">
                        {venta.factura_nro}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-zinc-300">
                      {venta.clientes?.razon_social ? (
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{venta.clientes.razon_social}</span>
                          <span className="text-[10px] text-zinc-500 font-mono tracking-wider">NIT: {venta.clientes.nit_ci}</span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center text-xs font-medium text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded">
                          S/N (Sin Nombre)
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-zinc-300">
                      <div className="flex flex-col gap-1.5 items-start">
                        <span className="font-bold text-zinc-200 text-sm leading-none">{venta.surtidores?.codigo_surtidor || "Desconocido"}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-zinc-500 font-mono leading-none">M{venta.surtidor_mangueras?.numero_manguera}</span>
                          {/* 👇 Etiqueta de color dinámica en la tabla histórica */}
                          <Badge variant="outline" className={`text-[9px] uppercase h-4 px-1 py-0 leading-none ${badgeStyle}`}>
                            {combustible}
                          </Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-zinc-300 font-mono font-medium text-sm">
                      {venta.litros} L
                    </TableCell>
                    <TableCell className="text-right font-medium font-mono text-emerald-400 text-base">
                      Bs {Number(venta.total).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-zinc-400 hover:text-emerald-400 hover:bg-emerald-400/10 h-8 w-8 p-0 rounded-full"
                        onClick={() => generarFacturaPDF(venta)}
                        title="Re-imprimir Factura"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
              {ventas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-zinc-500 h-32">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FileText className="w-6 h-6 opacity-50" />
                      <span>El historial de transacciones está vacío.</span>
                    </div>
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