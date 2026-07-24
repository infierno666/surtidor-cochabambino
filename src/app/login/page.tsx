'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Fuel, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [modo, setModo] = useState<'login' | 'registro'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nombreCompleto, setNombreCompleto] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)

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
      setError(error.message)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-card border-border text-card-foreground shadow-2xl">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 mb-2">
            <Fuel className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
            Surtidor Cochabambino
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {modo === 'login' 
              ? 'Ingresa tus credenciales para acceder al panel' 
              : 'Regístrate para solicitar acceso al sistema'}
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded-md">
                {error}
              </div>
            )}

            {modo === 'registro' && (
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre Completo</Label>
                <Input
                  id="nombre"
                  type="text"
                  placeholder="Juan Pérez"
                  value={nombreCompleto}
                  onChange={(e) => setNombreCompleto(e.target.value)}
                  required
                  className="bg-zinc-900 border-border text-foreground"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="operador@surtidor.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-zinc-900 border-border text-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="bg-zinc-900 border-border text-foreground"
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 pt-2">
            <Button 
              type="submit" 
              disabled={cargando}
              className="w-full bg-zinc-100 text-zinc-900 hover:bg-zinc-200 font-medium"
            >
              {cargando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : modo === 'login' ? (
                'Iniciar Sesión'
              ) : (
                'Crear Cuenta'
              )}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setModo(modo === 'login' ? 'registro' : 'login')}
                className="text-xs text-zinc-400 hover:text-zinc-100 transition-colors"
              >
                {modo === 'login' 
                  ? '¿No tienes cuenta? Regístrate aquí' 
                  : '¿Ya tienes cuenta? Inicia sesión'}
              </button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </main>
  )
}