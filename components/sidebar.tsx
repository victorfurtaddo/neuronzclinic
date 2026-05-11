"use client";

import { cn } from "@/lib/utils";
import { LayoutDashboard, MessageSquare, Calendar, CheckSquare, Users, BarChart3, Settings, Activity } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", active: true, href: "/" },
  { icon: MessageSquare, label: "Chats", active: false, href: "/chats" },
  { icon: Calendar, label: "Agendas", active: false, href: "/agendas" },
  { icon: CheckSquare, label: "Tarefas", active: false, href: "/tarefas" },
  { icon: Users, label: "Pacientes", active: false, href: "#" },
  { icon: BarChart3, label: "Relatórios", active: false, href: "#" },
  { icon: Settings, label: "Configurações", active: false, href: "#" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 flex-col bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
          <Activity className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-sidebar-foreground">MedClinic</h1>
          <p className="text-xs text-sidebar-muted">Sistema de Gestão</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground" // Estilo ativo
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src="/placeholder-avatar.jpg" alt="Dr. João Silva" />
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">JS</AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium text-sidebar-foreground">Dr. João Silva</p>
            <p className="truncate text-xs text-sidebar-muted">Cardiologista</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

