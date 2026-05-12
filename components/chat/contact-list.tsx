"use client"

import type { UIEvent } from "react"
import { useMemo, useState } from "react"
import { Bot, CheckCheck, ChevronDown, Contact, Filter, Flag, Pencil, Search, SlidersHorizontal } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { ChatRecord } from "@/lib/supabase-rest"

interface ContactListProps {
  chats: ChatRecord[]
  search: string
  isLoading?: boolean
  isLoadingMore?: boolean
  isSearching?: boolean
  hasMore?: boolean
  selectedId?: string
  onSearchChange?: (value: string) => void
  onSelect?: (id: string) => void
  onLoadMore?: () => void
}

const filters = [
  { label: "Todos", value: "all" },
  { label: "Chats IA", value: "ai" },
  { label: "Meus Chats", value: "mine" },
]

function getDisplayName(chat: ChatRecord) {
  return chat.nome_contato || chat.pushname || chat.chat_id?.replace("@s.whatsapp.net", "") || "Contato sem nome"
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

function getTime(chat: ChatRecord) {
  if (chat.last_message_time) {
    return new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Sao_Paulo",
    }).format(new Date(chat.last_message_time))
  }

  return chat.last_time_formatado ?? ""
}

function parseTags(chat: ChatRecord): string[] {
  const candidates = [chat.json_tags_parsed, chat.json_tags, chat.tag_chat_array]

  for (const candidate of candidates) {
    if (!candidate) continue

    if (Array.isArray(candidate)) {
      return candidate
        .map((tag) => {
          if (typeof tag === "string") return tag
          if (tag && typeof tag === "object" && "label" in tag) return String(tag.label)
          if (tag && typeof tag === "object" && "name" in tag) return String(tag.name)
          return ""
        })
        .filter(Boolean)
    }

    if (typeof candidate === "string") {
      try {
        const parsed = JSON.parse(candidate)
        if (Array.isArray(parsed)) return parsed.map(String)
      } catch {
        return candidate
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
      }
    }
  }

  return chat.Status_chat ? [chat.Status_chat] : []
}

export function ContactList({
  chats,
  search,
  isLoading,
  isLoadingMore,
  isSearching,
  hasMore,
  selectedId,
  onSearchChange,
  onSelect,
  onLoadMore,
}: ContactListProps) {
  const [activeFilter, setActiveFilter] = useState("all")

  const filteredChats = useMemo(() => {
    return chats.filter((chat) => {
      if (activeFilter === "ai" && !chat.ia_responde) return false
      if (activeFilter === "mine" && !chat.dono) return false
      return true
    })
  }, [activeFilter, chats])

  function handleListScroll(event: UIEvent<HTMLDivElement>) {
    const target = event.currentTarget
    const distanceFromBottom = target.scrollHeight - target.scrollTop - target.clientHeight

    if (distanceFromBottom < 160 && hasMore && !isLoadingMore && !search.trim()) {
      onLoadMore?.()
    }
  }

  return (
    <div className="flex h-full w-[340px] shrink-0 flex-col border-r border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Avatar className="h-9 w-9">
          <AvatarFallback className="bg-gradient-to-br from-teal-600 to-teal-800 text-xs text-white">
            P
          </AvatarFallback>
        </Avatar>
        <span className="font-medium text-foreground">Pedro</span>

        <div className="ml-auto flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
          <div className="flex items-center">
            <Pencil className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
            <Switch className="scale-75 data-[state=checked]:bg-primary" />
          </div>
          <div className="flex items-center">
            <Bot className="mr-1 h-4 w-4 text-muted-foreground" />
            <Switch className="scale-75 data-[state=checked]:bg-primary" defaultChecked />
          </div>
          <Contact className="h-4 w-4 cursor-pointer text-muted-foreground" />
        </div>
      </div>

      <div className="border-b border-border p-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => onSearchChange?.(event.target.value)}
              placeholder="Procure a conversa"
              className="h-9 border-0 bg-secondary pl-9 text-sm"
            />
          </div>
          <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
            <Flag className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="border-b border-border px-3 py-2">
        <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <Filter className="h-3.5 w-3.5" />
          <span>Filtros</span>
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex border-b border-border">
        {filters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setActiveFilter(filter.value)}
            className={cn(
              "flex-1 py-2.5 text-sm font-medium transition-colors",
              activeFilter === filter.value
                ? "border-b-2 border-foreground text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto" onScroll={handleListScroll}>
        {isLoading || isSearching ? (
          <div className="p-4 text-sm text-muted-foreground">Carregando conversas...</div>
        ) : filteredChats.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">Nenhuma conversa encontrada.</div>
        ) : (
          filteredChats.map((chat) => {
            const name = getDisplayName(chat)
            const tags = parseTags(chat).slice(0, 3)

            return (
              <button
                key={chat.id}
                onClick={() => onSelect?.(chat.id)}
                className={cn(
                  "flex w-full items-start gap-3 border-b border-border/50 p-3 text-left transition-colors hover:bg-secondary/50",
                  selectedId === chat.id && "bg-secondary",
                )}
              >
                <Avatar className="h-11 w-11 shrink-0">
                  <AvatarImage src={chat.url_foto_perfil ?? undefined} alt={name} />
                  <AvatarFallback className="bg-muted text-sm font-medium text-muted-foreground">
                    {getInitials(name)}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1 overflow-hidden">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-foreground">{name}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{getTime(chat)}</span>
                  </div>

                  <div className="mt-0.5 flex items-center gap-1">
                    {chat.last_message_time && chat.text_last_message && (
                      <CheckCheck className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                    )}
                    <p className="truncate text-sm text-muted-foreground">
                      {chat.text_last_message || "Sem mensagens recentes"}
                    </p>
                    {!!chat.unread_count && (
                      <Badge className="ml-auto h-5 min-w-5 shrink-0 bg-green-500 px-1.5 text-[10px] font-medium text-white">
                        {chat.unread_count}
                      </Badge>
                    )}
                  </div>

                  {tags.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {tags.map((tag) => (
                        <Badge
                          key={tag}
                          className="h-5 border-0 bg-teal-600 px-1.5 text-[10px] font-medium text-white"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </button>
            )
          })
        )}
        {!isLoading && !search.trim() && (
          <div className="p-3">
            {hasMore ? (
              <Button
                variant="ghost"
                className="h-9 w-full text-sm text-muted-foreground"
                disabled={isLoadingMore}
                onClick={onLoadMore}
              >
                {isLoadingMore ? "Carregando mais conversas..." : "Carregar mais conversas"}
              </Button>
            ) : chats.length > 0 ? (
              <p className="py-2 text-center text-xs text-muted-foreground">Todas as conversas carregadas</p>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}
