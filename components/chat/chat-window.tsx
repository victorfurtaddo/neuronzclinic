"use client";

import { cn } from "@/lib/utils";
import { Paperclip, Mic, Send, MoreHorizontal, FileText, Eye, Download, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { ContactDetails } from "./contact-details";

interface Message {
  id: string;
  content?: string;
  sender: "contact" | "user";
  senderName?: string;
  timestamp: string;
  date?: string;
  isFile?: boolean;
  fileName?: string;
}

const messages: Message[] = [
  {
    id: "0",
    content: "",
    sender: "user",
    timestamp: "17:03",
    date: "01/04/26",
  },
  {
    id: "1",
    content: "teste",
    sender: "user",
    senderName: "Pedro",
    timestamp: "22:36",
    date: "08/04/26",
  },
  {
    id: "2",
    content: "teste2",
    sender: "user",
    senderName: "Pedro",
    timestamp: "11:55",
    date: "09/04/26",
  },
  {
    id: "3",
    content: "Teste",
    sender: "contact",
    senderName: "Victor",
    timestamp: "12:03",
    date: "09/04/26",
  },
  {
    id: "4",
    content: "teste3",
    sender: "user",
    senderName: "Pedro",
    timestamp: "12:02",
    date: "09/04/26",
  },
  {
    id: "5",
    content: "Test",
    sender: "user",
    senderName: "Pedro",
    timestamp: "15:42",
    date: "09/04/26",
  },
  {
    id: "6",
    sender: "user",
    senderName: "Pedro",
    timestamp: "14:16",
    date: "15/04/26",
    isFile: true,
    fileName: "1776273408497_audio_1766448528588.txt",
  },
  {
    id: "7",
    content: "Teste",
    sender: "user",
    senderName: "Pedro",
    timestamp: "11:28",
    date: "17/04/26",
  },
];

export function ChatWindow() {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  return (
    <div className="flex flex-1 h-full overflow-hidden bg-background">
      <div className="flex flex-1 flex-col border-r border-border">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
          <div className="flex items-center gap-3">
            {/* 4. Transformei o avatar em um botão para abrir os detalhes */}
            <button onClick={() => setIsDetailsOpen(true)} className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-teal-700 hover:opacity-90 transition-opacity">
              <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 7.001c0 3.865-3.134 7-7 7s-7-3.135-7-7c0-3.867 3.134-7.001 7-7.001s7 3.134 7 7.001zm-1.598 7.18c-1.506 1.137-3.374 1.82-5.402 1.82-2.03 0-3.899-.685-5.407-1.822-4.072 1.793-6.593 7.376-6.593 9.821h24c0-2.423-2.6-8.006-6.598-9.819z" />
              </svg>
            </button>
            <div className="flex flex-col">
              <span className="font-medium text-foreground leading-none">Victor</span>
              <span className="text-[10px] text-muted-foreground mt-1">Online</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button className="bg-teal-500 hover:bg-teal-600 text-white font-medium px-4">Finalizar</Button>
            {/* 5. Outro lugar comum para abrir detalhes é no "Mais" ou em um ícone de info */}
            <Button variant="ghost" size="icon" onClick={() => setIsDetailsOpen(!isDetailsOpen)} className={cn("text-muted-foreground hover:text-foreground", isDetailsOpen && "bg-muted")}>
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Messages Area - WhatsApp style background */}
        <div
          className="flex-1 overflow-y-auto"
          style={{
            backgroundColor: "#e5ddd5",
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 800 800'%3E%3Cg fill='none' stroke='%23d4cdc4' stroke-width='1'%3E%3Cpath d='M769 229L1037 260.9M927 880L731 737 702 614M927 880L1062 914'/%3E%3Cpath d='M-7 55L206 72 156 203M-7 55L-35 181 88 208'/%3E%3Cpath d='M203 360L151 461 45 393 92 266 203 360z'/%3E%3Cpath d='M568 65L713 159 659 279 442 234 568 65z'/%3E%3Cpath d='M-109 356L-42 453 -90 571 -152 422'/%3E%3Cpath d='M393 608L402 717 289 685 325 594 393 608z'/%3E%3Cpath d='M678 385L711 492 573 429 620 345 678 385z'/%3E%3Cpath d='M-87 718L-11 820 72 749 12 654 -87 718z'/%3E%3C/g%3E%3C/svg%3E")`,
            backgroundRepeat: "repeat",
          }}
        >
          <div className="flex h-full">
            {/* Left side - Contact messages */}
            <div className="flex-1 p-4">
              {messages
                .filter((m) => m.sender === "contact")
                .map((message) => (
                  <div key={message.id} className="mb-3">
                    <div className="inline-block max-w-xs rounded-lg rounded-tl-none bg-white px-3 py-2 shadow-sm">
                      {message.senderName && <p className="text-sm font-medium text-teal-600 mb-1">{message.senderName}</p>}
                      <p className="text-sm text-foreground">{message.content}</p>
                      <p className="mt-1 text-right text-[10px] text-muted-foreground">
                        {message.date} {message.timestamp}
                      </p>
                    </div>
                  </div>
                ))}
            </div>

            {/* Right side - User messages */}
            <div className="flex w-[280px] flex-col items-end gap-2 p-4">
              {messages
                .filter((m) => m.sender === "user")
                .map((message) => (
                  <div key={message.id} className="w-full">
                    {message.isFile ? (
                      <div className="ml-auto w-fit max-w-[240px] rounded-lg rounded-tr-none bg-[#dcf8c6] px-3 py-2 shadow-sm">
                        {message.senderName && <p className="text-sm font-medium text-teal-700 mb-2">{message.senderName}:</p>}
                        <div className="flex flex-col items-center gap-2 rounded-lg bg-white/50 p-3">
                          <FileText className="h-8 w-8 text-muted-foreground" />
                          <p className="text-xs text-center text-foreground break-all">{message.fileName}</p>
                          <div className="flex w-full gap-2 mt-1">
                            <button className="flex flex-1 items-center justify-center gap-1 rounded bg-white/80 px-2 py-1.5 text-xs text-muted-foreground hover:bg-white">
                              <Eye className="h-3 w-3" />
                              Visualizar
                            </button>
                            <button className="flex flex-1 items-center justify-center gap-1 rounded bg-white/80 px-2 py-1.5 text-xs text-muted-foreground hover:bg-white">
                              <Download className="h-3 w-3" />
                              Baixar
                            </button>
                          </div>
                        </div>
                        <p className="mt-2 text-right text-[10px] text-muted-foreground">
                          {message.date} {message.timestamp}
                        </p>
                      </div>
                    ) : message.content ? (
                      <div className="ml-auto w-fit max-w-[200px] rounded-lg rounded-tr-none bg-[#dcf8c6] px-3 py-2 shadow-sm">
                        {message.senderName && <p className="text-sm font-medium text-teal-700 mb-0.5">{message.senderName}:</p>}
                        <p className="text-sm text-foreground">{message.content}</p>
                        <p className="mt-1 text-right text-[10px] text-muted-foreground">
                          {message.date} {message.timestamp}
                        </p>
                      </div>
                    ) : (
                      <div className="ml-auto w-fit rounded-lg rounded-tr-none bg-[#1f2937] px-3 py-2 shadow-sm">
                        <div className="h-12 w-32"></div>
                        <p className="mt-1 text-right text-[10px] text-gray-400">
                          {message.date} {message.timestamp}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Input Area */}
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

            <div className="flex-1">
              <Input placeholder="Digite uma mensagem" className="bg-secondary border-0" />
            </div>

            <Button size="icon" className="shrink-0 rounded-full bg-teal-500 text-white hover:bg-teal-600">
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {isDetailsOpen && <ContactDetails onClose={() => setIsDetailsOpen(false)} />}
    </div>
  );
}

