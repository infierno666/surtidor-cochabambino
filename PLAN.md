# 🗺️ Plan de Implementación — El Surtidor Cochabambino (FuelOps UI)

Este documento es la hoja de ruta que vamos a seguir mensaje por mensaje.
Cada fase termina en un estado que corre (`npm run dev`) antes de pasar a la siguiente.

---

## 0. Stack tecnológico definitivo

| Capa | Tecnología | Estado |
|---|---|---|
| Framework | Next.js 16 (App Router, Turbopack) | ✅ instalado |
| Lenguaje | TypeScript | ✅ instalado |
| Estilos | Tailwind CSS v4 | ✅ instalado |
| Componentes UI | **shadcn/ui** | 🆕 a instalar (fase 1) |
| Iconos | lucide-react | ✅ instalado |
| Gráficos (barras, dona) | **recharts** (vía `shadcn add chart`) | 🆕 a instalar (fase 1) |
| Utilidades de clases | clsx + tailwind-merge | ✅ instalado (shadcn los reutiliza en `lib/utils.ts`) |
| Formularios | react-hook-form + zod + @hookform/resolvers | ✅ instalado |
| Estado global (Observer) | zustand | ✅ instalado |
| Backend / BD | Supabase (Postgres + Auth + Realtime) | ✅ configurado |
| Testing | Jest + Testing Library | ✅ instalado |
| Deploy | Vercel | pendiente (fase final) |

No hay que instalar nada que ya tengamos. Lo único nuevo de toda la interfaz es **shadcn/ui** y **recharts** (shadcn lo trae solo al agregar el componente `chart`).

---

## 1. Estructura de carpetas objetivo

```
surtidor-cochabambino/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   ├── page.tsx                     → redirige a /dashboard o /login
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── (panel)/                     ← route group: layout compartido con sidebar
│   │       ├── layout.tsx               (Sidebar + Topbar, protegido por sesión)
│   │       ├── dashboard/page.tsx        → mockup 2 (KPIs, tanques en vivo, gráficos)
│   │       ├── ventas/page.tsx           → mockup 3 (tabla + filtros + nueva venta)
│   │       ├── bombas/page.tsx
│   │       ├── tanques/page.tsx          → estado binario + alertas + mapa de Karnaugh
│   │       ├── inventario/page.tsx
│   │       └── configuracion/page.tsx
│   │
│   ├── components/
│   │   ├── ui/                          ← generado por shadcn (button, card, table...)
│   │   ├── layout/
│   │   │   ├── sidebar.tsx
│   │   │   └── topbar.tsx
│   │   ├── dashboard/
│   │   │   ├── kpi-card.tsx
│   │   │   ├── tanque-gauge.tsx         (barra vertical del mockup)
│   │   │   ├── ventas-chart.tsx
│   │   │   └── distribucion-donut.tsx
│   │   ├── ventas/
│   │   │   ├── ventas-table.tsx
│   │   │   └── nueva-venta-dialog.tsx
│   │   └── logout-button.tsx            (ya existe, se mueve aquí)
│   │
│   ├── lib/
│   │   ├── supabase/                    (client.ts, server.ts, proxy.ts — ya existen)
│   │   ├── alu.ts                       (multiplicación binaria — mover la lógica que ya probamos en el HTML)
│   │   ├── logica-digital.ts            (decodificadores + tabla de verdad + K-map como datos)
│   │   ├── utils.ts                     (cn() — lo crea shadcn)
│   │   └── validations/
│   │       ├── venta.schema.ts          (zod)
│   │       └── tanque.schema.ts
│   │
│   ├── stores/
│   │   └── use-alertas-store.ts         (zustand + Realtime, patrón Observer)
│   │
│   ├── types/
│   │   └── database.ts                  (tipos generados: supabase gen types typescript)
│   │
│   └── proxy.ts                         (ya existe)
│
├── supabase/migrations/                 (ya existe)
├── jest.config.ts
└── components.json                      (lo crea shadcn init)
```

**Regla simple:** todo lo visual/reutilizable → `components/`; toda la lógica de negocio y Sistemas Digitales (ALU, decodificadores, validaciones) → `lib/`; todo lo que toca Supabase → `lib/supabase/`.

---

## 2. Paleta y estilo (leído de tus mockups)

- Fondo casi negro, tarjetas en gris muy oscuro con borde sutil — esto ya es exactamente el token system que usamos en el HTML de prueba, así que no partimos de cero.
- Acento verde-teal para positivo/activo, ámbar para pendiente/bajo, rojo para crítico/cancelado — mapea 1:1 con `LED_ROJO` / `LED_AMARILLO` / normal.
- Sidebar fija a la izquierda con ícono + texto, item activo resaltado.
- Tipografía tipo mono/técnica para números grandes (KPIs) — igual que ya diseñamos.

En shadcn, esto se logra eligiendo **base color "Neutral"** en el init y luego sobreescribiendo las variables CSS de `--primary` (verde-teal) en `globals.css`.

---

## 3. Fases (una por mensaje, en este orden)

- [ ] **Fase 1 — Fundación shadcn/ui**
  `npx shadcn@latest init`, elegir Neutral, ajustar `--primary` al verde-teal del mockup, agregar componentes base: `button card table badge input label select dialog dropdown-menu sidebar sonner separator tabs avatar chart skeleton`.

- [ ] **Fase 2 — Layout del panel**
  Route group `(panel)` con `layout.tsx` (Sidebar + Topbar de los mockups), protegido por sesión (mover la lógica de `redirect('/login')` aquí en vez de en cada página).

- [ ] **Fase 3 — Dashboard** (mockup 2)
  KPI cards, gauges verticales de tanques (reemplaza mi tabla de texto plano), gráfico de ventas (recharts bar), donut de distribución de combustible, tabla de últimas transacciones, estado de bombas.

- [ ] **Fase 4 — Ventas** (mockup 3)
  Tabla con buscador + filtros (fecha/combustible/bomba), modal "Nueva Venta" con `react-hook-form` + `zod`, mostrando el cálculo binario (ya lo tenemos en el HTML de prueba, se traduce a `lib/alu.ts`).

- [ ] **Fase 5 — Tanques y Alertas**
  Vista de tanques con nivel binario visual + el mapa de Karnaugh interactivo (ya prototipado) + lista de alertas en tiempo real vía Supabase Realtime (zustand store).

- [ ] **Fase 6 — Bombas e Inventario/Reportes**
  CRUD de bombas, vista de inventario/reportes agregados.

- [ ] **Fase 7 — Testing**
  Jest sobre `lib/alu.ts` y `lib/logica-digital.ts` (tabla de verdad completa).

- [ ] **Fase 8 — Deploy y cierre**
  Deploy en Vercel, actualizar README (checklist de evaluación), captura para el informe.

---

## 4. Qué necesito de ti antes de la Fase 1

Nada de código — solo confírmame el **color de acento exacto** si tienes uno en mente (o seguimos con el verde-teal `#10b981`-ish que ya se ve en tus mockups), y si el sidebar debe decir "Panel" o "Dashboard" (vi ambos en tus dos mockups).
