"use client"

import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"

export function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background">
      <h1 className="text-4xl font-semibold tracking-tight text-foreground text-balance">Miraki Jewels</h1>
      <Button asChild>
        <Link to="/platform/super-admin/login">Login</Link>
      </Button>
    </main>
  )
}
