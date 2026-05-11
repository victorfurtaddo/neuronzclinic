"use client"

import { Card, CardContent } from "@/components/ui/card"
import {
  Calendar,
  Users,
  Bot,
  TrendingUp,
  Clock,
} from "lucide-react"

const stats = [
  {
    label: "Consultas Hoje",
    value: "24",
    icon: Calendar,
    trend: "+12%",
    trendUp: true,
    description: "este mês",
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
  },
  {
    label: "Pacientes Ativos",
    value: "1.248",
    icon: Users,
    trend: "+5%",
    trendUp: true,
    description: "este mês",
    iconBg: "bg-accent/20",
    iconColor: "text-accent-foreground",
  },
  {
    label: "Respostas IA",
    value: "89",
    icon: Bot,
    trend: "+18%",
    trendUp: true,
    description: "esta semana",
    iconBg: "bg-chart-3/10",
    iconColor: "text-chart-3",
  },
  {
    label: "Tempo Médio",
    value: "32min",
    icon: Clock,
    trend: "-8%",
    trendUp: true,
    description: "por consulta",
    iconBg: "bg-chart-4/10",
    iconColor: "text-chart-4",
  },
]

export function StatsCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="overflow-hidden border-border bg-card shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className={`rounded-xl p-2.5 ${stat.iconBg}`}>
                <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
              </div>
              <div className="flex items-center gap-1 text-xs font-medium text-success">
                <TrendingUp className="h-3 w-3" />
                {stat.trend}
              </div>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold text-foreground">{stat.value}</p>
              <p className="mt-1 text-sm font-medium text-foreground">{stat.label}</p>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
