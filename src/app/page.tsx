// src/app/page.tsx
import { redirect } from "next/navigation"

export default function RootPage() {
  // Redirige la raíz directamente al dashboard protegido
  redirect("/dashboard")
}