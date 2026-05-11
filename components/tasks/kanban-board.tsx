"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Search,
  Plus,
  CheckCircle2,
  AlertCircle,
  Clock,
  MoreHorizontal,
  ChevronDown,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type TaskType = "tarefa" | "pendencia"
type TaskStatus = "aguardando" | "resolvendo" | "finalizado"

interface Task {
  id: string
  description: string
  creator: string
  creatorInitials: string
  responsible: string
  responsibleInitials: string
  type: TaskType
  status: TaskStatus
  date: string
  time: string
}

const tasks: Task[] = [
  {
    id: "1",
    description: "Confirmar retorno do paciente Carlos Alberto para dia 15/05",
    creator: "Carla",
    creatorInitials: "CA",
    responsible: "Dra. Tatiana",
    responsibleInitials: "DT",
    type: "tarefa",
    status: "aguardando",
    date: "8 Mai 2026",
    time: "15:58",
  },
  {
    id: "2",
    description: "Solicitar exames laboratoriais para Maria Santos",
    creator: "Dra. Tatiana",
    creatorInitials: "DT",
    responsible: "Carla",
    responsibleInitials: "CA",
    type: "pendencia",
    status: "aguardando",
    date: "8 Mai 2026",
    time: "14:30",
  },
  {
    id: "3",
    description: "Ligar para paciente José Oliveira sobre resultado de exame",
    creator: "Dr. João",
    creatorInitials: "DJ",
    responsible: "Recepção",
    responsibleInitials: "RC",
    type: "tarefa",
    status: "aguardando",
    date: "8 Mai 2026",
    time: "11:20",
  },
  {
    id: "4",
    description: "Verificar disponibilidade de sala para procedimento",
    creator: "Carla",
    creatorInitials: "CA",
    responsible: "Dr. João",
    responsibleInitials: "DJ",
    type: "tarefa",
    status: "resolvendo",
    date: "7 Mai 2026",
    time: "16:45",
  },
  {
    id: "5",
    description: "Atualizar prontuário da paciente Ana Costa",
    creator: "Dra. Tatiana",
    creatorInitials: "DT",
    responsible: "Carla",
    responsibleInitials: "CA",
    type: "pendencia",
    status: "resolvendo",
    date: "7 Mai 2026",
    time: "10:15",
  },
  {
    id: "6",
    description: "Enviar orçamento para plano de saúde Unimed",
    creator: "Carla",
    creatorInitials: "CA",
    responsible: "Financeiro",
    responsibleInitials: "FN",
    type: "tarefa",
    status: "resolvendo",
    date: "6 Mai 2026",
    time: "09:00",
  },
  {
    id: "7",
    description: "Reagendar consulta do paciente Pedro Lima",
    creator: "Recepção",
    creatorInitials: "RC",
    responsible: "Carla",
    responsibleInitials: "CA",
    type: "tarefa",
    status: "finalizado",
    date: "5 Mai 2026",
    time: "17:30",
  },
  {
    id: "8",
    description: "Confirmar entrega de medicamentos manipulados",
    creator: "Dra. Tatiana",
    creatorInitials: "DT",
    responsible: "Recepção",
    responsibleInitials: "RC",
    type: "pendencia",
    status: "finalizado",
    date: "5 Mai 2026",
    time: "14:00",
  },
]

const statusConfig: Record<TaskStatus, { label: string; color: string; borderColor: string }> = {
  aguardando: {
    label: "Aguardando",
    color: "bg-amber-50",
    borderColor: "border-l-amber-400",
  },
  resolvendo: {
    label: "Resolvendo",
    color: "bg-blue-50",
    borderColor: "border-l-blue-400",
  },
  finalizado: {
    label: "Finalizados",
    color: "bg-emerald-50",
    borderColor: "border-l-emerald-400",
  },
}

const typeConfig: Record<TaskType, { label: string; icon: React.ReactNode; className: string }> = {
  tarefa: {
    label: "Tarefa",
    icon: <CheckCircle2 className="h-3 w-3" />,
    className: "bg-primary/10 text-primary",
  },
  pendencia: {
    label: "Pendência",
    icon: <AlertCircle className="h-3 w-3" />,
    className: "bg-destructive/10 text-destructive",
  },
}

