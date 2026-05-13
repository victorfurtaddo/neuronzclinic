"use client";

import Image from "next/image";
import type { FormEvent, MouseEvent, UIEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, Check, Download, FileImage, FileText, Forward, MapPin, Mic, MoreHorizontal, Paperclip, Pause, PenLine, PlayIcon, Reply, Send, Trash2, UserRound, Video, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ChatRecord, MessageRecord } from "@/lib/supabase-rest";
import { ContactDetails } from "./contact-details";
import { MessageStatusIcon } from "./message-status-icon";

type AttachmentPreviewKind = "image" | "video" | "audio" | "document";

const attachmentMenuItemClass = "flex h-[76px] cursor-pointer flex-col items-center justify-center gap-2 rounded-md p-2 text-xs font-medium text-foreground transition-colors focus:bg-muted";
const disabledAttachmentMenuItemClass = "flex h-[76px] cursor-not-allowed flex-col items-center justify-center gap-2 rounded-md p-2 text-xs font-medium text-muted-foreground focus:bg-transparent";

interface ChatWindowProps {
  chat?: ChatRecord;
  messages: MessageRecord[];
  isLoading?: boolean;
  isLoadingOlder?: boolean;
  hasMoreMessages?: boolean;
  onLoadOlderMessages?: () => Promise<number>;
  onCloseChat?: () => void;
  onSendMessage?: (input: { text: string; file: File | null }) => Promise<void>;
  onReplyMessage?: (input: { text: string; file: File | null; replyTo: MessageRecord }) => Promise<void>;
  onForwardMessage?: (input: { message: MessageRecord; targetChatId: string }) => Promise<void>;
  onDeleteMessage?: (message: MessageRecord) => Promise<void>;
  forwardTargets?: ChatRecord[];
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

function getMessagePreviewText(message: MessageRecord) {
  if (message.content?.trim()) return message.content.trim();
  const kind = getMediaKind(message);
  if (kind === "image") return "Foto";
  if (kind === "video") return "Video";
  if (kind === "audio") return "Audio";
  if (kind === "sticker") return "Figurinha";
  if (kind === "file") return "Arquivo";
  return "Mensagem";
}

function getMessageExtraField(message: MessageRecord, keys: string[]) {
  const record = message as MessageRecord & Record<string, unknown>;
  const value = keys.map((key) => record[key]).find((item) => typeof item === "string" && item.trim());

  return typeof value === "string" ? value.trim() : "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function hasDeletedMarker(value: unknown, depth = 0): boolean {
  if (depth > 5 || value == null) return false;

  if (typeof value === "string") {
    const normalized = value.toLowerCase();
    return normalized.includes("deleted") || normalized.includes("delete") || normalized.includes("revoked") || normalized.includes("revoke") || normalized.includes("apagada");
  }

  if (typeof value === "boolean") return value;

  if (Array.isArray(value)) {
    return value.some((item) => hasDeletedMarker(item, depth + 1));
  }

  if (!isRecord(value)) return false;

  return Object.entries(value).some(([key, item]) => {
    const normalizedKey = key.toLowerCase();
    const keyLooksDeleted =
      normalizedKey.includes("deleted") ||
      normalizedKey.includes("delete") ||
      normalizedKey.includes("revoked") ||
      normalizedKey.includes("revoke") ||
      normalizedKey.includes("apagada") ||
      normalizedKey === "messagestubtype" ||
      normalizedKey === "protocolmessage";

    if (keyLooksDeleted && hasDeletedMarker(item, depth + 1)) return true;
    return isRecord(item) || Array.isArray(item) ? hasDeletedMarker(item, depth + 1) : false;
  });
}

function getMessageJsonField(message: MessageRecord, keys: string[]) {
  const record = message as MessageRecord & Record<string, unknown>;
  return keys.map((key) => record[key]).find((value) => value != null);
}

function getQuotedMessage(message: MessageRecord) {
  const content = getMessageExtraField(message, ["quoted_content", "quoted_text", "quoted_message", "reply_to_content", "reply_content"]);
  const messageId = getMessageExtraField(message, ["quoted_message_id", "reply_to_message_id", "quoted_id"]);

  if (!content && !messageId) return null;

  return {
    content: content || "Mensagem",
    fromMe: Boolean(message.quoted_from_me ?? (message as MessageRecord & { reply_to_from_me?: boolean }).reply_to_from_me),
  };
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

function getAttachmentType(file: File | null) {
  if (!file) return null;
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("audio/")) return "audio";
  return "document";
}

function getAttachmentLabel(file: File) {
  const kind = getAttachmentType(file);

  if (kind === "image") return "Foto";
  if (kind === "video") return "Video";
  if (kind === "audio") return "Audio";
  return "Documento";
}

function isDeletedMessage(message: MessageRecord) {
  const status = message.status?.toLowerCase() || "";
  const type = message.message_type?.toLowerCase() || "";
  const content = message.content?.toLowerCase() || "";
  const deletedAt = getMessageExtraField(message, ["deleted_at", "deletedAt"]);
  const flags = message as MessageRecord & { deleted?: boolean | null; is_revoked?: boolean | null };
  const nestedData = getMessageJsonField(message, ["metadata", "raw_message", "message", "data", "json", "message_json", "message_data"]);

  return (
    !!deletedAt ||
    !!message.is_deleted ||
    !!message.revoked ||
    !!flags.deleted ||
    !!flags.is_revoked ||
    hasDeletedMarker(nestedData) ||
    status.includes("deleted") ||
    status.includes("revoked") ||
    type.includes("deleted") ||
    type.includes("revoked") ||
    type.includes("protocol") ||
    content.includes("mensagem apagada") ||
    content.includes("message deleted")
  );
}

function getSupportedAudioMimeType() {
  if (typeof MediaRecorder === "undefined") return "";

  const mimeTypes = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];
  return mimeTypes.find((mimeType) => MediaRecorder.isTypeSupported(mimeType)) || "";
}

