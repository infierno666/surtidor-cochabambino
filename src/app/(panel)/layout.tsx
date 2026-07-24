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

  // Validación de Rol
  const { data: perfil } = await supabase
    .from('perfiles')
    .select('rol, nombre_completo')
    .eq('id', user.id)
    .single()

  if (perfil?.rol !== 'admin') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center space-y-4">
        <AlertOctagon className="w-16 h-16 text-destructive" />
        <h1 className="text-2xl font-bold text-foreground">Acceso Restringido</h1>
        <p className="text-muted-foreground">Tu cuenta no tiene privilegios de administrador para operar el Surtidor.</p>
      </div>
    )
  }

  return (
    <SidebarProvider>
      {/* Pasamos los datos dinámicos al Sidebar para el Footer */}
      <AppSidebar perfil={perfil} email={user.email || ""} />
      
      {/* SidebarInset envuelve el contenido principal para animaciones fluidas */}
      <SidebarInset className="flex-1 flex flex-col min-h-screen bg-background overflow-hidden">
        
        {/* Topbar ultra minimalista */}
        <header className="flex h-16 shrink-0 items-center gap-4 border-b border-border/50 px-4 transition-[width,height] ease-linear">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="-ml-1 text-zinc-400 hover:text-zinc-100 transition-colors" />
            <div className="h-4 w-px bg-zinc-800" /> {/* Separador visual */}
            <span className="text-sm font-medium text-zinc-500 tracking-wide">
              Módulo Operativo Cochabamba
            </span>
          </div>
        </header>
        
        {/* Contenedor dinámico de la página */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}