"use client";

import { cn } from "@/lib/utils";
import { LayoutDashboard, MessageSquare, Calendar, CheckSquare, Users, BarChart3, Settings, Activity, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "./ui/button";
import { Avatar } from "@radix-ui/react-avatar";
import { Logo } from "./ui/logo";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: MessageSquare, label: "Chats", href: "/chats" },
  { icon: Calendar, label: "Agendas", href: "/agendas" },
  { icon: CheckSquare, label: "Tarefas", href: "/tarefas" },
  { icon: Users, label: "Pacientes", href: "/pacientes" },
  { icon: BarChart3, label: "Relatórios", href: "/relatorios" },
  { icon: Settings, label: "Configurações", href: "/configuracoes" },
];

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

export function Sidebar({ isCollapsed, setIsCollapsed }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className={cn("relative flex h-screen flex-col transition-all duration-300 ease-in-out border-r", isCollapsed ? "w-[68px]" : "w-[200px]")}>
      <Logo isCollapsed={isCollapsed}></Logo>

      <Button onClick={() => setIsCollapsed(!isCollapsed)} className="absolute top-1/2 right-0 translate-x-[50%] translate-y-[-50%] h-14 w-4 rounded-sm shadow-md !p-0">
        {isCollapsed ? <ChevronRight /> : <ChevronLeft />}
      </Button>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4 w-full">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              title={isCollapsed ? item.label : ""} // Mostra o nome ao passar o mouse se estiver colapsado
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground" // Estilo ativo
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <span className={cn("transition-all whitespace-nowrap", isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100")}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="border-t p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 shrink-0 bg-white rounded-sm">{/* ... Avatar code ... */}</Avatar>
          {!isCollapsed && (
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium">Dr. João Silva</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

