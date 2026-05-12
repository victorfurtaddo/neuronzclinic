"use client";

import Image from "next/image";
import type { UIEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Download, FileText, Mic, MoreHorizontal, Paperclip, Pause, PenLine, PlayIcon, Send } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ChatRecord, MessageRecord } from "@/lib/supabase-rest";
import { ContactDetails } from "./contact-details";
import { MessageStatusIcon } from "./message-status-icon";

interface ChatWindowProps {
  chat?: ChatRecord;
  messages: MessageRecord[];
  isLoading?: boolean;
  isLoadingOlder?: boolean;
  hasMoreMessages?: boolean;
  onLoadOlderMessages?: () => Promise<number>;
  onCloseChat?: () => void;
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
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}

function getTimeLabel(value: string | null) {
  if (!value) return "";

  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}

function getMessageText(message: MessageRecord) {
  if (message.content) return message.content;
  if (message.message_type) return `Midia: ${message.message_type}`;
  return "Mensagem sem conteudo";
}

function getMediaUrl(message: MessageRecord) {
  if (message.public_media_url) return message.public_media_url;
  if (message.media_url) return message.media_url;

  const path = message.media_path?.replace(/^file\//, "");
  if (!path) return null;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_REST_URL?.replace(/\/rest\/v1\/?$/, "");
  return supabaseUrl ? `${supabaseUrl}/storage/v1/object/public/file/${path}` : null;
}

function getMediaKind(message: MessageRecord) {
  const type = `${message.media_mime_type || ""} ${message.message_type || ""}`.toLowerCase();

  if (type.includes("sticker") || type.includes("figurinha")) return "sticker";
  if (type.includes("image")) return "image";
  if (type.includes("video")) return "video";
  if (type.includes("audio")) return "audio";
  return "file";
}

function getFileName(message: MessageRecord, mediaUrl: string) {
  const source = message.media_path || mediaUrl;
  const name = source.split("?")[0]?.split("/").pop();
  return name ? decodeURIComponent(name) : message.media_mime_type || message.message_type || "Arquivo";
}

export function ChatWindow({ chat, messages, isLoading, isLoadingOlder, hasMoreMessages, onLoadOlderMessages, onCloseChat, error }: ChatWindowProps) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const previousScrollHeightRef = useRef<number | null>(null);

  //audio
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) audioRef.current.pause();
      else audioRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const onTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const total = audioRef.current.duration;
      setCurrentTime(current);
      setProgress((current / total) * 100);
    }
  };

  const onLoadedMetadata = () => {
    if (audioRef.current) setDuration(audioRef.current.duration);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    if (audioRef.current) {
      audioRef.current.currentTime = percentage * audioRef.current.duration;
    }
  };

  // audio ^^^^^^

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

  useEffect(() => {
    if (!chat) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;

      event.preventDefault();
      setIsDetailsOpen(false);
      onCloseChat?.();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [chat, onCloseChat]);

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
    return <div className="flex flex-1 items-center justify-center bg-background px-6 text-center text-sm text-muted-foreground">Selecione um contato para visualizar a conversa.</div>;
  }

  return (
    <div className="flex h-full flex-1 overflow-hidden bg-background">
      <div className="flex flex-1 flex-col border-r border-border">
        <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsDetailsOpen(true)} className="rounded-full transition-opacity hover:opacity-90" aria-label="Abrir detalhes do contato">
              <Avatar className="h-10 w-10">
                <AvatarImage src={chat.url_foto_perfil ?? undefined} alt={getDisplayName(chat)} />
                <AvatarFallback className="bg-gradient-to-br from-teal-500 to-teal-700 text-sm font-semibold text-white">{getDisplayName(chat).slice(0, 1).toUpperCase()}</AvatarFallback>
              </Avatar>
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
              <div className="m-auto rounded px-4 py-2 text-sm shadow-sm border shadow-x bg-input/30 border-input">Carregando mensagens...</div>
            ) : error ? (
              <div className="m-auto max-w-md rounded bg-red-400/30 px-4 py-3 text-sm text-red-500 shadow-sm">{error}</div>
            ) : groupedMessages.length === 0 ? (
              <div className="m-auto rounded px-4 py-2 text-sm shadow-sm border shadow-x text-foreground/75 bg-input/30 border-input">Esta conversa ainda não tem mensagens visíveis.</div>
            ) : (
              <>
                <div className="mb-2 flex justify-center">
                  {hasMoreMessages ? (
                    <Button
                      variant="ghost"
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
                      const mediaKind = getMediaKind(message);
                      const hasCaption = !!message.content?.trim();

                      return (
                        <div key={message.id} className={cn("mb-2 flex", fromMe ? "justify-end" : "justify-start")}>
                          <div className={cn("max-w-[72%] rounded-lg px-3 py-2 shadow-sm transition-colors", fromMe ? "rounded-tr-none bg-(--chat-me)" : "rounded-tl-none bg-(--chat-other)")}>
                            {message.participant && !fromMe && <p className="mb-1 text-sm font-medium text-(--chat-primary)">{message.participant}</p>}

                            {mediaUrl ? (
                              <div className="flex max-w-full flex-col gap-2">
                                {mediaKind === "image" && (
                                  <a href={mediaUrl} target="_blank" rel="noreferrer" className="block">
                                    <Image src={mediaUrl} alt={message.content || "Imagem"} width={520} height={420} className="h-auto max-h-[420px] w-auto max-w-full rounded-md object-contain" loading="lazy" unoptimized />
                                  </a>
                                )}

                                {mediaKind === "sticker" && (
                                  <div className="block w-fit">
                                    <Image src={mediaUrl} alt={message.content || "Figurinha"} width={128} height={128} className="h-32 w-32 rounded-md object-contain" loading="lazy" unoptimized />
                                  </div>
                                )}

                                {mediaKind === "video" && <video src={mediaUrl} className="max-h-[420px] w-full max-w-[520px] rounded-md bg-black" controls preload="metadata" />}

                                {mediaKind === "audio" && (
                                  <div className="flex items-end gap-3 bg-(--chat-background)/40 p-2 rounded-xl min-w-[260px]">
                                    <button onClick={togglePlay} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-(--chat-primary) text-white hover:scale-105 transition-transform">
                                      {isPlaying ? <Pause size={20} fill="currentColor" /> : <PlayIcon size={20} className="ml-1" fill="currentColor" />}
                                    </button>

                                    <div className="flex flex-1 flex-col gap-1 pr-2">
                                      <div className="relative h-2 w-full bg-(--chat-muted-foreground)/20 rounded-full cursor-pointer" onClick={handleSeek}>
                                        <div className="absolute h-full bg-(--chat-primary) rounded-full" style={{ width: `${progress}%` }} />
                                        <div className="absolute h-4 w-4 bg-(--chat-primary) rounded-full -top-1 shadow-sm" style={{ left: `calc(${progress}% - 6px)` }} />
                                      </div>
                                      <div className="flex justify-between text-[10px] text-(--chat-muted-foreground) font-medium">
                                        <span>{formatTime(currentTime)}</span>
                                        <span>{formatTime(duration)}</span>
                                      </div>
                                    </div>

                                    <audio ref={audioRef} src={mediaUrl} onTimeUpdate={onTimeUpdate} onLoadedMetadata={onLoadedMetadata} onEnded={() => setIsPlaying(false)} className="hidden" />
                                  </div>
                                )}

                                {mediaKind === "file" && (
                                  <div className="flex items-center gap-3 rounded-lg bg-(--chat-background)/30 p-3">
                                    <FileText className="h-8 w-8 shrink-0 text-(--chat-muted-foreground)" />
                                    <div className="min-w-0">
                                      <p className="truncate text-sm font-medium text-(--chat-foreground)">{getFileName(message, mediaUrl)}</p>
                                      <p className="truncate text-xs text-(--chat-muted-foreground)">{message.media_mime_type || message.message_type || "Arquivo"}</p>
                                    </div>
                                  </div>
                                )}

                                {hasCaption && <p className="whitespace-pre-wrap break-words text-sm text-(--chat-foreground)">{message.content}</p>}

                                {mediaKind !== "sticker" && (
                                  <div className="flex gap-2">
                                    <a
                                      href={mediaUrl}
                                      download
                                      className="flex flex-1 items-center justify-center gap-2 rounded bg-(--chat-card)/80 py-2 text-xs font-medium text-(--chat-muted-foreground) transition-colors hover:bg-(--chat-card)"
                                    >
                                      <Download className="h-3.5 w-3.5" />
                                      Baixar Arquivo
                                    </a>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <p className="whitespace-pre-wrap break-words text-sm text-(--chat-foreground)">{getMessageText(message)}</p>
                            )}

                            <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-(--chat-muted-foreground) opacity-70">
                              <span>{getTimeLabel(message.timestamp_msg)}</span>
                              <MessageStatusIcon
                                fromMe={message.from_me}
                                status={message.status}
                                timestamp={message.timestamp_msg}
                              />
                            </div>
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
