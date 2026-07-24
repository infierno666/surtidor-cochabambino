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
import { User, Shield, Database, LogOut, TerminalSquare } from "lucide-react"
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
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Configuración del Sistema</h1>
        <p className="text-muted-foreground mt-1">Preferencias de cuenta, seguridad y parámetros globales.</p>
      </div>

      <Tabs defaultValue="cuenta" className="w-full">
        <TabsList className="bg-zinc-900 border border-zinc-800">
          <TabsTrigger value="cuenta" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100">
            <User className="w-4 h-4 mr-2" />
            Cuenta
          </TabsTrigger>
          <TabsTrigger value="seguridad" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100">
            <Shield className="w-4 h-4 mr-2" />
            Seguridad & RLS
          </TabsTrigger>
          <TabsTrigger value="sistema" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100">
            <TerminalSquare className="w-4 h-4 mr-2" />
            Sistema
          </TabsTrigger>
        </TabsList>

        {/* PESTAÑA: CUENTA */}
        <TabsContent value="cuenta" className="mt-6 space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Perfil de Usuario</CardTitle>
              <CardDescription>
                Información personal vinculada a esta cuenta de operación.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-16 w-16 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xl font-bold text-zinc-300">
                  {perfil?.nombre_completo ? perfil.nombre_completo.substring(0, 2).toUpperCase() : 'US'}
                </div>
                <div>
                  <h3 className="text-lg font-medium text-zinc-100">{perfil?.nombre_completo || "Cargando..."}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                      Rol: {perfil?.rol?.toUpperCase()}
                    </Badge>
                    <span className="text-sm text-zinc-500">{email}</span>
                  </div>
                </div>
              </div>
              <Separator className="bg-zinc-800" />
              <div className="grid gap-4 md:grid-cols-2 pt-4">
                <div className="space-y-2">
                  <Label>Nombre Completo</Label>
                  <Input readOnly value={perfil?.nombre_completo || ""} className="bg-zinc-900 border-border text-zinc-400" />
                </div>
                <div className="space-y-2">
                  <Label>Correo Electrónico</Label>
                  <Input readOnly value={email} className="bg-zinc-900 border-border text-zinc-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PESTAÑA: SEGURIDAD & RLS */}
        <TabsContent value="seguridad" className="mt-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Políticas de Acceso (RLS)</CardTitle>
              <CardDescription>
                Estado actual de la seguridad a nivel de fila en PostgreSQL.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-zinc-950 p-4 rounded-md border border-zinc-800 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-medium text-zinc-300">Tabla: ventas</span>
                  </div>
                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-500">Protegida</Badge>
                </div>
                <p className="text-xs text-zinc-500 font-mono">Solo usuarios autenticados pueden insertar. Solo ADMIN puede editar/eliminar.</p>
                <Separator className="bg-zinc-800" />
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-medium text-zinc-300">Tabla: tanques (Inventario)</span>
                  </div>
                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-500">Protegida</Badge>
                </div>
                <p className="text-xs text-zinc-500 font-mono">Lectura global. Inserción/Eliminación estrictamente bloqueada a nivel ADMIN.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PESTAÑA: SISTEMA */}
        <TabsContent value="sistema" className="mt-6 space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Apariencia y Sesión</CardTitle>
              <CardDescription>
                Control de la sesión activa en el dispositivo actual.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-zinc-100">Tema de la Interfaz</h4>
                  <p className="text-sm text-zinc-500">El sistema opera en modo "SaaS Dark" por defecto para alto contraste.</p>
                </div>
                <Badge className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200">Dark Mode (Forzado)</Badge>
              </div>
              <Separator className="bg-zinc-800" />
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-destructive">Cerrar Sesión Segura</h4>
                  <p className="text-sm text-zinc-500">Destruirá el JWT y limpiará las cookies del navegador.</p>
                </div>
                <Button 
                  variant="destructive" 
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="bg-destructive hover:bg-destructive/90 text-zinc-100"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  {isLoggingOut ? "Saliendo..." : "Cerrar Sesión"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}