import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { AlertOctagon } from "lucide-react"

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Validación de Rol[cite: 6]
  const { data: perfil } = await supabase
    .from('perfiles')
    .select('rol, nombre_completo')
    .eq('id', user.id)
    .single()

  if (perfil?.rol !== 'admin') {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 text-center space-y-6">
        <div className="bg-destructive/10 p-4 rounded-full border border-destructive/20 shadow-[0_0_30px_rgba(239,68,68,0.15)]">
          <AlertOctagon className="w-16 h-16 text-destructive" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-zinc-100 tracking-tight">Acceso Restringido</h1>
          <p className="text-zinc-400 max-w-md">Tu cuenta no tiene privilegios de administrador para operar la consola maestra del Surtidor.</p>
        </div>
      </div>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar perfil={perfil} email={user.email || ""} />

      {/* SidebarInset con gradiente radial de fondo para look Premium[cite: 6] */}
      <SidebarInset className="flex-1 flex flex-col min-h-screen bg-zinc-950 relative overflow-hidden">

        {/* Fondo sutil radial */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900/30 via-zinc-950 to-zinc-950 -z-10 pointer-events-none" />

        {/* Topbar Flotante (Glassmorphism)[cite: 6] */}
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-4 border-b border-zinc-800/60 bg-zinc-950/70 backdrop-blur-xl px-4 sm:px-6 transition-all duration-300">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="-ml-2 text-zinc-400 hover:text-emerald-400 transition-colors" />
            <div className="h-5 w-px bg-zinc-800" />
            <span className="text-xs sm:text-sm font-medium text-zinc-400 tracking-widest uppercase">
              Módulo Operativo <span className="text-zinc-600 mx-1">•</span> <span className="text-emerald-500">Cochabamba</span>
            </span>
          </div>
        </header>

        {/* Contenedor dinámico de la página[cite: 6] */}
        <div className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto">
          <div className="mx-auto max-w-7xl animate-in fade-in duration-700">
            {children}
          </div>
        </div>

      </SidebarInset>
    </SidebarProvider>
  )
}