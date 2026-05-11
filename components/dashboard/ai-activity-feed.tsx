"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bot, MessageSquare, Calendar, AlertTriangle, CheckCircle } from "lucide-react"

const activities = [
  {
    icon: MessageSquare,
    message: "IA respondeu 15 pacientes hoje",
    time: "Há 5 min",
    type: "info",
  },
  {
    icon: Calendar,
    message: "IA agendou 3 consultas automaticamente",
    time: "Há 12 min",
    type: "success",
  },
  {
    icon: AlertTriangle,
    message: "IA alertou sobre agendamento duplicado",
    time: "Há 28 min",
    type: "warning",
  },
  {
    icon: CheckCircle,
    message: "IA confirmou 8 consultas via WhatsApp",
    time: "Há 1 hora",
    type: "success",
  },
  {
    icon: MessageSquare,
    message: "IA respondeu dúvida sobre horário",
    time: "Há 2 horas",
    type: "info",
  },
]

const iconStyles = {
  info: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning-foreground",
}

export function AIActivityFeed() {
  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg font-semibold text-foreground">
            Resumo de Atividades da IA
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <div key={index} className="flex items-start gap-3">
              <div
                className={`rounded-lg p-2 ${iconStyles[activity.type as keyof typeof iconStyles]}`}
              >
                <activity.icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {activity.message}
                </p>
                <p className="text-xs text-muted-foreground">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
