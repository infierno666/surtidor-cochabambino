"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard, Fuel, Droplet, ListOrdered,
  Settings, ChartColumn, ChevronsUpDown, LogOut
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

const items = [
  { title: "Panel de Control", url: "/dashboard", icon: LayoutDashboard },
  { title: "Ventas (ALU)", url: "/ventas", icon: ListOrdered },
  { title: "Monitor Tanques", url: "/tanques", icon: Droplet },
  { title: "Surtidores (CRUD)", url: "/surtidores", icon: Fuel },
  { title: "Inventario", url: "/inventario", icon: ChartColumn },
  { title: "Configuración", url: "/configuracion", icon: Settings },
]

export function AppSidebar({ perfil, email }: { perfil: any, email: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const initials = perfil?.nombre_completo ? perfil.nombre_completo.substring(0, 2).toUpperCase() : 'AD'

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast.error("Error al cerrar sesión.")
    } else {
      toast.success("Sesión cerrada correctamente.")
      router.push("/login")
      router.refresh()
    }
  }

  return (
    <Sidebar collapsible="icon" className="border-r border-zinc-800/60 bg-zinc-950/50">

      {/* Cabecera del Sidebar */}
      <SidebarHeader className="h-16 flex justify-center border-b border-zinc-800/60">
        <div className="flex items-center gap-3 px-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-zinc-950 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all group-hover:scale-105">
            <Fuel className="h-5 w-5 shrink-0" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden overflow-hidden">
            <span className="truncate font-bold text-zinc-100 tracking-wide">Surtidor Ch.</span>
            <span className="truncate text-[10px] uppercase tracking-wider text-emerald-500 font-medium">Planta Operativa</span>
          </div>
        </div>
      </SidebarHeader>

      {/* Contenido Principal */}
      <SidebarContent className="pt-6">
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden text-zinc-500 font-mono uppercase tracking-widest text-[10px] mb-3 px-3 overflow-hidden transition-all duration-200">
            Módulos del Sistema
          </SidebarGroupLabel>
          <SidebarMenu className="space-y-1.5 px-2">
            {items.map((item) => {
              const isActive = pathname.startsWith(item.url)
              return (
                <SidebarMenuItem key={item.title}>
                  {/* Se envuelve el botón en un Link, sin usar asChild para evitar conflictos TS */}
                  <Link href={item.url} className="block w-full outline-none" tabIndex={-1}>
                    <SidebarMenuButton
                      tooltip={item.title}
                      className={`w-full transition-all duration-200 rounded-lg h-10 ${isActive
                          ? "bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20 shadow-sm"
                          : "text-zinc-400 font-medium hover:text-zinc-100 hover:bg-zinc-800/60 border border-transparent"
                        }`}
                    >
                      <item.icon className={`h-4 w-4 shrink-0 ${isActive ? "text-emerald-400" : "text-zinc-500"}`} />
                      {/* Las clases de Shadcn manejarán la ocultación del texto sin cortar los íconos */}
                      <span className="truncate group-data-[collapsible=icon]:hidden">{item.title}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer con Menú de Usuario Avanzado */}
      <SidebarFooter className="border-t border-zinc-800/60 p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger className="flex w-full items-center gap-3 rounded-xl p-2 text-left outline-none transition-all hover:bg-zinc-800/60 text-zinc-400 hover:text-zinc-100 data-[state=open]:bg-zinc-800 data-[state=open]:text-zinc-100 border border-transparent hover:border-zinc-700/50">
                <Avatar className="h-9 w-9 shrink-0 rounded-lg border-2 border-zinc-800 shadow-sm">
                  {/* Se corrigió la sintaxis de Tailwind v4: bg-linear-to-br */}
                  <AvatarFallback className="rounded-lg bg-linear-to-br from-zinc-800 to-zinc-900 text-xs font-black text-emerald-400">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-sm leading-tight group-data-[collapsible=icon]:hidden overflow-hidden">
                  <span className="truncate font-bold text-zinc-100">{perfil?.nombre_completo || 'Operador'}</span>
                  <span className="truncate text-[10px] text-zinc-500 font-mono mt-0.5">{email}</span>
                </div>
                <ChevronsUpDown className="ml-auto size-4 shrink-0 text-zinc-500 group-data-[collapsible=icon]:hidden" />
              </DropdownMenuTrigger>

              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-xl bg-zinc-950/95 backdrop-blur-xl border-zinc-800 shadow-2xl p-2"
                side="right"
                align="end"
                sideOffset={12}
              >
                <div className="px-2 py-3 font-normal">
                  <div className="flex items-center gap-3 text-left text-sm">
                    <Avatar className="h-10 w-10 shrink-0 rounded-lg border-2 border-emerald-500/20 shadow-inner">
                      <AvatarFallback className="rounded-lg bg-zinc-900 text-emerald-400 font-bold">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight overflow-hidden">
                      <span className="truncate font-bold text-zinc-100">{perfil?.nombre_completo || 'Admin'}</span>
                      <span className="truncate text-[10px] font-mono text-zinc-400 mt-0.5">{email}</span>
                    </div>
                  </div>
                </div>

                <DropdownMenuSeparator className="bg-zinc-800/80 my-1" />

                <DropdownMenuItem
                  onClick={() => router.push('/configuracion')}
                  className="cursor-pointer text-zinc-300 font-medium focus:bg-zinc-800 focus:text-zinc-100 rounded-md py-2.5"
                >
                  <Settings className="mr-2 h-4 w-4 shrink-0 text-zinc-500" /> Configuración de Cuenta
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-zinc-800/80 my-1" />

                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer text-destructive font-bold focus:bg-destructive/10 focus:text-destructive rounded-md py-2.5"
                >
                  <LogOut className="mr-2 h-4 w-4 shrink-0" /> Desconectar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail className="hover:bg-zinc-800/50 transition-colors" />
    </Sidebar>
  )
}