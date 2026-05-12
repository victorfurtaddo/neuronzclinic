"use client";

import type { UIEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Eye, FileText, Mic, MoreHorizontal, Paperclip, PenLine, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ChatRecord, MessageRecord } from "@/lib/supabase-rest";
import { ContactDetails } from "./contact-details";

interface ChatWindowProps {
  chat?: ChatRecord;
  messages: MessageRecord[];
  isLoading?: boolean;
  isLoadingOlder?: boolean;
  hasMoreMessages?: boolean;
  onLoadOlderMessages?: () => Promise<number>;
  error?: string;
}

function getDisplayName(chat?: ChatRecord) {
  return chat?.nome_contato || chat?.pushname || chat?.chat_id?.replace("@s.whatsapp.net", "") || "Selecione um chat";
}

function getDateLabel(value: string | null) {
  if (!value) return "";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  }).format(new Date(value));
}

function getTimeLabel(value: string | null) {
  if (!value) return "";

  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getMessageText(message: MessageRecord) {
  if (message.content) return message.content;
  if (message.message_type) return `Midia: ${message.message_type}`;
  return "Mensagem sem conteudo";
}

function getMediaUrl(message: MessageRecord) {
  return message.public_media_url || message.media_url;
}

export function ChatWindow({ chat, messages, isLoading, isLoadingOlder, hasMoreMessages, onLoadOlderMessages, error }: ChatWindowProps) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const previousScrollHeightRef = useRef<number | null>(null);

  const groupedMessages = useMemo(() => {
    return messages.reduce<Array<{ date: string; items: MessageRecord[] }>>((groups, message) => {
      const date = getDateLabel(message.timestamp_msg) || "Sem data";
      const lastGroup = groups[groups.length - 1];

      if (lastGroup?.date === date) {
        lastGroup.items.push(message);
      } else {
        groups.push({ date, items: [message] });
      }

      return groups;
    }, []);
  }, [messages]);

  useEffect(() => {
    const scrollArea = scrollAreaRef.current;
    const previousScrollHeight = previousScrollHeightRef.current;

    if (scrollArea && previousScrollHeight !== null) {
      scrollArea.scrollTop = scrollArea.scrollHeight - previousScrollHeight;
      previousScrollHeightRef.current = null;
      return;
    }

    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, chat?.id]);

  async function handleMessagesScroll(event: UIEvent<HTMLDivElement>) {
    if (!onLoadOlderMessages || !hasMoreMessages || isLoadingOlder || isLoading) return;
    if (event.currentTarget.scrollTop > 120) return;

    previousScrollHeightRef.current = event.currentTarget.scrollHeight;
    const addedCount = await onLoadOlderMessages();

    if (addedCount === 0) {
      previousScrollHeightRef.current = null;
    }
  }

  if (!chat) {
    return <div className="flex flex-1 items-center justify-center bg-background text-sm text-muted-foreground">Nenhuma conversa disponivel.</div>;
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
              <span className="text-sm font-semibold text-white">{getDisplayName(chat).slice(0, 1).toUpperCase()}</span>
            </button>
            <div className="flex min-w-0 flex-col">
              <span className="truncate font-medium leading-none text-foreground">{getDisplayName(chat)}</span>
              <span className="mt-1 text-[10px] text-muted-foreground">{chat.finalizada ? "Finalizada" : chat.ia_responde ? "IA responde" : "Atendimento aberto"}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button className="bg-teal-500 px-4 font-medium text-white hover:bg-teal-600">{chat.finalizada ? "Reabrir" : "Finalizar"}</Button>
            <Button variant="ghost" size="icon" onClick={() => setIsDetailsOpen(!isDetailsOpen)} className={cn("text-muted-foreground hover:text-foreground", isDetailsOpen && "bg-muted")}>
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div
          ref={scrollAreaRef}
          className="flex-1 overflow-y-auto"
          onScroll={handleMessagesScroll}
          style={{
            backgroundColor: "var(--chat-background)",
            backgroundImage: "url(/bgs/bgdefault.png)",
            backgroundRepeat: "repeat",
            backgroundSize: "600px",
          }}
        >
          <div className="mx-auto flex min-h-full w-full flex-col px-6 py-4">
            {isLoading ? (
              <div className="m-auto rounded bg-white/80 px-4 py-2 text-sm font-medium text-muted shadow-sm">Carregando mensagens...</div>
            ) : error ? (
              <div className="m-auto max-w-md rounded bg-red-900/30 px-4 py-3 text-sm text-red-600/70 shadow-sm">{error}</div>
            ) : groupedMessages.length === 0 ? (
              <div className="m-auto rounded bg-white/80 px-4 py-2 text-sm font-medium text-muted shadow-sm">Esta conversa ainda não tem mensagens visíveis.</div>
            ) : (
              <>
                <div className="mb-2 flex justify-center">
                  {hasMoreMessages ? (
                    <Button
                      variant="ghost"
                      // Trocamos bg-white/70 por var(--chat-muted) com opacidade
                      className="h-8 bg-(--chat-muted)/70 px-3 text-xs text-(--chat-muted-foreground) shadow-sm hover:bg-(--chat-muted)"
                      disabled={isLoadingOlder}
                      onClick={async () => {
                        const scrollArea = scrollAreaRef.current;
                        if (scrollArea) previousScrollHeightRef.current = scrollArea.scrollHeight;
                        const addedCount = await onLoadOlderMessages?.();
                        if (!addedCount) previousScrollHeightRef.current = null;
                      }}
                    >
                      {isLoadingOlder ? "Carregando mensagens antigas..." : "Carregar mensagens antigas"}
                    </Button>
                  ) : (
                    <span className="rounded bg-(--chat-muted)/70 px-3 py-1 text-xs text-(--chat-muted-foreground) shadow-sm">Início do histórico carregado</span>
                  )}
                </div>

                {groupedMessages.map((group) => (
                  <div key={group.date}>
                    <div className="my-3 flex justify-center">
                      <span className="rounded bg-(--chat-muted)/80 px-3 py-1 text-xs text-(--chat-muted-foreground) shadow-sm">{group.date}</span>
                    </div>

                    {group.items.map((message) => {
                      const fromMe = !!message.from_me;
                      const mediaUrl = getMediaUrl(message);

                      return (
                        <div key={message.id} className={cn("mb-2 flex", fromMe ? "justify-end" : "justify-start")}>
                          <div className={cn("max-w-[72%] rounded-lg px-3 py-2 shadow-sm transition-colors", fromMe ? "rounded-tr-none bg-(--chat-me)" : "rounded-tl-none bg-(--chat-other)")}>
                            {message.participant && !fromMe && <p className="mb-1 text-sm font-medium text-(--chat-primary)">{message.participant}</p>}

                            {mediaUrl ? (
                              <div className="flex min-w-52 flex-col gap-2 rounded-lg bg-(--chat-background)/30 p-3">
                                <FileText className="h-8 w-8 text-(--chat-muted-foreground)" />
                                <p className="break-all text-xs text-(--chat-foreground)">{message.media_mime_type || message.message_type || "Arquivo"}</p>
                                <div className="flex gap-2">
                                  <a
                                    href={mediaUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex flex-1 items-center justify-center gap-1 rounded bg-(--chat-card)/80 px-2 py-1.5 text-xs text-(--chat-muted-foreground) hover:bg-(--chat-card)"
                                  >
                                    <Eye className="h-3 w-3" />
                                    Visualizar
                                  </a>
                                  <a
                                    href={mediaUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex flex-1 items-center justify-center gap-1 rounded bg-(--chat-card)/80 px-2 py-1.5 text-xs text-(--chat-muted-foreground) hover:bg-(--chat-card)"
                                  >
                                    <Download className="h-3 w-3" />
                                    Baixar
                                  </a>
                                </div>
                              </div>
                            ) : (
                              <p className="whitespace-pre-wrap wrap-break-word text-sm text-(--chat-foreground)">{getMessageText(message)}</p>
                            )}

                            <p className="mt-1 text-right text-[10px] text-(--chat-muted-foreground) opacity-70">{getTimeLabel(message.timestamp_msg)}</p>
                          </div>
                        </div>
                      );
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
            <Input disabled placeholder="Envio desativado neste painel de leitura" className="flex-1 border-0 bg-secondary" />
            <Button disabled size="icon" className="shrink-0 rounded-full bg-teal-500 text-white hover:bg-teal-600">
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {isDetailsOpen && <ContactDetails chat={chat} onClose={() => setIsDetailsOpen(false)} />}
    </div>
  );
}
