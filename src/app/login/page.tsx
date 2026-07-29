'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Eye, EyeOff, Fuel, Loader2, Mail, Lock, User, ArrowRight, Activity, TerminalSquare, CheckCircle2 } from 'lucide-react'
import { AnimatedBackground } from '@/components/login/AnimatedBackground'

// Colores reales de combustible para una UI más inmersiva e industrial
const TANQUES = [
  { nombre: 'Especial', pct: 75, color: 'from-emerald-500 to-emerald-400', shadow: 'shadow-emerald-500/30', text: 'text-emerald-400' },
  { nombre: 'Premium', pct: 30, color: 'from-amber-500 to-amber-400', shadow: 'shadow-amber-500/30', text: 'text-amber-400' },
  { nombre: 'Diésel', pct: 12, color: 'from-orange-500 to-orange-400', shadow: 'shadow-orange-500/30', text: 'text-orange-400' },
  { nombre: 'GNV', pct: 85, color: 'from-blue-500 to-blue-400', shadow: 'shadow-blue-500/30', text: 'text-blue-400' },
] as const

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [modo, setModo] = useState<'login' | 'registro'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nombreCompleto, setNombreCompleto] = useState('')
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)

  // Orquestación de animaciones de entrada
  const [visible, setVisible] = useState(false)
  const [barrasListas, setBarrasListas] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 100)
    const t2 = setTimeout(() => setBarrasListas(true), 600)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setCargando(true)

    const { error } =
      modo === 'login'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
          email,
          password,
          options: { data: { nombre_completo: nombreCompleto } },
        })

    setCargando(false)

    if (error) {
      setError(error.message === "Invalid login credentials" ? "Credenciales incorrectas. Verifica tu correo y contraseña." : error.message)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  // Helpers para animaciones secuenciales ultra-fluidas (Cubic Bezier)
  const fadeUp = (delayMs: number) =>
    cn(
      'transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none motion-reduce:transform-none',
      visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
    )
  const fadeUpStyle = (delayMs: number) => ({ transitionDelay: `${delayMs}ms` })

  return (
    <main className="min-h-screen bg-zinc-950 flex relative overflow-hidden selection:bg-emerald-500/30 selection:text-emerald-200">

      {/* Fondo Interactivo (Z-index más bajo para que quede al fondo) */}
      <div className="absolute inset-0 z-0">
        <AnimatedBackground />
      </div>

      {/* Textura de ruido sutil por encima del fondo animado para darle un toque premium */}
      <div className="absolute inset-0 z-0 opacity-[0.15] bg-[radial-gradient(circle_at_1.5px_1.5px,var(--tw-colors-emerald-500)_1.5px,transparent_0)] bg-[size:32px_32px] pointer-events-none [mask-image:radial-gradient(ellipse_at_center,black_10%,transparent_80%)]" />

      {/* ========================================================= */}
      {/* PANEL IZQUIERDO (HERO / BRANDING) */}
      {/* ========================================================= */}
      <div className="hidden lg:flex lg:w-[50%] xl:w-[55%] flex-col justify-between border-r border-zinc-800/40 bg-zinc-950/40 backdrop-blur-2xl p-16 relative z-10">

        {/* Logo / Cabecera */}
        <div className={cn('relative flex items-center gap-4 group cursor-default', fadeUp(0))} style={fadeUpStyle(0)}>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500 text-zinc-950 shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
            <Fuel className="h-6 w-6 shrink-0" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-wider text-zinc-100 uppercase">
              Surtidor 67
            </span>
            <span className="text-xs font-medium tracking-widest text-emerald-500 uppercase">
              Plataforma de Telemetría
            </span>
          </div>
        </div>

        {/* Contenido Central */}
        <div className="relative space-y-12 max-w-2xl">
          <div className={cn('space-y-5', fadeUp(150))} style={fadeUpStyle(150)}>
            <div className="inline-flex items-center gap-2 rounded-full bg-zinc-900/60 border border-zinc-700/50 px-4 py-1.5 text-xs font-medium text-zinc-300 backdrop-blur-md shadow-sm">
              <TerminalSquare className="w-3.5 h-3.5 text-emerald-400" />
              <span className="opacity-80">Versión del Sistema</span> <span className="text-emerald-400 font-bold">2.4.0</span>
            </div>
            <h1 className="text-5xl lg:text-6xl font-black leading-[1.1] tracking-tight text-zinc-100 text-balance">
              Operación industrial impulsada por <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-300 to-emerald-600 animate-gradient">inteligencia y control exacto.</span>
            </h1>
          </div>

          {/* Miniatura de Telemetría Realística (Glassmorphism Avanzado) */}
          <div
            className={cn(
              'rounded-2xl border border-zinc-700/30 bg-zinc-900/40 p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden group',
              fadeUp(300)
            )}
            style={fadeUpStyle(300)}
          >
            {/* Brillo dinámico superior */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-700" />

            <div className="mb-6 flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" /> Monitor Físico
              </span>
              <span className="flex items-center gap-2 font-mono text-[11px] text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                Sincronizado
              </span>
            </div>

            <div className="flex items-stretch justify-around gap-6 h-36">
              {TANQUES.map((t, i) => (
                <div key={t.nombre} className="flex flex-1 flex-col items-center gap-3">
                  <div className="relative flex flex-1 w-full items-end overflow-hidden rounded-t-sm rounded-b-md bg-zinc-950/80 border border-zinc-800/80 shadow-inner">
                    <div className="absolute inset-0 flex flex-col justify-between py-2 opacity-20 pointer-events-none">
                      <div className="w-full h-px bg-zinc-500" />
                      <div className="w-full h-px bg-zinc-500" />
                      <div className="w-full h-px bg-zinc-500" />
                    </div>
                    <div
                      className={cn(
                        'w-full bg-gradient-to-t transition-[height] duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] relative shadow-[0_0_20px_rgba(var(--tw-shadow-color),0.6)]',
                        t.color, t.shadow
                      )}
                      style={{
                        height: barrasListas ? `${t.pct}%` : '0%',
                        transitionDelay: `${i * 120}ms`,
                      }}
                    >
                      <div className="absolute top-0 w-full h-1.5 bg-white/40 rounded-t-sm" />
                    </div>
                  </div>
                  <div className="text-center">
                    <span className={cn('block font-mono text-sm font-bold', t.text)}>{t.pct}%</span>
                    <span className="block text-[10px] text-zinc-500 uppercase tracking-widest mt-0.5">{t.nombre}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={cn('flex items-center gap-4 text-zinc-500', fadeUp(450))} style={fadeUpStyle(450)}>
          <p className="font-mono text-xs uppercase tracking-widest border-r border-zinc-800/80 pr-4">
            Cochabamba, Bolivia
          </p>
          <p className="font-mono text-xs uppercase tracking-widest text-emerald-500/70 flex items-center gap-1.5">
            <Lock className="w-3 h-3" /> Acceso Restringido
          </p>
        </div>
      </div>

      {/* ========================================================= */}
      {/* PANEL DERECHO (FORMULARIO) */}
      {/* ========================================================= */}
      <div className="flex flex-1 items-center justify-center p-6 relative z-20">
        <div className={cn('w-full max-w-md', fadeUp(200))} style={fadeUpStyle(200)}>

          {/* Logo móvil */}
          <div className="mb-10 flex items-center justify-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)]">
              <Fuel className="h-5 w-5 text-zinc-950 shrink-0" />
            </div>
            <span className="text-xl font-bold tracking-wider text-zinc-100 uppercase">
              Surtidor 67
            </span>
          </div>

          {/* Tarjeta de Formulario - Mayor transparencia para dejar ver el fondo animado */}
          <Card className="border-zinc-700/30 bg-zinc-950/50 backdrop-blur-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <CardHeader className="space-y-2 pb-8 pt-8 px-8">
              <h2 className="text-3xl font-black tracking-tight text-zinc-50">
                {modo === 'login' ? 'Acceso al Sistema' : 'Solicitar Acceso'}
              </h2>
              <p className="text-sm text-zinc-400 font-medium">
                {modo === 'login'
                  ? 'Ingresa tus credenciales operativas para continuar.'
                  : 'Registra tus datos para unirte a la red de operadores.'}
              </p>
            </CardHeader>

            <form onSubmit={handleSubmit} autoComplete="on">
              <CardContent className="space-y-5 px-8">

                {/* Mensaje de Error */}
                <div
                  className={cn(
                    "overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
                    error ? "max-h-24 opacity-100 mb-4 scale-100" : "max-h-0 opacity-0 scale-95"
                  )}
                >
                  <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive shadow-sm backdrop-blur-md">
                    <Activity className="h-4 w-4 shrink-0" />
                    <p className="font-medium leading-none">{error}</p>
                  </div>
                </div>

                {/* Campo: Nombre (Solo en Registro) */}
                <div
                  className={cn(
                    'space-y-2 overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]',
                    modo === 'registro' ? 'max-h-28 opacity-100' : 'max-h-0 opacity-0'
                  )}
                  aria-hidden={modo !== 'registro'}
                >
                  <Label htmlFor="nombre" className="text-zinc-300 font-medium ml-1">Nombre completo</Label>
                  <div className="relative group">
                    <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 transition-colors duration-300 group-focus-within:text-emerald-400" />
                    <Input
                      id="nombre"
                      type="text"
                      placeholder="Ej. Juan Pérez"
                      value={nombreCompleto}
                      onChange={(e) => setNombreCompleto(e.target.value)}
                      required={modo === 'registro'}
                      tabIndex={modo === 'registro' ? undefined : -1}
                      autoComplete="name"
                      className="border-zinc-700/50 bg-zinc-900/40 h-12 pl-10 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500 transition-all duration-300 hover:bg-zinc-900/60"
                    />
                  </div>
                </div>

                {/* Campo: Correo */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-zinc-300 font-medium ml-1">Correo electrónico</Label>
                  <div className="relative group">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 transition-colors duration-300 group-focus-within:text-emerald-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="operador@surtidor.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      className="border-zinc-700/50 bg-zinc-900/40 h-12 pl-10 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500 transition-all duration-300 hover:bg-zinc-900/60"
                    />
                  </div>
                </div>

                {/* Campo: Contraseña */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-zinc-300 font-medium ml-1">Contraseña</Label>
                  <div className="relative group">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 transition-colors duration-300 group-focus-within:text-emerald-400" />
                    <Input
                      id="password"
                      type={mostrarPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      autoComplete={modo === 'login' ? 'current-password' : 'new-password'}
                      className="border-zinc-700/50 bg-zinc-900/40 h-12 pl-10 pr-12 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500 transition-all duration-300 hover:bg-zinc-900/60 font-mono tracking-wider"
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarPassword((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 transition-colors hover:text-zinc-300 hover:bg-zinc-800/80"
                      aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {mostrarPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col space-y-6 pt-4 pb-10 px-8">
                {/* Botón Principal - Efecto Glow Fuerte */}
                <Button
                  type="submit"
                  disabled={cargando}
                  aria-busy={cargando}
                  className="w-full h-12 bg-emerald-500 font-bold text-zinc-950 transition-all duration-300 hover:bg-emerald-400 hover:shadow-[0_0_25px_rgba(16,185,129,0.4)] active:scale-[0.98] rounded-xl group"
                >
                  {cargando ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin text-zinc-800" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      {modo === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1.5" />
                    </>
                  )}
                </Button>

                {/* Switch Login/Registro */}
                <div className="relative w-full">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-zinc-700/50" />
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
                    <span className="bg-zinc-950/80 backdrop-blur-md px-3 text-zinc-500 border border-zinc-800/50 rounded-full py-0.5">
                      Acceso
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setModo(modo === 'login' ? 'registro' : 'login')
                    setError(null)
                  }}
                  className="text-center text-sm font-medium text-zinc-400 transition-colors duration-300 hover:text-emerald-400"
                >
                  {modo === 'login'
                    ? '¿Primera vez operando? Solicita acceso'
                    : '¿Ya posees credenciales? Inicia sesión'}
                </button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </main>
  )
}