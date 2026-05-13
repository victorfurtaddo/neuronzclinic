"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { X, Pencil, ChevronDown, Calendar, FileText, Phone, CheckCheck, MessageSquareDashed, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { getChatTags, getReadableTextColor } from "@/lib/chat-tags";
import { ChatRecord } from "@/lib/supabase-rest";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

interface ContactDetailsProps {
  chat?: ChatRecord;
  onClose?: () => void;
  onToggleStatus: () => void;
}

function getDisplayName(chat?: ChatRecord) {
  return chat?.nome_contato || chat?.pushname || chat?.chat_id?.replace("@s.whatsapp.net", "") || "Contato sem nome";
}

function getPhone(chat?: ChatRecord) {
  return chat?.phone_contact || chat?.chat_id?.replace("@s.whatsapp.net", "") || "";
}

export function ContactDetails({ chat, onClose, onToggleStatus }: ContactDetailsProps) {
  const [bottomTab, setBottomTab] = useState<"consultas" | "avisos">("consultas");
  const [infoExpanded, setInfoExpanded] = useState(true);
  const tags = getChatTags(chat);

  const bottomTabs = [
    { id: "consultas", label: "Consultas" },
    { id: "avisos", label: "Avisos / Tarefas" },
  ] as const;

  return (
    <div className="flex h-full w-full flex-col border-l border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium transition-colors text-foreground">Detalhes do contato</label>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex items-start gap-4 p-4">
          <Avatar className="h-16 w-16 shrink-0 shadow-sm">
            <AvatarImage src={chat?.url_foto_perfil ?? undefined} alt={chat?.nome_contato || ""} className="rounded-full" />
            <AvatarFallback className="bg-(--chat-muted) text-(--chat-muted-foreground)">{chat?.nome_contato?.charAt(0) || "U"}</AvatarFallback>
          </Avatar>

          <div className="flex flex-1 flex-col gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex w-full items-center justify-between rounded-md px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 shadow-sm"
                  style={{ backgroundColor: chat?.finalizada ? "#00c950" : "#2b7fff" }}
                >
                  {chat?.finalizada ? "Finalizada" : "Aberta"}
                  <ChevronDown className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="start" className="w-48 shadow-xl z-[100]">
                <DropdownMenuItem className="cursor-pointer" onClick={() => onToggleStatus()}>
                  {chat?.finalizada ? "Reabrir Conversa" : "Finalizar Conversa"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="space-y-1.5">
              <button className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
                <CheckCheck className="h-3.5 w-3.5 text-blue-500" />
                <span>Marcar como lido</span>
              </button>
              <button className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
                <MessageSquareDashed className="h-3.5 w-3.5" />
                <span>Marcar como não lido</span>
              </button>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Phone className="h-3.5 w-3.5" />
                <span>{chat?.phone_contact || "Sem telefone"}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={!chat?.ia_responde}
                    className={cn("h-10 w-10 border-2 shadow-sm transition-all", chat?.ia_responde ? "border-(--chat-primary) text-(--chat-primary) hover:bg-(--chat-primary)/10" : "opacity-50")}
                    onClick={() => /* Abrir componente de treinamento */ {}}
                  >
                    <Bot className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p>{chat?.ia_responde ? "Treinar sua IA" : "Ative a IA para treinar"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <div className="flex flex-col items-center gap-1">
              <Switch checked={!!chat?.ia_responde} onCheckedChange={(val) => /* lógica de update ia_responde */ {}} className="data-[state=checked]:bg-[#22c55e]" />
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">IA</span>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center gap-2">
            <Input value={getDisplayName(chat)} readOnly className="flex-1 border-0 border-b border-border bg-transparent px-0 text-base font-medium focus-visible:ring-0 rounded-none" />
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs text-muted-foreground">Status contato</label>
            <button className="flex w-full items-center justify-between rounded bg-red-500 px-3 py-1.5 text-sm font-medium text-white">
              {chat?.Status_chat || "Nenhum"}
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-muted-foreground">Status agendamento</label>
            <button className="flex w-full items-center justify-between rounded bg-muted px-3 py-1.5 text-sm text-muted-foreground">
              Nenhum
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3">
          <button className="flex items-center justify-between rounded border border-border bg-card px-3 py-2 text-sm text-foreground hover:bg-muted">
            <span>+ Agendamento</span>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </button>
          <button className="flex items-center justify-between rounded border border-border bg-card px-3 py-2 text-sm text-foreground hover:bg-muted">
            <span>+ Aviso / Tarefa</span>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="mb-4">
          <button onClick={() => setInfoExpanded(!infoExpanded)} className="flex w-full items-center justify-between py-2 text-sm font-medium text-foreground">
            Informações do contato
            <ChevronDown className={cn("h-4 w-4 transition-transform", infoExpanded && "rotate-180")} />
          </button>
        </div>

        {infoExpanded && (
          <>
            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium text-foreground">Interesses</label>
              <button className="flex w-full items-center justify-between rounded border border-border bg-card px-3 py-2 text-sm text-muted-foreground">
                <span></span>
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium text-foreground">Tags do contato</label>
              <div className="flex flex-wrap items-center gap-2 rounded border border-border bg-card px-3 py-2">
                {tags.length > 0 ? (
                  tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="flex items-center gap-1 rounded bg-teal-600 px-2 py-0.5 text-xs font-medium text-white"
                      style={
                        tag.color
                          ? {
                              backgroundColor: tag.color,
                              color: getReadableTextColor(tag.color),
                            }
                          : undefined
                      }
                    >
                      {tag.label}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">Nenhuma tag</span>
                )}
                <ChevronDown className="ml-auto h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium text-foreground">Anotações</label>
              <textarea className="min-h-[100px] w-full resize-none rounded border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" placeholder="" />
            </div>
          </>
        )}
      </div>

      <div className="border-t border-border">
        <div className="flex">
          {bottomTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setBottomTab(tab.id)}
              className={cn("flex-1 border-b-2 px-4 py-3 text-sm font-medium transition-colors", bottomTab === tab.id ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="h-32 p-4">{bottomTab === "consultas" ? <p className="text-sm text-muted-foreground">Nenhuma consulta registrada</p> : <p className="text-sm text-muted-foreground">Nenhum aviso ou tarefa</p>}</div>
      </div>
    </div>
  );
}
