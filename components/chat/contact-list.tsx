"use client"

import { cn } from "@/lib/utils"
import { Search, SlidersHorizontal, Flag, Filter, ChevronDown, Bot, Contact, Pencil, Check, CheckCheck } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"

interface ContactTag {
  label: string
  color: "purple" | "blue" | "green" | "red" | "orange" | "pink"
}

interface Contact {
  id: string
  name: string
  lastMessage: string
  time: string
  unreadCount?: number
  avatar?: string
  isUrgent?: boolean
  tags?: ContactTag[]
  hasBlueCheck?: boolean
  messageStatus?: "sent" | "delivered" | "read"
}

const contacts: Contact[] = [
  {
    id: "1",
    name: "Tournieux App",
    lastMessage: "agora se voce fizer com seu lo...",
    time: "14:17",
    unreadCount: 35,
    tags: [{ label: "Clinica", color: "blue" }],
  },
  {
    id: "2",
    name: "Luiz Fernando Cappato",
    lastMessage: "Mídia/Outro",
    time: "14:09",
  },
  {
    id: "3",
    name: "Roseli Ponce Olivetti",
    lastMessage: "Mídia/Outro",
    time: "14:07",
  },
  {
    id: "4",
    name: "Rosane Cristina Monroe",
    lastMessage: "Mídia/Outro",
    time: "13:58",
  },
  {
    id: "5",
    name: "Matheus Magni",
    lastMessage: "*Meyri:*",
    time: "13:56",
    hasBlueCheck: true,
    tags: [
      { label: "TxHM", color: "green" },
      { label: "TxHM", color: "orange" },
      { label: "Minoxidil", color: "purple" },
    ],
  },
  {
    id: "6",
    name: "Maria Lucia Zuccolotto",
    lastMessage: "Mídia/Outro",
    time: "13:53",
    hasBlueCheck: true,
  },
  {
    id: "7",
    name: "Tournieux- Assessoria de Impr...",
    lastMessage: "Mídia/Outro",
    time: "13:49",
    isUrgent: true,
    unreadCount: 1880,
    tags: [{ label: "MKT", color: "blue" }],
  },
  {
    id: "8",
    name: "MKT",
    lastMessage: "Coloca na nossa lista",
    time: "13:45",
    hasBlueCheck: true,
    tags: [{ label: "MKT", color: "blue" }],
  },
  {
    id: "9",
    name: "Plasticamp",
    lastMessage: "Carla, boa tarde! Tudo bem?",
    time: "13:43",
    avatar: "/plasticamp.jpg",
  },
  {
    id: "10",
    name: "Clinica PENDENCIAS",
    lastMessage: "Audio para Ademar",
    time: "13:39",
    hasBlueCheck: true,
  },
]

const filters = [
  { label: "Todos", value: "all", active: true },
  { label: "Chats IA", value: "ai", active: false },
  { label: "Meus Chats", value: "mine", active: false },
]

const tagColors: Record<ContactTag["color"], string> = {
  purple: "bg-purple-500 text-white",
  blue: "bg-blue-500 text-white",
  green: "bg-green-500 text-white",
  red: "bg-red-500 text-white",
  orange: "bg-orange-500 text-white",
  pink: "bg-pink-500 text-white",
}

interface ContactListProps {
  selectedId?: string
  onSelect?: (id: string) => void
}

export function ContactList({ selectedId = "1", onSelect }: ContactListProps) {
  return (
    <div className="flex h-full w-[320px] flex-col border-r border-border bg-card">
      {/* Header with User Profile and Toggles */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Avatar className="h-9 w-9">
          <AvatarImage src="" alt="Pedro" />
          <AvatarFallback className="bg-gradient-to-br from-teal-600 to-teal-800 text-white text-xs">
            P
          </AvatarFallback>
        </Avatar>
        <span className="font-medium text-foreground">Pedro</span>
        
        <div className="ml-auto flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 4v6h6M23 20v-6h-6M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
            </svg>
          </Button>
          <div className="flex items-center">
            <Pencil className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
            <Switch className="scale-75 data-[state=checked]:bg-primary" />
          </div>
          <div className="flex items-center">
            <Bot className="mr-1 h-4 w-4 text-muted-foreground" />
            <Switch className="scale-75 data-[state=checked]:bg-primary" defaultChecked />
          </div>
          <Contact className="h-4 w-4 text-muted-foreground cursor-pointer" />
        </div>
      </div>

      {/* Search */}
      <div className="border-b border-border p-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Procure a conversa"
              className="h-9 pl-9 bg-secondary border-0 text-sm"
            />
          </div>
          <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
            <Flag className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filters Dropdown */}
      <div className="border-b border-border px-3 py-2">
        <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <Filter className="h-3.5 w-3.5" />
          <span>Filtros</span>
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-border">
        {filters.map((filter) => (
          <button
            key={filter.value}
            className={cn(
              "flex-1 py-2.5 text-sm font-medium transition-colors",
              filter.active
                ? "border-b-2 border-foreground text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Contact List */}
      <div className="flex-1 overflow-y-auto">
        {contacts.map((contact) => (
          <button
            key={contact.id}
            onClick={() => onSelect?.(contact.id)}
            className={cn(
              "flex w-full items-start gap-3 border-b border-border/50 p-3 text-left transition-colors hover:bg-secondary/50",
              selectedId === contact.id && "bg-secondary"
            )}
          >
            <Avatar className="h-11 w-11 shrink-0">
              <AvatarImage src={contact.avatar} alt={contact.name} />
              <AvatarFallback className="bg-muted text-muted-foreground text-sm font-medium">
                {contact.name
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 overflow-hidden min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate font-medium text-foreground text-sm">
                  {contact.name}
                </span>
                <div className="flex shrink-0 items-center gap-1.5">
                  <span className={cn(
                    "text-xs",
                    contact.isUrgent ? "text-red-500 font-medium" : "text-muted-foreground"
                  )}>
                    {contact.time}
                  </span>
                </div>
              </div>
              
              <div className="mt-0.5 flex items-center gap-1">
                {contact.hasBlueCheck && (
                  <CheckCheck className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                )}
                <p className="truncate text-sm text-muted-foreground">
                  {contact.lastMessage}
                </p>
                {contact.unreadCount && (
                  <Badge className={cn(
                    "ml-auto h-5 min-w-5 shrink-0 px-1.5 text-[10px] font-medium",
                    contact.isUrgent 
                      ? "bg-red-500 text-white" 
                      : "bg-green-500 text-white"
                  )}>
                    {contact.unreadCount}
                  </Badge>
                )}
              </div>

              {/* Tags */}
              {contact.tags && contact.tags.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {contact.tags.map((tag, index) => (
                    <Badge 
                      key={index} 
                      className={cn(
                        "h-5 px-1.5 text-[10px] font-medium border-0",
                        tagColors[tag.color]
                      )}
                    >
                      {tag.label}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
