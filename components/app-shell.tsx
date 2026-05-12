"use client"

import type { ReactNode } from "react"
import { useState } from "react"
import { Sidebar } from "@/components/sidebar"

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <>
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <main className="flex-1 overflow-y-auto bg-background">{children}</main>
    </>
  )
}
