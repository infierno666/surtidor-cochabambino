"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { User, Shield, Database, LogOut, TerminalSquare, Mail, Lock, CheckCircle2, AlertTriangle } from "lucide-react"
import { toast } from "sonner"

export default function ConfiguracionPage() {
  const supabase = createClient()
  const router = useRouter()

  const [perfil, setPerfil] = useState<any>(null)
  const [email, setEmail] = useState<string>("")
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  useEffect(() => {
    const cargarPerfil = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setEmail(user.email || "")
        const { data: perfilData } = await supabase
          .from("perfiles")
          .select("*")
          .eq("id", user.id)
          .single()
        setPerfil(perfilData)
      }
    }
    cargarPerfil()
  }, [])

  const handleLogout = async () => {
    setIsLoggingOut(true)
    const { error } = await supabase.auth.signOut()

    if (error) {
      toast.error("Error al cerrar sesión.")
      setIsLoggingOut(false)
    } else {
      toast.success("Sesión cerrada correctamente.")
      router.push("/login")
      router.refresh()
    }
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-10">

      {/* ================= HEADER ================= */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Configuración del Sistema</h1>
          <p className="text-muted-foreground mt-1">Preferencias de cuenta, seguridad de bases de datos y parámetros globales[cite: 4].</p>
        </div>
      </div>

      {/* ================= TABS NAVIGATION ================= */}
      <Tabs defaultValue="cuenta" className="w-full">
        <TabsList className="bg-zinc-950 border border-zinc-800/80 p-1 h-14 rounded-xl shadow-inner w-full sm:w-auto flex overflow-x-auto">
          <TabsTrigger
            value="cuenta"
            className="rounded-lg px-6 data-[state=active]:bg-zinc-800/80 data-[state=active]:text-emerald-400 data-[state=active]:shadow-md transition-all"
          >
            <User className="w-4 h-4 mr-2" />
            Perfil de Usuario
          </TabsTrigger>
          <TabsTrigger
            value="seguridad"
            className="rounded-lg px-6 data-[state=active]:bg-zinc-800/80 data-[state=active]:text-emerald-400 data-[state=active]:shadow-md transition-all"
          >
            <Shield className="w-4 h-4 mr-2" />
            Seguridad & RLS
          </TabsTrigger>
          <TabsTrigger
            value="sistema"
            className="rounded-lg px-6 data-[state=active]:bg-zinc-800/80 data-[state=active]:text-emerald-400 data-[state=active]:shadow-md transition-all"
          >
            <TerminalSquare className="w-4 h-4 mr-2" />
            Sistema
          </TabsTrigger>
        </TabsList>

        {/* ================= PESTAÑA: CUENTA ================= */}
        <TabsContent value="cuenta" className="mt-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="bg-card border-border shadow-xl">
            <CardHeader className="border-b border-zinc-800/50 pb-6">
              <CardTitle className="text-xl flex items-center gap-2 text-zinc-100">
                <User className="w-5 h-5 text-emerald-500" />
                Información Personal
              </CardTitle>
              <CardDescription>
                Datos vinculados a esta cuenta de operación en la estación de servicio[cite: 4].
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-8">

              {/* Tarjeta de Avatar y Rol */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 bg-zinc-950/50 p-6 rounded-xl border border-zinc-800/50">
                <div className="relative">
                  <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700 flex items-center justify-center text-2xl font-black text-emerald-400 shadow-lg">
                    {perfil?.nombre_completo ? perfil.nombre_completo.substring(0, 2).toUpperCase() : 'US'}
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full border-2 border-zinc-950 flex items-center justify-center">
                    <CheckCircle2 className="w-3 h-3 text-zinc-950 font-bold" />
                  </div>
                </div>
                <div className="text-center sm:text-left space-y-1">
                  <h3 className="text-2xl font-bold text-zinc-100 tracking-tight">{perfil?.nombre_completo || "Cargando..."}</h3>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2">
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 px-3 py-1 font-mono uppercase tracking-wider">
                      {perfil?.rol || "OPERADOR"}
                    </Badge>
                    <span className="flex items-center text-sm text-zinc-400 font-medium bg-zinc-900 px-3 py-1 rounded-md border border-zinc-800">
                      <Mail className="w-3 h-3 mr-2 text-zinc-500" />
                      {email}
                    </span>
                  </div>
                </div>
              </div>

              {/* Formulario de solo lectura */}
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-zinc-400 ml-1">Nombre Completo Registrado</Label>
                  <div className="relative">
                    <Input
                      readOnly
                      value={perfil?.nombre_completo || ""}
                      className="bg-zinc-950 border-zinc-800 text-zinc-300 font-medium h-12 pl-10 focus-visible:ring-0 cursor-default"
                    />
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400 ml-1">Correo Electrónico de Acceso</Label>
                  <div className="relative">
                    <Input
                      readOnly
                      value={email}
                      className="bg-zinc-950 border-zinc-800 text-zinc-300 font-medium h-12 pl-10 focus-visible:ring-0 cursor-default"
                    />
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ================= PESTAÑA: SEGURIDAD & RLS ================= */}
        <TabsContent value="seguridad" className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="bg-card border-border shadow-xl">
            <CardHeader className="border-b border-zinc-800/50 pb-6">
              <CardTitle className="text-xl flex items-center gap-2 text-zinc-100">
                <Shield className="w-5 h-5 text-emerald-500" />
                Políticas de Acceso (RLS)
              </CardTitle>
              <CardDescription>
                Auditoría en tiempo real del estado de seguridad a nivel de fila en PostgreSQL[cite: 4].
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">

              <div className="grid md:grid-cols-2 gap-4">
                {/* Modulo Ventas */}
                <div className="bg-zinc-950 p-5 rounded-xl border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.03)] hover:border-emerald-500/40 transition-colors group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-500/10 rounded-lg group-hover:bg-emerald-500/20 transition-colors">
                        <Database className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-zinc-200">Tabla: ventas</h4>
                        <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-0.5">Módulo Transaccional</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/5 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Protegida
                    </Badge>
                  </div>
                  <div className="bg-zinc-900/50 rounded-lg p-3 border border-zinc-800/50">
                    <p className="text-xs text-zinc-400 font-medium leading-relaxed">
                      <span className="text-emerald-500/80 font-bold">✓</span> Solo usuarios autenticados pueden insertar registros.<br />
                      <span className="text-amber-500/80 font-bold">⚠</span> Edición o eliminación restringida al rol ADMIN.
                    </p>
                  </div>
                </div>

                {/* Modulo Tanques */}
                <div className="bg-zinc-950 p-5 rounded-xl border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.03)] hover:border-emerald-500/40 transition-colors group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-500/10 rounded-lg group-hover:bg-emerald-500/20 transition-colors">
                        <Database className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-zinc-200">Tabla: tanques</h4>
                        <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-0.5">Inventario Físico</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/5 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Protegida
                    </Badge>
                  </div>
                  <div className="bg-zinc-900/50 rounded-lg p-3 border border-zinc-800/50">
                    <p className="text-xs text-zinc-400 font-medium leading-relaxed">
                      <span className="text-emerald-500/80 font-bold">✓</span> Lectura global habilitada para dashboards.<br />
                      <span className="text-destructive/80 font-bold">✕</span> Inserción/Eliminación estructural estrictamente bloqueada.
                    </p>
                  </div>
                </div>
              </div>

            </CardContent>
          </Card>
        </TabsContent>

        {/* ================= PESTAÑA: SISTEMA ================= */}
        <TabsContent value="sistema" className="mt-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="bg-card border-border shadow-xl">
            <CardHeader className="border-b border-zinc-800/50 pb-6">
              <CardTitle className="text-xl flex items-center gap-2 text-zinc-100">
                <TerminalSquare className="w-5 h-5 text-emerald-500" />
                Apariencia y Sesión
              </CardTitle>
              <CardDescription>
                Control de entorno y gestión de la sesión activa en el dispositivo[cite: 4].
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-2">

              {/* Opción de Tema */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-zinc-950/50 rounded-xl border border-zinc-800/50 gap-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-zinc-200">Tema de la Interfaz Visual</h4>
                  <p className="text-xs text-zinc-500 font-medium max-w-[400px]">El sistema opera en modo "SaaS Dark" por defecto para garantizar alto contraste en entornos industriales.</p>
                </div>
                <Badge className="bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700 px-4 py-1.5 font-medium shadow-inner shrink-0">
                  Dark Mode (Forzado)
                </Badge>
              </div>

              {/* Zona de Peligro (Logout) */}
              <div className="mt-8 border border-destructive/30 bg-destructive/5 rounded-xl overflow-hidden shadow-[0_0_15px_rgba(239,68,68,0.05)]">
                <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div className="flex items-start gap-4">
                    <div className="mt-1 bg-destructive/10 p-2 rounded-full">
                      <AlertTriangle className="w-5 h-5 text-destructive" />
                    </div>
                    <div className="space-y-1.5">
                      <h4 className="text-sm font-bold text-destructive">Cerrar Sesión Segura</h4>
                      <p className="text-xs text-zinc-400 font-medium max-w-[400px]">
                        Esta acción destruirá el token JWT actual y limpiará las credenciales cacheadas en este navegador. Se requerirá autenticación para volver a ingresar.
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="bg-destructive hover:bg-destructive/90 text-white font-bold px-6 h-12 shadow-lg shrink-0 w-full sm:w-auto"
                  >
                    {isLoggingOut ? (
                      <>
                        <Lock className="w-4 h-4 mr-2 animate-pulse" />
                        Cerrando Sesión...
                      </>
                    ) : (
                      <>
                        <LogOut className="w-4 h-4 mr-2" />
                        Desconectar Equipo
                      </>
                    )}
                  </Button>
                </div>
              </div>

            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}