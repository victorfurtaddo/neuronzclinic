"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { X, Pencil, Check, ChevronDown, Calendar, FileText, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { getChatTags, getReadableTextColor } from "@/lib/chat-tags";
import { ChatRecord } from "@/lib/supabase-rest";

interface ContactDetailsProps {
  chat?: ChatRecord;
  onClose?: () => void;
}

function getDisplayName(chat?: ChatRecord) {
  return chat?.nome_contato || chat?.pushname || chat?.chat_id?.replace("@s.whatsapp.net", "") || "Contato sem nome";
}

function getPhone(chat?: ChatRecord) {
  return chat?.phone_contact || chat?.chat_id?.replace("@s.whatsapp.net", "") || "";
}

export function ContactDetails({ chat, onClose }: ContactDetailsProps) {
  const [activeTab, setActiveTab] = useState<"contato" | "detalhes">("detalhes");
  const [bottomTab, setBottomTab] = useState<"consultas" | "avisos">("consultas");
  const [isRead, setIsRead] = useState(false);
  const [infoExpanded, setInfoExpanded] = useState(true);
  const tags = getChatTags(chat);

  const bottomTabs = [
    { id: "consultas", label: "Consultas" },
    { id: "avisos", label: "Avisos / Tarefas" },
  ] as const;

  return (
    <div className="flex h-full w-full flex-col border-l border-border bg-card">
      {/* Header with tabs */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium transition-colors text-foreground">Contato | Detalhes</label>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Status badge row */}
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
              <div className="h-5 w-5 rounded bg-gradient-to-br from-gray-300 to-gray-400" />
            </div>
            <button className="flex items-center gap-1 rounded px-2.5 py-1 text-xs font-medium text-white" style={{ backgroundColor: chat?.hex_status || (chat?.finalizada ? "#6b7280" : "#22c55e") }}>
              {chat?.finalizada ? "Finalizada" : chat?.Status_chat || "Aberta"}
              <ChevronDown className="h-3 w-3" />
            </button>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
            <FileText className="h-4 w-4" />
          </Button>
        </div>

        {/* Read status options */}
        <div className="mb-4 space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Check className="h-4 w-4" />
            <span>Marcar como lido</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Check className="h-4 w-4" />
            <span>Marcar como não lido</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4" />
              <span>{getPhone(chat)}</span>
            </div>
            <Switch checked={isRead} onCheckedChange={setIsRead} />
          </div>
        </div>

        {/* Contact name */}
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <Input value={getDisplayName(chat)} readOnly className="flex-1 border-0 border-b border-border bg-transparent px-0 text-base font-medium focus-visible:ring-0 rounded-none" />
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Status dropdowns row */}
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

        {/* Action buttons */}
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

        {/* Collapsible info section */}
        <div className="mb-4">
          <button onClick={() => setInfoExpanded(!infoExpanded)} className="flex w-full items-center justify-between py-2 text-sm font-medium text-foreground">
            Informações do contato
            <ChevronDown className={cn("h-4 w-4 transition-transform", infoExpanded && "rotate-180")} />
          </button>
        </div>

        {infoExpanded && (
          <>
            {/* Interesses */}
            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium text-foreground">Interesses</label>
              <button className="flex w-full items-center justify-between rounded border border-border bg-card px-3 py-2 text-sm text-muted-foreground">
                <span></span>
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>

            {/* Tags do contato */}
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

            {/* Anotações */}
            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium text-foreground">Anotações</label>
              <textarea className="min-h-[100px] w-full resize-none rounded border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" placeholder="" />
            </div>
          </>
        )}
      </div>

      {/* Bottom tabs */}
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

        {/* Tab content placeholder */}
        <div className="h-32 p-4">{bottomTab === "consultas" ? <p className="text-sm text-muted-foreground">Nenhuma consulta registrada</p> : <p className="text-sm text-muted-foreground">Nenhum aviso ou tarefa</p>}</div>
      </div>
    </div>
  );
}
