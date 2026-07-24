"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { 
  LayoutDashboard, Fuel, Droplet, ListOrdered, 
  Settings, ChartColumn, ChevronsUpDown 
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
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const items = [
  { title: "Panel de Control", url: "/dashboard", icon: LayoutDashboard },
  { title: "Ventas (ALU)", url: "/ventas", icon: ListOrdered },
  { title: "Monitor Tanques", url: "/tanques", icon: Droplet },
  { title: "Gestión Bombas", url: "/bombas", icon: Fuel },
  { title: "Inventario", url: "/inventario", icon: ChartColumn },
  { title: "Configuración", url: "/configuracion", icon: Settings },
]

export function AppSidebar({ perfil, email }: { perfil: any, email: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const initials = perfil?.nombre_completo ? perfil.nombre_completo.substring(0, 2).toUpperCase() : 'AD'

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50">
      
      {/* Cabecera del Sidebar */}
      <SidebarHeader className="h-16 flex justify-center border-b border-border/50">
        <div className="flex items-center gap-3 px-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
            <Fuel className="h-5 w-5" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate font-semibold text-zinc-100">Surtidor Ch.</span>
            <span className="truncate text-xs text-zinc-500">Sistema Operativo</span>
          </div>
        </div>
      </SidebarHeader>

      {/* Contenido Principal */}
      <SidebarContent className="pt-4">
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden text-zinc-500 uppercase tracking-wider text-xs mb-2">
            Navegación
          </SidebarGroupLabel>
          <SidebarMenu>
            {items.map((item) => {
              const isActive = pathname.startsWith(item.url)
              return (
                <SidebarMenuItem key={item.title}>
                  {/* Envolvemos el botón con Link directamente, sin asChild */}
                  <Link href={item.url} className="block w-full">
                    <SidebarMenuButton 
                      tooltip={item.title} 
                      className={`w-full transition-all duration-200 ${
                        isActive 
                          ? "bg-zinc-800 text-zinc-100 font-medium" 
                          : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50"
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer con Menú de Usuario */}
      <SidebarFooter className="border-t border-border/50 p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              {/* Estilizamos el Trigger nativo para evitar conflictos de botones */}
              <DropdownMenuTrigger className="flex w-full items-center gap-2 rounded-md p-2 text-left outline-none transition-colors hover:bg-zinc-800/50 text-zinc-400 hover:text-zinc-100 data-[state=open]:bg-zinc-800 data-[state=open]:text-zinc-100">
                <Avatar className="h-8 w-8 rounded-lg border border-zinc-800">
                  <AvatarFallback className="rounded-lg bg-zinc-900 text-xs font-bold text-zinc-300">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-sm leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate font-semibold text-zinc-100">{perfil?.nombre_completo || 'Admin'}</span>
                  <span className="truncate text-xs text-zinc-500">{email}</span>
                </div>
                <ChevronsUpDown className="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
              </DropdownMenuTrigger>
              
              <DropdownMenuContent 
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg bg-zinc-950 border-zinc-800 shadow-xl" 
                side="right" 
                align="end" 
                sideOffset={4}
              >
                <div className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-2 py-2 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg border border-zinc-800">
                      <AvatarFallback className="rounded-lg bg-zinc-900 text-zinc-300">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold text-zinc-100">{perfil?.nombre_completo || 'Admin'}</span>
                      <span className="truncate text-xs text-zinc-500">{email}</span>
                    </div>
                  </div>
                </div>
                <DropdownMenuSeparator className="bg-zinc-800" />
                <DropdownMenuItem 
                  onClick={() => router.push('/configuracion')} 
                  className="cursor-pointer text-zinc-300 focus:bg-zinc-800 focus:text-zinc-100"
                >
                  <Settings className="mr-2 h-4 w-4"/> Configuración
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      
      <SidebarRail />
    </Sidebar>
  )
}