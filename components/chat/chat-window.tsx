"use client"

import Image from "next/image"
import type { UIEvent } from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import { Download, Eye, FileText, Mic, MoreHorizontal, Paperclip, PenLine, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { ChatRecord, MessageRecord } from "@/lib/supabase-rest"
import { ContactDetails } from "./contact-details"

interface ChatWindowProps {
  chat?: ChatRecord
  messages: MessageRecord[]
  isLoading?: boolean
  isLoadingOlder?: boolean
  hasMoreMessages?: boolean
  onLoadOlderMessages?: () => Promise<number>
  error?: string
}

function getDisplayName(chat?: ChatRecord) {
  return chat?.nome_contato || chat?.pushname || chat?.chat_id?.replace("@s.whatsapp.net", "") || "Selecione um chat"
}

function getDateLabel(value: string | null) {
  if (!value) return ""

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value))
}

function getTimeLabel(value: string | null) {
  if (!value) return ""

  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value))
}

function getMessageText(message: MessageRecord) {
  if (message.content) return message.content
  if (message.message_type) return `Midia: ${message.message_type}`
  return "Mensagem sem conteudo"
}

function getMediaUrl(message: MessageRecord) {
  if (message.public_media_url) return message.public_media_url
  if (message.media_url) return message.media_url

  const path = message.media_path?.replace(/^file\//, "")
  if (!path) return null

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_REST_URL?.replace(/\/rest\/v1\/?$/, "")
  return supabaseUrl ? `${supabaseUrl}/storage/v1/object/public/file/${path}` : null
}

function getMediaKind(message: MessageRecord) {
  const type = `${message.media_mime_type || ""} ${message.message_type || ""}`.toLowerCase()

  if (type.includes("sticker") || type.includes("figurinha")) return "sticker"
  if (type.includes("image")) return "image"
  if (type.includes("video")) return "video"
  if (type.includes("audio")) return "audio"
  return "file"
}

function getFileName(message: MessageRecord, mediaUrl: string) {
  const source = message.media_path || mediaUrl
  const name = source.split("?")[0]?.split("/").pop()
  return name ? decodeURIComponent(name) : message.media_mime_type || message.message_type || "Arquivo"
}

export function ChatWindow({
  chat,
  messages,
  isLoading,
  isLoadingOlder,
  hasMoreMessages,
  onLoadOlderMessages,
  error,
}: ChatWindowProps) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const previousScrollHeightRef = useRef<number | null>(null)

  const groupedMessages = useMemo(() => {
    return messages.reduce<Array<{ date: string; items: MessageRecord[] }>>((groups, message) => {
      const date = getDateLabel(message.timestamp_msg) || "Sem data"
      const lastGroup = groups[groups.length - 1]

      if (lastGroup?.date === date) {
        lastGroup.items.push(message)
      } else {
        groups.push({ date, items: [message] })
      }

      return groups
    }, [])
  }, [messages])

  useEffect(() => {
    const scrollArea = scrollAreaRef.current
    const previousScrollHeight = previousScrollHeightRef.current

    if (scrollArea && previousScrollHeight !== null) {
      scrollArea.scrollTop = scrollArea.scrollHeight - previousScrollHeight
      previousScrollHeightRef.current = null
      return
    }

    bottomRef.current?.scrollIntoView({ block: "end" })
  }, [messages.length, chat?.id])

  async function handleMessagesScroll(event: UIEvent<HTMLDivElement>) {
    if (!onLoadOlderMessages || !hasMoreMessages || isLoadingOlder || isLoading) return
    if (event.currentTarget.scrollTop > 120) return

    previousScrollHeightRef.current = event.currentTarget.scrollHeight
    const addedCount = await onLoadOlderMessages()

    if (addedCount === 0) {
      previousScrollHeightRef.current = null
    }
  }

  if (!chat) {
    return (
      <div className="flex flex-1 items-center justify-center bg-background text-sm text-muted-foreground">
        Nenhuma conversa disponivel.
      </div>
    )
  }

  return (
    <div className="flex h-full flex-1 overflow-hidden bg-background">
      <div className="flex flex-1 flex-col border-r border-border">
        <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsDetailsOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-teal-700 transition-opacity hover:opacity-90"
              aria-label="Abrir detalhes do contato"
            >
              <span className="text-sm font-semibold text-white">
                {getDisplayName(chat).slice(0, 1).toUpperCase()}
              </span>
            </button>
            <div className="flex min-w-0 flex-col">
              <span className="truncate font-medium leading-none text-foreground">{getDisplayName(chat)}</span>
              <span className="mt-1 text-[10px] text-muted-foreground">
                {chat.finalizada ? "Finalizada" : chat.ia_responde ? "IA responde" : "Atendimento aberto"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button className="bg-teal-500 px-4 font-medium text-white hover:bg-teal-600">
              {chat.finalizada ? "Reabrir" : "Finalizar"}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsDetailsOpen(!isDetailsOpen)}
              className={cn("text-muted-foreground hover:text-foreground", isDetailsOpen && "bg-muted")}
            >
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div
          ref={scrollAreaRef}
          className="flex-1 overflow-y-auto"
          onScroll={handleMessagesScroll}
          style={{
            backgroundColor: "#e5ddd5",
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 800 800'%3E%3Cg fill='none' stroke='%23d4cdc4' stroke-width='1'%3E%3Cpath d='M769 229L1037 260.9M927 880L731 737 702 614M927 880L1062 914'/%3E%3Cpath d='M-7 55L206 72 156 203M-7 55L-35 181 88 208'/%3E%3Cpath d='M203 360L151 461 45 393 92 266 203 360z'/%3E%3Cpath d='M568 65L713 159 659 279 442 234 568 65z'/%3E%3C/g%3E%3C/svg%3E")`,
            backgroundRepeat: "repeat",
          }}
        >
          <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col px-6 py-4">
            {isLoading ? (
              <div className="m-auto rounded bg-white/80 px-4 py-2 text-sm text-muted-foreground shadow-sm">
                Carregando mensagens...
              </div>
            ) : error ? (
              <div className="m-auto max-w-md rounded bg-white/90 px-4 py-3 text-sm text-red-600 shadow-sm">
                {error}
              </div>
            ) : groupedMessages.length === 0 ? (
              <div className="m-auto rounded bg-white/80 px-4 py-2 text-sm text-muted-foreground shadow-sm">
                Esta conversa ainda nao tem mensagens visiveis.
              </div>
            ) : (
              <>
                <div className="mb-2 flex justify-center">
                  {hasMoreMessages ? (
                    <Button
                      variant="ghost"
                      className="h-8 bg-white/70 px-3 text-xs text-muted-foreground shadow-sm hover:bg-white"
                      disabled={isLoadingOlder}
                      onClick={async () => {
                        const scrollArea = scrollAreaRef.current
                        if (scrollArea) previousScrollHeightRef.current = scrollArea.scrollHeight
                        const addedCount = await onLoadOlderMessages?.()
                        if (!addedCount) previousScrollHeightRef.current = null
                      }}
                    >
                      {isLoadingOlder ? "Carregando mensagens antigas..." : "Carregar mensagens antigas"}
                    </Button>
                  ) : (
                    <span className="rounded bg-white/70 px-3 py-1 text-xs text-muted-foreground shadow-sm">
                      Inicio do historico carregado
                    </span>
                  )}
                </div>

                {groupedMessages.map((group) => (
                  <div key={group.date}>
                    <div className="my-3 flex justify-center">
                      <span className="rounded bg-white/80 px-3 py-1 text-xs text-muted-foreground shadow-sm">
                        {group.date}
                      </span>
                    </div>

                    {group.items.map((message) => {
                      const fromMe = !!message.from_me
                      const mediaUrl = getMediaUrl(message)
                      const mediaKind = getMediaKind(message)
                      const hasCaption = !!message.content?.trim()

                      return (
                        <div
                          key={message.id}
                          className={cn("mb-2 flex", fromMe ? "justify-end" : "justify-start")}
                        >
                          <div
                            className={cn(
                              "max-w-[72%] rounded-lg px-3 py-2 shadow-sm",
                              fromMe ? "rounded-tr-none bg-[#dcf8c6]" : "rounded-tl-none bg-white",
                            )}
                          >
                            {message.participant && (
                              <p className={cn("mb-1 text-sm font-medium", fromMe ? "text-teal-700" : "text-teal-600")}>
                                {message.participant}
                              </p>
                            )}

                            {mediaUrl ? (
                              <div className="flex min-w-52 max-w-full flex-col gap-2">
                                {mediaKind === "image" && (
                                  <a href={mediaUrl} target="_blank" rel="noreferrer" className="block">
                                    <Image
                                      src={mediaUrl}
                                      alt={message.content || "Imagem da conversa"}
                                      width={520}
                                      height={420}
                                      className="h-auto max-h-[420px] w-auto max-w-full rounded-md object-contain"
                                      loading="lazy"
                                      unoptimized
                                    />
                                  </a>
                                )}

                                {mediaKind === "sticker" && (
                                  <a href={mediaUrl} target="_blank" rel="noreferrer" className="block w-fit">
                                    <Image
                                      src={mediaUrl}
                                      alt={message.content || "Figurinha da conversa"}
                                      width={128}
                                      height={128}
                                      className="h-32 w-32 rounded-md object-contain"
                                      loading="lazy"
                                      unoptimized
                                    />
                                  </a>
                                )}

                                {mediaKind === "video" && (
                                  <video
                                    src={mediaUrl}
                                    className="max-h-[420px] w-full max-w-[520px] rounded-md bg-black"
                                    controls
                                    preload="metadata"
                                  />
                                )}

                                {mediaKind === "audio" && (
                                  <audio src={mediaUrl} className="w-64 max-w-full" controls preload="metadata" />
                                )}

                                {mediaKind === "file" && (
                                  <div className="flex items-center gap-3 rounded-lg bg-white/50 p-3">
                                    <FileText className="h-8 w-8 shrink-0 text-muted-foreground" />
                                    <div className="min-w-0">
                                      <p className="truncate text-sm font-medium text-foreground">
                                        {getFileName(message, mediaUrl)}
                                      </p>
                                      <p className="truncate text-xs text-muted-foreground">
                                        {message.media_mime_type || message.message_type || "Arquivo"}
                                      </p>
                                    </div>
                                  </div>
                                )}

                                {hasCaption && (
                                  <p className="whitespace-pre-wrap break-words text-sm text-foreground">
                                    {message.content}
                                  </p>
                                )}

                                <div className="flex gap-2">
                                  <a
                                    href={mediaUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex flex-1 items-center justify-center gap-1 rounded bg-white/70 px-2 py-1.5 text-xs text-muted-foreground hover:bg-white"
                                  >
                                    <Eye className="h-3 w-3" />
                                    Abrir
                                  </a>
                                  <a
                                    href={mediaUrl}
                                    download
                                    className="flex flex-1 items-center justify-center gap-1 rounded bg-white/70 px-2 py-1.5 text-xs text-muted-foreground hover:bg-white"
                                  >
                                    <Download className="h-3 w-3" />
                                    Baixar
                                  </a>
                                </div>
                              </div>
                            ) : (
                              <p className="whitespace-pre-wrap break-words text-sm text-foreground">
                                {getMessageText(message)}
                              </p>
                            )}

                            <p className="mt-1 text-right text-[10px] text-muted-foreground">
                              {getTimeLabel(message.timestamp_msg)}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ))}
              </>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        <div className="border-t border-border bg-card px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-foreground">
              <PenLine className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-foreground">
              <Mic className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-foreground">
              <Paperclip className="h-5 w-5" />
            </Button>
            <Input
              disabled
              placeholder="Envio desativado neste painel de leitura"
              className="flex-1 border-0 bg-secondary"
            />
            <Button disabled size="icon" className="shrink-0 rounded-full bg-teal-500 text-white hover:bg-teal-600">
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {isDetailsOpen && <ContactDetails chat={chat} onClose={() => setIsDetailsOpen(false)} />}
    </div>
  )
}
