"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "lucide-react"

const appointments = [
  {
    time: "08:00",
    patient: "Maria Santos",
    initials: "MS",
    procedure: "Consulta de Rotina",
    professional: "Dr. João Silva",
    status: "confirmado",
  },
  {
    time: "08:30",
    patient: "Carlos Oliveira",
    initials: "CO",
    procedure: "Eletrocardiograma",
    professional: "Dr. João Silva",
    status: "confirmado",
  },
  {
    time: "09:00",
    patient: "Ana Pereira",
    initials: "AP",
    procedure: "Retorno",
    professional: "Dra. Paula Costa",
    status: "pendente",
  },
  {
    time: "09:30",
    patient: "Roberto Lima",
    initials: "RL",
    procedure: "Avaliação Cardíaca",
    professional: "Dr. João Silva",
    status: "confirmado",
  },
  {
    time: "10:00",
    patient: "Fernanda Souza",
    initials: "FS",
    procedure: "Primeira Consulta",
    professional: "Dra. Paula Costa",
    status: "confirmado",
  },
]

export function AppointmentsTable() {
  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg font-semibold text-foreground">
            Próximas Consultas de Hoje
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Hora
                </th>
                <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Paciente
                </th>
                <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Tipo de Procedimento
                </th>
                <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Profissional
                </th>
                <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {appointments.map((appointment, index) => (
                <tr key={index} className="hover:bg-muted/50 transition-colors">
                  <td className="py-3 text-sm font-medium text-foreground">
                    {appointment.time}
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="" alt={appointment.patient} />
                        <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                          {appointment.initials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium text-foreground">
                        {appointment.patient}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 text-sm text-muted-foreground">
                    {appointment.procedure}
                  </td>
                  <td className="py-3 text-sm text-muted-foreground">
                    {appointment.professional}
                  </td>
                  <td className="py-3">
                    <Badge
                      variant={appointment.status === "confirmado" ? "default" : "secondary"}
                      className={
                        appointment.status === "confirmado"
                          ? "bg-success/10 text-success hover:bg-success/20"
                          : "bg-warning/10 text-warning-foreground hover:bg-warning/20"
                      }
                    >
                      {appointment.status === "confirmado" ? "Confirmado" : "Pendente"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