function getAudioFileExtension(mimeType: string) {
  if (mimeType.includes("mp4")) return "m4a";
  if (mimeType.includes("ogg")) return "ogg";
  return "webm";
}

export function ChatWindow({
  chat,
  messages,
  isLoading,
  isLoadingOlder,
  hasMoreMessages,
  onLoadOlderMessages,
  onCloseChat,
  onSendMessage,
  onReplyMessage,
  onForwardMessage,
  onDeleteMessage,
  forwardTargets = [],
  error,
}: ChatWindowProps) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isAttachmentPreviewOpen, setIsAttachmentPreviewOpen] = useState(false);
  const [expandedImage, setExpandedImage] = useState<{ url: string; alt: string } | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [replyTo, setReplyTo] = useState<MessageRecord | null>(null);
  const [forwardingMessage, setForwardingMessage] = useState<MessageRecord | null>(null);
  const [deleteConfirmationMessage, setDeleteConfirmationMessage] = useState<MessageRecord | null>(null);
  const [selectedForwardTarget, setSelectedForwardTarget] = useState("");
  const [isForwarding, setIsForwarding] = useState(false);
  const [messageActionError, setMessageActionError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isRecordingPaused, setIsRecordingPaused] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const previousScrollHeightRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingChunksRef = useRef<BlobPart[]>([]);
  const recordingStreamRef = useRef<MediaStream | null>(null);
  const recordingTimerRef = useRef<number | null>(null);
  const shouldSendRecordingRef = useRef(false);
  const recordingPausedRef = useRef(false);

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

  const handleSeek = (e: MouseEvent<HTMLDivElement>) => {
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

  const attachmentPreviewUrl = useMemo(() => (attachment ? URL.createObjectURL(attachment) : null), [attachment]);

  useEffect(() => {
    return () => {
      if (attachmentPreviewUrl) URL.revokeObjectURL(attachmentPreviewUrl);
    };
  }, [attachmentPreviewUrl]);

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

  useEffect(() => {
    return () => {
      shouldSendRecordingRef.current = false;

      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== "inactive") {
        recorder.stop();
      } else {
        if (recordingTimerRef.current) {
          window.clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
        recordingStreamRef.current?.getTracks().forEach((track) => track.stop());
        recordingStreamRef.current = null;
      }
    };
  }, [chat?.id]);

  async function handleMessagesScroll(event: UIEvent<HTMLDivElement>) {
    if (!onLoadOlderMessages || !hasMoreMessages || isLoadingOlder || isLoading) return;
    if (event.currentTarget.scrollTop > 120) return;

    previousScrollHeightRef.current = event.currentTarget.scrollHeight;
    const addedCount = await onLoadOlderMessages();

    if (addedCount === 0) {
      previousScrollHeightRef.current = null;
    }
  }

  async function handleSubmit(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    if ((!onSendMessage && !onReplyMessage) || isSending) return;

    const text = draft.trim();
    if (!text && !attachment) return;

    setIsSending(true);

    try {
      if (replyTo && onReplyMessage) {
        await onReplyMessage({ text, file: attachment, replyTo });
      } else {
        await onSendMessage?.({ text, file: attachment });
      }
      setDraft("");
      setReplyTo(null);
      removeAttachment();
    } finally {
      setIsSending(false);
    }
  }

  function handleAttachmentSelected(file?: File | null) {
    const selectedFile = file ?? null;
    setAttachment(selectedFile);
    setIsAttachmentPreviewOpen(!!selectedFile);
  }

  function removeAttachment() {
    setAttachment(null);
    setIsAttachmentPreviewOpen(false);
    clearAttachmentInputs();
  }

  function clearAttachmentInputs() {
    for (const input of [fileInputRef.current, photoInputRef.current, videoInputRef.current, cameraInputRef.current]) {
      if (input) input.value = "";
    }
  }

  function beginReply(message: MessageRecord) {
    if (isDeletedMessage(message)) return;

    setReplyTo(message);
    setMessageActionError(null);
  }

  function beginForward(message: MessageRecord) {
    if (isDeletedMessage(message)) return;

    setForwardingMessage(message);
    setSelectedForwardTarget(chat?.chat_id || "");
    setMessageActionError(null);
  }

  async function handleForwardSubmit() {
    if (!forwardingMessage || !selectedForwardTarget || !onForwardMessage || isForwarding) return;

    setIsForwarding(true);
    setMessageActionError(null);

    try {
      await onForwardMessage({ message: forwardingMessage, targetChatId: selectedForwardTarget });
      setForwardingMessage(null);
      setSelectedForwardTarget("");
    } catch (error) {
      setMessageActionError(error instanceof Error ? error.message : "Nao foi possivel encaminhar a mensagem.");
    } finally {
      setIsForwarding(false);
    }
  }

  function beginDelete(message: MessageRecord) {
    if (isDeletedMessage(message)) return;

    setMessageActionError(null);
    setDeleteConfirmationMessage(message);
  }

  async function handleDeleteMessage() {
    if (!deleteConfirmationMessage || !onDeleteMessage || isDeletedMessage(deleteConfirmationMessage)) return;

    const message = deleteConfirmationMessage;
    setMessageActionError(null);

    try {
      await onDeleteMessage(message);
      setDeleteConfirmationMessage(null);
    } catch (error) {
      setMessageActionError(error instanceof Error ? error.message : "Nao foi possivel apagar a mensagem.");
    }
  }

  function clearRecordingTimer() {
    if (recordingTimerRef.current) {
      window.clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  }

  function stopRecordingStream() {
    recordingStreamRef.current?.getTracks().forEach((track) => track.stop());
    recordingStreamRef.current = null;
  }

  async function startRecording() {
    if (!onSendMessage || isSending || isRecording) return;

    setRecordingError(null);

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setRecordingError("Seu navegador nao oferece suporte a gravacao de audio.");
      return;
    }

    try {
      removeAttachment();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getSupportedAudioMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

      recordingChunksRef.current = [];
      recordingStreamRef.current = stream;
      mediaRecorderRef.current = recorder;
      shouldSendRecordingRef.current = false;
      recordingPausedRef.current = false;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordingChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        clearRecordingTimer();
        stopRecordingStream();

        const chunks = recordingChunksRef.current;
        recordingChunksRef.current = [];
        mediaRecorderRef.current = null;
        recordingPausedRef.current = false;
        setIsRecording(false);
        setIsRecordingPaused(false);
        setRecordingSeconds(0);

        if (!shouldSendRecordingRef.current || chunks.length === 0) {
          shouldSendRecordingRef.current = false;
          return;
        }

        shouldSendRecordingRef.current = false;
        const recordedMimeType = recorder.mimeType || mimeType || "audio/webm";
        const blob = new Blob(chunks, { type: recordedMimeType });
        const file = new File([blob], `audio-${Date.now()}.${getAudioFileExtension(recordedMimeType)}`, {
          type: recordedMimeType,
        });

        setIsSending(true);
        try {
          await onSendMessage({ text: "", file });
        } catch (error) {
          setRecordingError(error instanceof Error ? error.message : "Nao foi possivel enviar o audio gravado.");
        } finally {
          setIsSending(false);
        }
      };

      recorder.onerror = () => {
        setRecordingError("Nao foi possivel concluir a gravacao.");
        shouldSendRecordingRef.current = false;
        stopRecording();
      };

      recorder.start();
      setIsRecording(true);
      setIsRecordingPaused(false);
      setRecordingSeconds(0);
      clearRecordingTimer();
      recordingTimerRef.current = window.setInterval(() => {
        if (!recordingPausedRef.current) {
          setRecordingSeconds((seconds) => seconds + 1);
        }
      }, 1000);
    } catch {
      clearRecordingTimer();
      stopRecordingStream();
      setIsRecording(false);
      setIsRecordingPaused(false);
      setRecordingError("Permita o acesso ao microfone para gravar audio.");
    }
  }

  function stopRecording() {
    const recorder = mediaRecorderRef.current;

    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
      return;
    }

    clearRecordingTimer();
    stopRecordingStream();
    setIsRecording(false);
    setIsRecordingPaused(false);
    setRecordingSeconds(0);
  }

  function sendRecording() {
    if (!isRecording || isSending) return;

    shouldSendRecordingRef.current = true;
    stopRecording();
  }

  function cancelRecording() {
    shouldSendRecordingRef.current = false;
    stopRecording();
  }

  function toggleRecordingPause() {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;

    if (recorder.state === "recording") {
      recorder.pause();
      recordingPausedRef.current = true;
      setIsRecordingPaused(true);
      return;
    }

    if (recorder.state === "paused") {
      recorder.resume();
      recordingPausedRef.current = false;
      setIsRecordingPaused(false);
    }
  }

  if (!chat) {
    return <div className="flex flex-1 items-center justify-center bg-background px-6 text-center text-sm text-muted-foreground">Selecione um contato para visualizar a conversa.</div>;
  }

  const attachmentKind = getAttachmentType(attachment) as AttachmentPreviewKind | null;

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
                      const deleted = isDeletedMessage(message);
                      const quotedMessage = getQuotedMessage(message);

                      return (
                        <div key={message.id} className={cn("mb-2 flex", fromMe ? "justify-end" : "justify-start")}>
                          <div
                            className={cn(
                              "group relative max-w-[72%] rounded-lg px-3 py-2 shadow-sm transition-colors",
                              fromMe ? "rounded-tr-none bg-(--chat-me)" : "rounded-tl-none bg-(--chat-other)",
                              deleted && "border border-dashed border-red-500/45 bg-(--chat-muted)/80 opacity-80 shadow-none saturate-[0.65]",
                            )}
                          >
                            {message.participant && !fromMe && <p className="mb-1 text-sm font-medium text-(--chat-primary)">{message.participant}</p>}

                            {!deleted && (
                              <div className={cn("absolute top-1 flex rounded-full bg-(--chat-card)/90 p-0.5 opacity-0 shadow-sm transition-opacity group-hover:opacity-100", fromMe ? "right-full mr-2" : "left-full ml-2")}>
                                <Button type="button" variant="ghost" size="icon-sm" className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground" onClick={() => beginReply(message)} aria-label="Responder mensagem">
                                  <Reply className="h-4 w-4" />
                                </Button>
                                <Button type="button" variant="ghost" size="icon-sm" className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground" onClick={() => beginForward(message)} aria-label="Encaminhar mensagem">
                                  <Forward className="h-4 w-4" />
                                </Button>
                                {fromMe && (
                                  <Button type="button" variant="ghost" size="icon-sm" className="h-7 w-7 rounded-full text-muted-foreground hover:text-red-500" onClick={() => beginDelete(message)} aria-label="Apagar mensagem">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            )}

                            {deleted && (
                              <div className="mb-2 flex items-center gap-2 rounded-md border border-red-500/25 bg-red-500/10 px-2.5 py-1.5 text-[11px] font-medium text-red-700 dark:text-red-300">
                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-500/20">
                                  <Trash2 className="h-3 w-3" />
                                </span>
                                <span className="min-w-0">
                                  <span className="block leading-none">Mensagem apagada</span>
                                  <span className="mt-0.5 block truncate text-[10px] font-normal text-(--chat-muted-foreground)">Conteudo preservado apenas para historico interno</span>
                                </span>
                              </div>
                            )}

                            <div className={cn(deleted && "rounded-md bg-(--chat-background)/20 p-2 opacity-70")}>
                              {quotedMessage && (
                                <div className="mb-2 border-l-2 border-teal-500 bg-(--chat-background)/35 px-2 py-1.5">
                                  <p className="text-[11px] font-semibold text-teal-600 dark:text-teal-300">{quotedMessage.fromMe ? "Voce" : getDisplayName(chat)}</p>
                                  <p className="line-clamp-2 text-xs text-(--chat-muted-foreground)">{quotedMessage.content}</p>
                                </div>
                              )}

                              {mediaUrl ? (
                                <div className="flex max-w-full flex-col gap-2">
                                {mediaKind === "image" && (
                                  <button
                                    type="button"
                                    onClick={() => setExpandedImage({ url: mediaUrl, alt: message.content || "Imagem" })}
                                    className="relative block aspect-[4/3] w-[min(320px,64vw)] max-w-full overflow-hidden rounded-md bg-(--chat-background)/40"
                                    aria-label="Expandir imagem"
                                  >
                                    <Image src={mediaUrl} alt={message.content || "Imagem"} fill sizes="(max-width: 640px) 64vw, 320px" className="object-contain" loading="lazy" unoptimized />
                                  </button>
                                )}

                                {mediaKind === "sticker" && (
                                  <div className="block w-fit">
                                    <Image src={mediaUrl} alt={message.content || "Figurinha"} width={128} height={128} className="h-32 w-32 rounded-md object-contain" loading="lazy" unoptimized />
                                  </div>
                                )}

                                {mediaKind === "video" && (
                                  <div className="aspect-video w-[min(320px,64vw)] max-w-full overflow-hidden rounded-md bg-black">
                                    <video src={mediaUrl} className="h-full w-full object-contain" controls preload="metadata" />
                                  </div>
                                )}

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
                            </div>

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

        <form onSubmit={handleSubmit} className="border-t border-border bg-card px-4 py-3">
          {attachment && (
            <div className="mb-2 flex items-center justify-between rounded-md border border-border bg-secondary px-3 py-2 text-sm">
              <button type="button" className="min-w-0 text-left" onClick={() => setIsAttachmentPreviewOpen(true)}>
                <p className="truncate font-medium text-foreground">{attachment.name}</p>
                <p className="text-xs text-muted-foreground">
                  {getAttachmentLabel(attachment)} · {(attachment.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="shrink-0 text-muted-foreground hover:text-foreground"
                onClick={removeAttachment}
                aria-label="Remover anexo"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {replyTo && (
            <div className="mb-2 flex items-center gap-3 rounded-md border-l-4 border-teal-500 bg-secondary px-3 py-2 text-sm">
              <Reply className="h-4 w-4 shrink-0 text-teal-500" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-teal-600 dark:text-teal-300">Respondendo {replyTo.from_me ? "voce" : getDisplayName(chat)}</p>
                <p className="truncate text-xs text-muted-foreground">{getMessagePreviewText(replyTo)}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="shrink-0 text-muted-foreground hover:text-foreground"
                onClick={() => setReplyTo(null)}
                aria-label="Cancelar resposta"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {messageActionError && <p className="mb-2 rounded-md bg-red-500/10 px-3 py-2 text-xs text-red-500">{messageActionError}</p>}
          {recordingError && <p className="mb-2 rounded-md bg-red-500/10 px-3 py-2 text-xs text-red-500">{recordingError}</p>}

          <div className="flex items-center gap-3">
            {isRecording ? (
              <div className="flex min-w-0 flex-1 items-center gap-3 rounded-full bg-secondary px-2 py-2 shadow-sm">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0 rounded-full text-muted-foreground hover:text-red-500"
                  onClick={cancelRecording}
                  disabled={isSending}
                  aria-label="Cancelar gravacao"
                >
                  <Trash2 className="h-5 w-5" />
                </Button>

                <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full bg-rose-400", isRecordingPaused ? "opacity-40" : "animate-pulse")} />
                <span className="w-12 shrink-0 text-sm font-semibold tabular-nums text-foreground">{formatTime(recordingSeconds)}</span>

                <div className="flex min-w-0 flex-1 items-center justify-center gap-1 overflow-hidden px-2" aria-hidden="true">
                  {Array.from({ length: 26 }).map((_, index) => {
                    const height = 6 + ((index * 7 + recordingSeconds * 5) % 18);

                    return (
                      <span
                        key={index}
                        className={cn("w-1 rounded-full bg-muted-foreground/60 transition-all duration-300", !isRecordingPaused && "animate-pulse")}
                        style={{
                          height,
                          animationDelay: `${index * 45}ms`,
                        }}
                      />
                    );
                  })}
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0 rounded-full text-rose-400 hover:bg-rose-400/10 hover:text-rose-400"
                  onClick={toggleRecordingPause}
                  disabled={isSending}
                  aria-label={isRecordingPaused ? "Retomar gravacao" : "Pausar gravacao"}
                >
                  {isRecordingPaused ? <Mic className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
                </Button>

                <Button
                  type="button"
                  disabled={isSending}
                  size="icon"
                  className="shrink-0 rounded-full bg-teal-500 text-white hover:bg-teal-600"
                  onClick={sendRecording}
                  aria-label="Enviar audio gravado"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            ) : (
              <>
                <Button type="button" variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-foreground">
                  <PenLine className="h-5 w-5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                  onClick={startRecording}
                  disabled={isSending || !!attachment}
                  aria-label="Gravar audio"
                >
                  <Mic className="h-5 w-5" />
                </Button>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="hidden"
              onChange={(event) => handleAttachmentSelected(event.target.files?.[0])}
            />
            <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={(event) => handleAttachmentSelected(event.target.files?.[0])} />
            <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={(event) => handleAttachmentSelected(event.target.files?.[0])} />
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(event) => handleAttachmentSelected(event.target.files?.[0])} />
            {!isRecording && (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-foreground" aria-label="Anexar arquivo">
                      <Paperclip className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" side="top" sideOffset={12} className="w-[300px] rounded-lg border-border bg-card p-3 shadow-xl">
                    <div className="grid grid-cols-3 gap-2">
                      <DropdownMenuItem
                        className={attachmentMenuItemClass}
                        onSelect={() => photoInputRef.current?.click()}
                      >
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500 text-black shadow-sm ring-1 ring-black/10 dark:text-white dark:ring-white/15">
                          <FileImage className="h-5 w-5 text-current" />
                        </span>
                        Fotos
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className={attachmentMenuItemClass}
                        onSelect={() => videoInputRef.current?.click()}
                      >
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-600 text-black shadow-sm ring-1 ring-black/10 dark:text-white dark:ring-white/15">
                          <Video className="h-5 w-5 text-current" />
                        </span>
                        Videos
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className={attachmentMenuItemClass}
                        onSelect={() => fileInputRef.current?.click()}
                      >
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-600 text-black shadow-sm ring-1 ring-black/10 dark:text-white dark:ring-white/15">
                          <FileText className="h-5 w-5 text-current" />
                        </span>
                        Documentos
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className={attachmentMenuItemClass}
                        onSelect={() => cameraInputRef.current?.click()}
                      >
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-600 text-black shadow-sm ring-1 ring-black/10 dark:text-white dark:ring-white/15">
                          <Camera className="h-5 w-5 text-current" />
                        </span>
                        Camera
                      </DropdownMenuItem>
                      <DropdownMenuItem aria-disabled className={disabledAttachmentMenuItemClass} onSelect={(event) => event.preventDefault()}>
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-black shadow-sm ring-1 ring-black/10 dark:text-white dark:ring-white/15">
                          <MapPin className="h-5 w-5 text-current" />
                        </span>
                        Localizacao
                      </DropdownMenuItem>
                      <DropdownMenuItem aria-disabled className={disabledAttachmentMenuItemClass} onSelect={(event) => event.preventDefault()}>
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-600 text-black shadow-sm ring-1 ring-black/10 dark:text-white dark:ring-white/15">
                          <UserRound className="h-5 w-5 text-current" />
                        </span>
                        Contato
                      </DropdownMenuItem>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Input
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  disabled={isSending}
                  placeholder={attachment ? "Legenda opcional" : "Digite uma mensagem"}
                  className="flex-1 border-0 bg-secondary"
                />
                <Button
                  type="submit"
                  disabled={isSending || (!draft.trim() && !attachment)}
                  size="icon"
                  className="shrink-0 rounded-full bg-teal-500 text-white hover:bg-teal-600"
                  aria-label="Enviar mensagem"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </>
            )}
          </div>
        </form>
      </div>

      {attachment && isAttachmentPreviewOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-sm">
          <div className="flex h-16 items-center justify-between border-b border-border bg-card px-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{attachment.name}</p>
              <p className="text-xs text-muted-foreground">
                {getAttachmentLabel(attachment)} · {(attachment.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={removeAttachment} aria-label="Fechar preview">
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex min-h-0 flex-1 items-center justify-center bg-black/5 p-4 sm:p-8">
            {attachmentPreviewUrl && attachmentKind === "image" && (
              <Image
                src={attachmentPreviewUrl}
                alt={attachment.name}
                width={1200}
                height={900}
                className="max-h-full w-auto max-w-full rounded-md object-contain shadow-2xl"
                unoptimized
              />
            )}

            {attachmentPreviewUrl && attachmentKind === "video" && (
              <video src={attachmentPreviewUrl} className="max-h-full w-auto max-w-full rounded-md bg-black shadow-2xl" controls preload="metadata" />
            )}

            {attachmentPreviewUrl && attachmentKind === "audio" && (
              <div className="flex w-full max-w-xl flex-col items-center gap-5 rounded-lg border border-border bg-card p-8 shadow-2xl">
                <span className="flex h-20 w-20 items-center justify-center rounded-full bg-teal-500 text-white">
                  <Mic className="h-10 w-10" />
                </span>
                <div className="min-w-0 text-center">
                  <p className="truncate text-base font-medium text-foreground">{attachment.name}</p>
                  <p className="text-sm text-muted-foreground">{attachment.type || "audio"}</p>
                </div>
                <audio src={attachmentPreviewUrl} className="w-full" controls />
              </div>
            )}

            {attachmentKind === "document" && (
              <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-lg border border-border bg-card p-8 text-center shadow-2xl">
                <span className="flex h-20 w-20 items-center justify-center rounded-full bg-purple-600 text-white">
                  <FileText className="h-10 w-10" />
                </span>
                <div className="min-w-0">
                  <p className="break-words text-base font-medium text-foreground">{attachment.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {attachment.type || "Arquivo"} · {(attachment.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="border-t border-border bg-card p-4">
            <div className="mx-auto flex w-full max-w-4xl items-center gap-3">
              <Input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                disabled={isSending}
                placeholder="Adicione uma legenda"
                className="h-11 flex-1 border-0 bg-secondary"
              />
              <Button
                type="submit"
                disabled={isSending}
                size="icon-lg"
                className="shrink-0 rounded-full bg-teal-500 text-white hover:bg-teal-600"
                aria-label="Enviar anexo"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </form>
        </div>
      )}

      {expandedImage && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/85 backdrop-blur-sm">
          <div className="flex h-14 items-center justify-end px-4">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setExpandedImage(null)}
              className="text-white hover:bg-white/10 hover:text-white"
              aria-label="Fechar imagem"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <button
            type="button"
            className="flex min-h-0 flex-1 items-center justify-center px-4 pb-6"
            onClick={() => setExpandedImage(null)}
            aria-label="Fechar imagem expandida"
          >
            <span className="relative block h-full max-h-full w-full max-w-6xl">
              <Image
                src={expandedImage.url}
                alt={expandedImage.alt}
                fill
                sizes="100vw"
                className="object-contain"
                priority
                unoptimized
              />
            </span>
          </button>
        </div>
      )}

      {forwardingMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border border-border bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">Encaminhar mensagem</p>
                <p className="truncate text-xs text-muted-foreground">{getMessagePreviewText(forwardingMessage)}</p>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => setForwardingMessage(null)} aria-label="Fechar encaminhamento">
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="space-y-3 p-4">
              <label className="block text-xs font-medium text-muted-foreground" htmlFor="forward-target">
                Enviar para
              </label>
              <select
                id="forward-target"
                value={selectedForwardTarget}
                onChange={(event) => setSelectedForwardTarget(event.target.value)}
                className="h-10 w-full rounded-md border border-border bg-secondary px-3 text-sm text-foreground outline-none transition-colors focus:border-teal-500"
              >
                {forwardTargets.map((target) => (
                  <option key={target.id} value={target.chat_id}>
                    {getDisplayName(target)}
                  </option>
                ))}
              </select>

              <div className="rounded-md border-l-4 border-teal-500 bg-secondary px-3 py-2">
                <p className="text-xs font-semibold text-teal-600 dark:text-teal-300">{forwardingMessage.from_me ? "Voce" : getDisplayName(chat)}</p>
                <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{getMessagePreviewText(forwardingMessage)}</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-border px-4 py-3">
              <Button type="button" variant="ghost" onClick={() => setForwardingMessage(null)}>
                Cancelar
              </Button>
              <Button
                type="button"
                className="bg-teal-500 text-white hover:bg-teal-600"
                onClick={handleForwardSubmit}
                disabled={!selectedForwardTarget || isForwarding}
              >
                {isForwarding ? (
                  "Encaminhando..."
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Encaminhar
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmationMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border border-border bg-card shadow-2xl">
            <div className="flex items-center gap-3 border-b border-border px-4 py-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-500">
                <Trash2 className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">Apagar mensagem?</p>
                <p className="text-xs text-muted-foreground">A acao sera enviada ao webhook de envio. O banco nao sera alterado diretamente.</p>
              </div>
            </div>

            <div className="space-y-3 p-4">
              <div className="rounded-md border-l-4 border-red-500 bg-secondary px-3 py-2">
                <p className="text-xs font-semibold text-red-500">{deleteConfirmationMessage.from_me ? "Voce" : getDisplayName(chat)}</p>
                <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{getMessagePreviewText(deleteConfirmationMessage)}</p>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Depois da confirmacao, a mensagem fica marcada visualmente como apagada e o webhook recebe os dados da mensagem original para processar o apagamento.
              </p>
            </div>

            <div className="flex justify-end gap-2 border-t border-border px-4 py-3">
              <Button type="button" variant="ghost" onClick={() => setDeleteConfirmationMessage(null)}>
                Cancelar
              </Button>
              <Button type="button" variant="destructive" onClick={handleDeleteMessage}>
                <Trash2 className="h-4 w-4" />
                Confirmar
              </Button>
            </div>
          </div>
        </div>
      )}

      {isDetailsOpen && <ContactDetails chat={chat} onClose={() => setIsDetailsOpen(false)} />}
    </div>
  );
}
