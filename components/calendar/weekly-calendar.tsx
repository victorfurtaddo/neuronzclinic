"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  UserPlus,
  Circle,
  Stethoscope,
  User,
  Search,
} from "lucide-react"

// Days of the week for the calendar
const weekDays = [
  { day: "seg.", date: "04/05", fullDate: "2026-05-04" },
  { day: "ter.", date: "05/05", fullDate: "2026-05-05" },
  { day: "qua.", date: "06/05", fullDate: "2026-05-06" },
  { day: "qui.", date: "07/05", fullDate: "2026-05-07" },
  { day: "sex.", date: "08/05", fullDate: "2026-05-08", isToday: true },
  { day: "sáb.", date: "09/05", fullDate: "2026-05-09" },
]

// Time slots from 6am to 9pm
const timeSlots = Array.from({ length: 16 }, (_, i) => {
  const hour = i + 6
  return {
    hour,
    label: hour.toString().padStart(2, "0"),
  }
})

// Sample appointments
const appointments = [
  {
    id: 1,
    professional: "Dra. Tatiana",
    phone: "5511995943388",
    type: "Retorno Pediatria",
    day: "2026-05-08",
    startHour: 8,
    endHour: 9,
    color: "bg-primary/10 border-primary",
  },
]

type ViewType = "Mês" | "Semana" | "Dia" | "Lista"

export function WeeklyCalendar() {
  const [activeView, setActiveView] = useState<ViewType>("Semana")
  const views: ViewType[] = ["Mês", "Semana", "Dia", "Lista"]

  // Get current time for the indicator
  const now = new Date()
  const currentHour = now.getHours()
  const currentMinutes = now.getMinutes()
  const currentTimePosition = ((currentHour - 6) * 60 + currentMinutes) / 60

  return (
    <div className="flex h-screen flex-1 flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-4">
          {/* Date Navigation */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-lg font-semibold text-foreground">
              4 - 9 de mai. de 2026
            </span>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" />
            Novo Agendamento
          </Button>
          <Button variant="outline" className="gap-2">
            <UserPlus className="h-4 w-4" />
            Novo Paciente
          </Button>
        </div>
      </header>

      {/* View Tabs */}
      <div className="border-b border-border px-6 py-3">
        <div className="flex gap-1">
          {views.map((view) => (
            <button
              key={view}
              onClick={() => setActiveView(view)}
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                activeView === view
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {view}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Calendar Grid */}
        <div className="flex-1 overflow-auto">
          {/* Day Headers */}
          <div className="sticky top-0 z-10 flex border-b border-border bg-card">
            {/* Time column spacer */}
            <div className="w-16 flex-shrink-0 border-r border-border" />
            
            {/* Day columns */}
            {weekDays.map((day) => (
              <div
                key={day.fullDate}
                className={cn(
                  "flex-1 border-r border-border px-2 py-3 text-center last:border-r-0",
                  day.isToday && "bg-primary/5"
                )}
              >
                <p
                  className={cn(
                    "text-xs uppercase tracking-wide",
                    day.isToday ? "font-semibold text-primary" : "text-muted-foreground"
                  )}
                >
                  {day.day}
                </p>
                <p
                  className={cn(
                    "mt-0.5 text-sm",
                    day.isToday ? "font-bold text-primary" : "font-medium text-foreground"
                  )}
                >
                  {day.date}
                </p>
              </div>
            ))}
          </div>

          {/* Time Grid */}
          <div className="relative">
            {/* Current Time Indicator */}
            {currentHour >= 6 && currentHour < 22 && (
              <div
                className="absolute left-0 right-0 z-20 flex items-center"
                style={{ top: `${currentTimePosition * 60}px` }}
              >
                <div className="h-3 w-3 rounded-full bg-destructive" />
                <div className="h-0.5 flex-1 bg-destructive" />
              </div>
            )}

            {timeSlots.map((slot) => (
              <div key={slot.hour} className="flex h-[60px]">
                {/* Time Label */}
                <div className="flex w-16 flex-shrink-0 items-start justify-end border-r border-border pr-2 pt-0">
                  <span className="text-xs font-bold text-muted-foreground">
                    {slot.label}
                  </span>
                </div>

                {/* Day Cells */}
                {weekDays.map((day) => (
                  <div
                    key={`${day.fullDate}-${slot.hour}`}
                    className={cn(
                      "relative flex-1 border-b border-r border-border last:border-r-0",
                      day.isToday && "bg-primary/5"
                    )}
                  >
                    {/* Render appointments */}
                    {appointments
                      .filter(
                        (apt) =>
                          apt.day === day.fullDate && apt.startHour === slot.hour
                      )
                      .map((apt) => (
                        <div
                          key={apt.id}
                          className={cn(
                            "absolute inset-x-1 top-1 z-10 cursor-pointer rounded-lg border-l-4 p-2 transition-shadow hover:shadow-md",
                            apt.color
                          )}
                          style={{
                            height: `${(apt.endHour - apt.startHour) * 60 - 8}px`,
                          }}
                        >
                          <div className="flex items-start gap-2">
                            <Stethoscope className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-primary" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-semibold text-foreground">
                                {apt.professional}
                              </p>
                              <p className="truncate text-xs text-muted-foreground">
                                {apt.phone}
                              </p>
                              <p className="mt-1 truncate text-xs font-medium text-primary">
                                {apt.type}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Filters Panel */}
        <aside className="w-72 flex-shrink-0 border-l border-border bg-card p-4">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Filtros</h3>
          
          <div className="space-y-4">
            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                Status
              </label>
              <Select defaultValue="todos">
                <SelectTrigger className="w-full">
                  <div className="flex items-center gap-2">
                    <Circle className="h-3 w-3 fill-success text-success" />
                    <SelectValue placeholder="Selecione o status" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">
                    <div className="flex items-center gap-2">
                      <Circle className="h-3 w-3 fill-muted-foreground text-muted-foreground" />
                      Todos
                    </div>
                  </SelectItem>
                  <SelectItem value="confirmado">
                    <div className="flex items-center gap-2">
                      <Circle className="h-3 w-3 fill-success text-success" />
                      Confirmado
                    </div>
                  </SelectItem>
                  <SelectItem value="pendente">
                    <div className="flex items-center gap-2">
                      <Circle className="h-3 w-3 fill-warning text-warning" />
                      Pendente
                    </div>
                  </SelectItem>
                  <SelectItem value="cancelado">
                    <div className="flex items-center gap-2">
                      <Circle className="h-3 w-3 fill-destructive text-destructive" />
                      Cancelado
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Type Filter */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                Tipo
              </label>
              <Select defaultValue="todos">
                <SelectTrigger className="w-full">
                  <div className="flex items-center gap-2">
                    <Stethoscope className="h-3.5 w-3.5 text-muted-foreground" />
                    <SelectValue placeholder="Selecione o tipo" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="consulta">Consulta</SelectItem>
                  <SelectItem value="retorno">Retorno</SelectItem>
                  <SelectItem value="exame">Exame</SelectItem>
                  <SelectItem value="procedimento">Procedimento</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Professional Filter */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                Profissional
              </label>
              <Select defaultValue="todos">
                <SelectTrigger className="w-full">
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    <SelectValue placeholder="Selecione o profissional" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="tatiana">Dra. Tatiana</SelectItem>
                  <SelectItem value="joao">Dr. João Silva</SelectItem>
                  <SelectItem value="maria">Dra. Maria Santos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Patient Filter */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                Paciente
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar paciente..."
                  className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