function TaskCard({ task }: { task: Task }) {
  const typeInfo = typeConfig[task.type]
  const statusInfo = statusConfig[task.status]

  return (
    <div
      className={cn(
        "group rounded-lg border border-l-4 bg-card p-4 shadow-sm transition-shadow hover:shadow-md",
        statusInfo.borderColor
      )}
    >
      {/* Header: Creator & Type */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="bg-muted text-[10px] font-medium text-muted-foreground">
              {task.creatorInitials}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground">- {task.creator}</span>
        </div>
        <div
          className={cn(
            "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
            typeInfo.className
          )}
        >
          {typeInfo.icon}
          {typeInfo.label}
        </div>
      </div>

      {/* Description */}
      <p className="mb-4 text-sm leading-relaxed text-foreground">{task.description}</p>

      {/* Footer: Responsible & Date */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="bg-primary/10 text-[10px] font-medium text-primary">
              {task.responsibleInitials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Responsável
            </span>
            <span className="text-xs font-medium text-foreground">{task.responsible}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>
            {task.date}, {task.time}
          </span>
        </div>
      </div>

      {/* Hover Actions */}
      <div className="mt-3 flex justify-end opacity-0 transition-opacity group-hover:opacity-100">
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

function KanbanColumn({ status, tasks }: { status: TaskStatus; tasks: Task[] }) {
  const config = statusConfig[status]
  const filteredTasks = tasks.filter((t) => t.status === status)

  return (
    <div className="flex min-w-[340px] flex-1 flex-col">
      {/* Column Header */}
      <div
        className={cn(
          "mb-4 flex items-center justify-between rounded-lg px-4 py-3",
          config.color
        )}
      >
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-foreground">{config.label}</h3>
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-card px-1.5 text-xs font-medium text-muted-foreground">
            {filteredTasks.length}
          </span>
        </div>
      </div>

      {/* Tasks */}
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto pb-4">
        {filteredTasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  )
}

export function KanbanBoard() {
  const [activeTab, setActiveTab] = useState<"tarefas" | "avisos">("tarefas")
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <div className="flex h-screen flex-1 flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card px-6 py-4">
        <div className="flex flex-col gap-4">
          {/* Title Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveTab("tarefas")}
                className={cn(
                  "px-1 pb-2 text-lg font-semibold transition-colors",
                  activeTab === "tarefas"
                    ? "border-b-2 border-primary text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Tarefas
              </button>
              <span className="px-2 text-muted-foreground">|</span>
              <button
                onClick={() => setActiveTab("avisos")}
                className={cn(
                  "px-1 pb-2 text-lg font-semibold transition-colors",
                  activeTab === "avisos"
                    ? "border-b-2 border-primary text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Avisos
              </button>
            </div>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Tarefa
            </Button>
          </div>

          {/* Filters Row */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar tarefas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Filter Dropdowns */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  Criador
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>Todos</DropdownMenuItem>
                <DropdownMenuItem>Carla</DropdownMenuItem>
                <DropdownMenuItem>Dra. Tatiana</DropdownMenuItem>
                <DropdownMenuItem>Dr. João</DropdownMenuItem>
                <DropdownMenuItem>Recepção</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  Responsável
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>Todos</DropdownMenuItem>
                <DropdownMenuItem>Carla</DropdownMenuItem>
                <DropdownMenuItem>Dra. Tatiana</DropdownMenuItem>
                <DropdownMenuItem>Dr. João</DropdownMenuItem>
                <DropdownMenuItem>Recepção</DropdownMenuItem>
                <DropdownMenuItem>Financeiro</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  Tipo
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>Todos</DropdownMenuItem>
                <DropdownMenuItem>
                  <CheckCircle2 className="mr-2 h-4 w-4 text-primary" />
                  Tarefa
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <AlertCircle className="mr-2 h-4 w-4 text-destructive" />
                  Pendência
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Kanban Columns */}
      <div className="flex flex-1 gap-6 overflow-x-auto p-6">
        <KanbanColumn status="aguardando" tasks={tasks} />
        <KanbanColumn status="resolvendo" tasks={tasks} />
        <KanbanColumn status="finalizado" tasks={tasks} />
      </div>
    </div>
  )
}
