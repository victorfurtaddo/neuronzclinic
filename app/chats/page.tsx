"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ContactList } from "@/components/chat/contact-list";
import { ChatWindow } from "@/components/chat/chat-window";
import { ChatRecord, LatestMessageStatus, MessageRecord, fetchChats, fetchLatestMessageStatuses, fetchMessages, deleteMessage, deleteMessages, forwardMessage, forwardMessages, sendMessage } from "@/lib/supabase-rest";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { ContactDetails } from "@/components/contact-details/contact-details";

const CHAT_PAGE_SIZE = 50;
const MESSAGE_PAGE_SIZE = 50;

function getOptimisticMessageType(file: File | null) {
  if (!file) return "text";
  if (file.type.startsWith("audio/")) return "audio";
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  return "document";
}

function getMessagePreviewText(message: MessageRecord) {
  if (message.content?.trim()) return message.content.trim();

  const type = `${message.media_mime_type || ""} ${message.message_type || ""}`.toLowerCase();
  if (type.includes("image")) return "Foto";
  if (type.includes("video")) return "Video";
  if (type.includes("audio")) return "Audio";
  if (type.includes("sticker")) return "Figurinha";
  if (type.includes("document")) return "Documento";

  return "Mensagem";
}

function isMatchingSentMessage(message: MessageRecord, optimisticMessage: MessageRecord) {
  if (!message.from_me || !message.timestamp_msg || !optimisticMessage.timestamp_msg) return false;

  const messageTime = new Date(message.timestamp_msg).getTime();
  const optimisticTime = new Date(optimisticMessage.timestamp_msg).getTime();
  const isNearOptimisticTime = messageTime >= optimisticTime - 10000;

  if (!isNearOptimisticTime) return false;

  if (optimisticMessage.media_url || optimisticMessage.public_media_url) {
    return message.message_type === optimisticMessage.message_type || !!message.media_url || !!message.public_media_url;
  }

  return message.content?.trim() === optimisticMessage.content?.trim();
}

function hasFreshLatestStatus(chat: ChatRecord, latestStatus?: LatestMessageStatus) {
  if (!latestStatus) return false;
  if (!chat.last_message_time) return true;
  if (!latestStatus.timestamp_msg) return false;

  const chatMessageTime = Date.parse(chat.last_message_time);
  const statusMessageTime = Date.parse(latestStatus.timestamp_msg);

  if (!Number.isFinite(chatMessageTime) || !Number.isFinite(statusMessageTime)) {
    return latestStatus.timestamp_msg === chat.last_message_time;
  }

  return statusMessageTime >= chatMessageTime - 5000;
}

export default function ChatsPage() {
  const [showDetails, setShowDetails] = useState(false);

  const [chats, setChats] = useState<ChatRecord[]>([]);
  const [searchChats, setSearchChats] = useState<ChatRecord[]>([]);
  const [messagesByChatId, setMessagesByChatId] = useState<Record<string, MessageRecord[]>>({});
  const [latestMessageStatuses, setLatestMessageStatuses] = useState<Record<string, LatestMessageStatus>>({});
  const [selectedChatId, setSelectedChatId] = useState<string>();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [isLoadingMoreChats, setIsLoadingMoreChats] = useState(false);
  const [searchChatsTerm, setSearchChatsTerm] = useState("");
  const [isLoadingMoreSearchChats, setIsLoadingMoreSearchChats] = useState(false);
  const [hasMoreChats, setHasMoreChats] = useState(true);
  const [hasMoreSearchChats, setHasMoreSearchChats] = useState(false);
  const [isLoadingOlderMessages, setIsLoadingOlderMessages] = useState(false);
  const [hasMoreMessagesByChatId, setHasMoreMessagesByChatId] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string>();

  const isSearching = !!debouncedSearch.trim();
  const isSearchingChats = isSearching && searchChatsTerm !== debouncedSearch.trim();
  const visibleChats = isSearching ? searchChats : chats;
  const knownChats = useMemo(() => {
    const indexedChats = new Map<string, ChatRecord>();
    for (const chat of [...chats, ...searchChats]) indexedChats.set(chat.id, chat);
    return Array.from(indexedChats.values());
  }, [chats, searchChats]);
  const selectedChat = useMemo(() => knownChats.find((chat) => chat.id === selectedChatId), [knownChats, selectedChatId]);
  const selectedChatRemoteId = selectedChat?.chat_id;
  const messages = selectedChatRemoteId ? (messagesByChatId[selectedChatRemoteId] ?? []) : [];
  const hasMoreMessages = selectedChatRemoteId ? (hasMoreMessagesByChatId[selectedChatRemoteId] ?? false) : false;
  const hasLoadedSelectedMessages = !!selectedChatRemoteId && selectedChatRemoteId in messagesByChatId;
  const isLoadingSelectedMessages = !!selectedChatRemoteId && !hasLoadedSelectedMessages;
  const selectedChatRemoteIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    selectedChatRemoteIdRef.current = selectedChatRemoteId;
  }, [selectedChatRemoteId]);

  const loadMoreChats = useCallback(async () => {
    if (isSearching) {
      if (isLoadingMoreSearchChats || !hasMoreSearchChats) return;

      setIsLoadingMoreSearchChats(true);

      try {
        const data = await fetchChats({
          limit: CHAT_PAGE_SIZE,
          offset: searchChats.length,
          search: debouncedSearch,
        });
        setSearchChats((current) => {
          const knownIds = new Set(current.map((chat) => chat.id));
          return [...current, ...data.filter((chat) => !knownIds.has(chat.id))];
        });
        setHasMoreSearchChats(data.length === CHAT_PAGE_SIZE);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Nao foi possivel carregar mais resultados.");
      } finally {
        setIsLoadingMoreSearchChats(false);
      }
      return;
    }

    if (isLoadingMoreChats || !hasMoreChats) return;

    setIsLoadingMoreChats(true);

    try {
      const data = await fetchChats({ limit: CHAT_PAGE_SIZE, offset: chats.length });
      setChats((current) => {
        const knownIds = new Set(current.map((chat) => chat.id));
        return [...current, ...data.filter((chat) => !knownIds.has(chat.id))];
      });
      setHasMoreChats(data.length === CHAT_PAGE_SIZE);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel carregar mais chats.");
    } finally {
      setIsLoadingMoreChats(false);
    }
  }, [chats.length, debouncedSearch, hasMoreChats, hasMoreSearchChats, isLoadingMoreChats, isLoadingMoreSearchChats, isSearching, searchChats.length]);

  const setChatHasMoreMessages = useCallback((chatId: string, hasMore: boolean) => {
    setHasMoreMessagesByChatId((current) => ({
      ...current,
      [chatId]: hasMore,
    }));
  }, []);

  const loadOlderMessages = useCallback(async () => {
    if (!selectedChatRemoteId || isLoadingOlderMessages || !hasMoreMessages) return 0;

    setIsLoadingOlderMessages(true);
    const currentMessages = messagesByChatId[selectedChatRemoteId] ?? [];

    try {
      const data = await fetchMessages(selectedChatRemoteId, {
        limit: MESSAGE_PAGE_SIZE,
        offset: currentMessages.length,
      });
      const olderMessages = [...data].reverse();
      const knownIds = new Set(currentMessages.map((message) => message.id));
      const newMessages = olderMessages.filter((message) => !knownIds.has(message.id));

      setMessagesByChatId((current) => {
        const currentChatMessages = current[selectedChatRemoteId] ?? [];
        const currentIds = new Set(currentChatMessages.map((message) => message.id));
        return {
          ...current,
          [selectedChatRemoteId]: [...olderMessages.filter((message) => !currentIds.has(message.id)), ...currentChatMessages],
        };
      });
      setChatHasMoreMessages(selectedChatRemoteId, data.length === MESSAGE_PAGE_SIZE);
      return newMessages.length;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel carregar mensagens antigas.");
      return 0;
    } finally {
      setIsLoadingOlderMessages(false);
    }
  }, [hasMoreMessages, isLoadingOlderMessages, messagesByChatId, selectedChatRemoteId, setChatHasMoreMessages]);

  const replaceChatMessages = useCallback((chatId: string, nextMessages: MessageRecord[]) => {
    setMessagesByChatId((current) => ({
      ...current,
      [chatId]: nextMessages,
    }));
  }, []);

  const updateLatestMessageStatus = useCallback((chatId: string, freshMessages: MessageRecord[]) => {
    const latestMessage = freshMessages[freshMessages.length - 1];

    setLatestMessageStatuses((current) => ({
      ...current,
      [chatId]: {
        status: latestMessage?.status ?? null,
        timestamp_msg: latestMessage?.timestamp_msg ?? null,
      },
    }));
  }, []);

  const appendChatMessage = useCallback((chatId: string, message: MessageRecord) => {
    setMessagesByChatId((current) => ({
      ...current,
      [chatId]: [...(current[chatId] ?? []), message],
    }));
  }, []);

  const updateChatMessages = useCallback((chatId: string, updater: (messages: MessageRecord[]) => MessageRecord[]) => {
    setMessagesByChatId((current) => ({
      ...current,
      [chatId]: updater(current[chatId] ?? []),
    }));
  }, []);

  const refreshMessagesAfterSend = useCallback(
    async (chatId: string, optimisticId: string) => {
      const data = await fetchMessages(chatId, { limit: MESSAGE_PAGE_SIZE, offset: 0 });
      const freshMessages = [...data].reverse();

      updateLatestMessageStatus(chatId, freshMessages);

      if (selectedChatRemoteIdRef.current !== chatId) return;

      setMessagesByChatId((current) => {
        const currentMessages = current[chatId] ?? [];
        const optimisticMessage = currentMessages.find((message) => message.id === optimisticId);
        const nextMessages = (() => {
          if (!optimisticMessage) return freshMessages;

          const hasRealMessage = freshMessages.some((message) => isMatchingSentMessage(message, optimisticMessage));
          return hasRealMessage ? freshMessages : [...freshMessages, { ...optimisticMessage, status: "sent" }];
        })();

        return {
          ...current,
          [chatId]: nextMessages,
        };
      });
      setChatHasMoreMessages(chatId, data.length === MESSAGE_PAGE_SIZE);
    },
    [setChatHasMoreMessages, updateLatestMessageStatus],
  );

  const handleSendMessage = useCallback(
    async ({ text, file }: { text: string; file: File | null }) => {
      if (!selectedChatRemoteId) return;

      const timestamp = new Date().toISOString();
      const optimisticId = `optimistic-${crypto.randomUUID()}`;
      const localMediaUrl = file ? URL.createObjectURL(file) : null;
      const optimisticMessage: MessageRecord = {
        id: optimisticId,
        message_id: optimisticId,
        from_me: true,
        chat_id: selectedChatRemoteId,
        participant: null,
        message_type: getOptimisticMessageType(file),
        content: text || (file ? file.name : ""),
        media_url: null,
        media_path: null,
        media_mime_type: file?.type || null,
        public_media_url: localMediaUrl,
        public_midia_thumb: null,
        timestamp_msg: timestamp,
        status: "sending",
      };

      appendChatMessage(selectedChatRemoteId, optimisticMessage);
      setError(undefined);

      try {
        await sendMessage({ chatId: selectedChatRemoteId, text, file });
        await refreshMessagesAfterSend(selectedChatRemoteId, optimisticId);
        window.setTimeout(() => void refreshMessagesAfterSend(selectedChatRemoteId, optimisticId), 2500);
        window.setTimeout(() => void refreshMessagesAfterSend(selectedChatRemoteId, optimisticId), 7000);
      } catch (err) {
        updateChatMessages(selectedChatRemoteId, (current) => current.map((message) => (message.id === optimisticId ? { ...message, status: "error" } : message)));
        setError(err instanceof Error ? err.message : "Nao foi possivel enviar a mensagem.");
        throw err;
      } finally {
        if (localMediaUrl) {
          window.setTimeout(() => URL.revokeObjectURL(localMediaUrl), 60000);
        }
      }
    },
    [appendChatMessage, refreshMessagesAfterSend, selectedChatRemoteId, updateChatMessages],
  );

  const handleReplyMessage = useCallback(
    async ({ text, file, replyTo }: { text: string; file: File | null; replyTo: MessageRecord }) => {
      if (!selectedChatRemoteId) return;

      const timestamp = new Date().toISOString();
      const optimisticId = `optimistic-${crypto.randomUUID()}`;
      const localMediaUrl = file ? URL.createObjectURL(file) : null;
      const optimisticMessage: MessageRecord = {
        id: optimisticId,
        message_id: optimisticId,
        from_me: true,
        chat_id: selectedChatRemoteId,
        participant: null,
        message_type: getOptimisticMessageType(file),
        content: text || (file ? file.name : ""),
        media_url: null,
        media_path: null,
        media_mime_type: file?.type || null,
        public_media_url: localMediaUrl,
        public_midia_thumb: null,
        timestamp_msg: timestamp,
        status: "sending",
        quoted_message_id: replyTo.message_id || replyTo.id,
        quoted_content: getMessagePreviewText(replyTo),
        quoted_from_me: replyTo.from_me,
        quoted_message_type: replyTo.message_type,
      };

      appendChatMessage(selectedChatRemoteId, optimisticMessage);
      setError(undefined);

      try {
        await sendMessage({ chatId: selectedChatRemoteId, text, file, replyTo });
        await refreshMessagesAfterSend(selectedChatRemoteId, optimisticId);
        window.setTimeout(() => void refreshMessagesAfterSend(selectedChatRemoteId, optimisticId), 2500);
        window.setTimeout(() => void refreshMessagesAfterSend(selectedChatRemoteId, optimisticId), 7000);
      } catch (err) {
        updateChatMessages(selectedChatRemoteId, (current) => current.map((message) => (message.id === optimisticId ? { ...message, status: "error" } : message)));
        setError(err instanceof Error ? err.message : "Nao foi possivel responder a mensagem.");
        throw err;
      } finally {
        if (localMediaUrl) {
          window.setTimeout(() => URL.revokeObjectURL(localMediaUrl), 60000);
        }
      }
    },
    [appendChatMessage, refreshMessagesAfterSend, selectedChatRemoteId, updateChatMessages],
  );

  const handleForwardMessage = useCallback(
    async ({ message, targetChatId }: { message: MessageRecord; targetChatId: string }) => {
      await forwardMessage({ message, targetChatId });

      if (targetChatId === selectedChatRemoteId) {
        await refreshMessagesAfterSend(targetChatId, message.id);
      }
    },
    [refreshMessagesAfterSend, selectedChatRemoteId],
  );

  const handleForwardMessages = useCallback(
    async ({ messages, targetChatId }: { messages: MessageRecord[]; targetChatId: string }) => {
      await forwardMessages({ messages, targetChatId });

      if (targetChatId === selectedChatRemoteId) {
        await refreshMessagesAfterSend(targetChatId, messages[messages.length - 1]?.id || "");
      }
    },
    [refreshMessagesAfterSend, selectedChatRemoteId],
  );

  const handleDeleteMessage = useCallback(
    async (message: MessageRecord) => {
      if (!selectedChatRemoteId) return;

      const previousMessages = messagesByChatId[selectedChatRemoteId] ?? [];
      updateChatMessages(selectedChatRemoteId, (current) =>
        current.map((currentMessage) =>
          currentMessage.id === message.id
            ? {
                ...currentMessage,
                status: "deleted",
              }
            : currentMessage,
        ),
      );
      setError(undefined);

      try {
        await deleteMessage({ chatId: selectedChatRemoteId, message });
      } catch (err) {
        replaceChatMessages(selectedChatRemoteId, previousMessages);
        setError(err instanceof Error ? err.message : "Nao foi possivel apagar a mensagem.");
        throw err;
      }
    },
    [messagesByChatId, replaceChatMessages, selectedChatRemoteId, updateChatMessages],
  );

  const handleDeleteMessages = useCallback(
    async (messagesToDelete: MessageRecord[]) => {
      if (!selectedChatRemoteId || messagesToDelete.length === 0) return;

      const idsToDelete = new Set(messagesToDelete.map((message) => message.id));
      const previousMessages = messagesByChatId[selectedChatRemoteId] ?? [];
      updateChatMessages(selectedChatRemoteId, (current) =>
        current.map((currentMessage) =>
          idsToDelete.has(currentMessage.id)
            ? {
                ...currentMessage,
                status: "deleted",
              }
            : currentMessage,
        ),
      );
      setError(undefined);

      try {
        await deleteMessages({ chatId: selectedChatRemoteId, messages: messagesToDelete });
      } catch (err) {
        replaceChatMessages(selectedChatRemoteId, previousMessages);
        setError(err instanceof Error ? err.message : "Nao foi possivel apagar as mensagens.");
        throw err;
      }
    },
    [messagesByChatId, replaceChatMessages, selectedChatRemoteId, updateChatMessages],
  );

  useEffect(() => {
    let isMounted = true;

    fetchChats({ limit: CHAT_PAGE_SIZE, offset: 0 })
      .then((data) => {
        if (!isMounted) return;
        setChats(data);
        setHasMoreChats(data.length === CHAT_PAGE_SIZE);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : "Nao foi possivel carregar os chats.");
      })
      .finally(() => {
        if (isMounted) setIsLoadingChats(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    const term = debouncedSearch.trim();

    if (!term) {
      return;
    }

    let isMounted = true;

    fetchChats({ limit: CHAT_PAGE_SIZE, offset: 0, search: term })
      .then((data) => {
        if (!isMounted) return;
        setSearchChats(data);
        setSearchChatsTerm(term);
        setHasMoreSearchChats(data.length === CHAT_PAGE_SIZE);
      })
      .catch((err) => {
        if (!isMounted) return;
        setSearchChats([]);
        setSearchChatsTerm(term);
        setHasMoreSearchChats(false);
        setError(err instanceof Error ? err.message : "Nao foi possivel buscar os chats.");
      });

    return () => {
      isMounted = false;
    };
  }, [debouncedSearch]);

  useEffect(() => {
    if (!selectedChatRemoteId) {
      return;
    }

    let isMounted = true;

    fetchMessages(selectedChatRemoteId, { limit: MESSAGE_PAGE_SIZE, offset: 0 })
      .then((data) => {
        if (!isMounted) return;
        const freshMessages = [...data].reverse();
        replaceChatMessages(selectedChatRemoteId, freshMessages);
        updateLatestMessageStatus(selectedChatRemoteId, freshMessages);
        setChatHasMoreMessages(selectedChatRemoteId, data.length === MESSAGE_PAGE_SIZE);
      })
      .catch((err) => {
        if (!isMounted) return;
        replaceChatMessages(selectedChatRemoteId, []);
        setChatHasMoreMessages(selectedChatRemoteId, false);
        setError(err instanceof Error ? err.message : "Nao foi possivel carregar as mensagens.");
      });

    return () => {
      isMounted = false;
    };
  }, [selectedChatRemoteId]);

  useEffect(() => {
    const chatsNeedingStatus = visibleChats.filter((chat) => chat.last_message_fromMe && !hasFreshLatestStatus(chat, latestMessageStatuses[chat.chat_id]));
    const chatIds = chatsNeedingStatus.map((chat) => chat.chat_id);

    if (chatIds.length === 0) return;

    let isMounted = true;

    fetchLatestMessageStatuses(chatIds)
      .then((statuses) => {
        if (!isMounted) return;
        const statusesWithFallbacks: Record<string, LatestMessageStatus> = Object.fromEntries(
          chatsNeedingStatus.map((chat) => {
            const status = statuses[chat.chat_id];
            return [
              chat.chat_id,
              {
                status: status?.status ?? null,
                timestamp_msg: status?.timestamp_msg ?? chat.last_message_time,
              },
            ];
          }),
        );
        setLatestMessageStatuses((current) => ({ ...current, ...statusesWithFallbacks }));
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : "Nao foi possivel carregar os status das mensagens.");
      });

    return () => {
      isMounted = false;
    };
  }, [latestMessageStatuses, visibleChats]);

  const handleToggleStatus = () => {
    if (!selectedChatId) return;

    const toggleStatus = (list: ChatRecord[]) => list.map((chat) => (chat.id === selectedChatId ? { ...chat, finalizada: !chat.finalizada } : chat));

    setChats((current) => toggleStatus(current));
    setSearchChats((current) => toggleStatus(current));

    // 3. Persistência (Chamada de API)
    // try {
    //   await api.patch(`/chats/${selectedChat.id}`, { finalizada: newStatus });
    // } catch (error) {
    //   console.error("Erro ao atualizar status", error);
    //   // Opcional: Reverter o estado em caso de erro (Rollback)
    // }
  };

  const handleToggleIA = () => {
    if (!selectedChatId) return;

    const toggleIAStatus = (list: ChatRecord[]) => list.map((chat) => (chat.id === selectedChatId ? { ...chat, ia_responde: !chat.ia_responde } : chat));

    setChats((current) => toggleIAStatus(current));
    setSearchChats((current) => toggleIAStatus(current));

    // 3. Persistência de Dados (Comentado)
    /*
  const chatToUpdate = chats.find(c => c.id === selectedChatId);
  if (chatToUpdate) {
    try {
      await api.patch(`/chats/${selectedChatId}/config`, { 
        ia_responde: !chatToUpdate.ia_responde 
      });
    } catch (err) {
      console.error("Erro ao salvar configuração de IA:", err);
      // Opcional: Reverter o estado local em caso de falha (Rollback)
    }
  }
  */
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <ContactList
        chats={visibleChats}
        search={search}
        isLoading={isLoadingChats}
        isLoadingMore={isSearching ? isLoadingMoreSearchChats : isLoadingMoreChats}
        isSearching={isSearchingChats}
        hasMore={isSearching ? hasMoreSearchChats : hasMoreChats}
        selectedId={selectedChat?.id}
        latestMessageStatuses={latestMessageStatuses}
        onSearchChange={setSearch}
        onSelect={setSelectedChatId}
        onLoadMore={loadMoreChats}
      />

      <PanelGroup direction="horizontal" className="flex-1">
        <Panel defaultSize={70} minSize={30}>
          <ChatWindow
            chat={selectedChat}
            messages={messages}
            isLoading={isLoadingSelectedMessages}
            isLoadingOlder={isLoadingOlderMessages}
            hasMoreMessages={!!selectedChatRemoteId && hasMoreMessages}
            onLoadOlderMessages={loadOlderMessages}
            onCloseChat={() => setSelectedChatId(undefined)}
            onSendMessage={handleSendMessage}
            onReplyMessage={handleReplyMessage}
            onForwardMessage={handleForwardMessage}
            onForwardMessages={handleForwardMessages}
            onDeleteMessage={handleDeleteMessage}
            onDeleteMessages={handleDeleteMessages}
            forwardTargets={chats}
            error={error}
            onToggleDetails={() => setShowDetails(!showDetails)}
            isDetailsOpen={showDetails}
            onToggleStatus={handleToggleStatus}
          />
        </Panel>

        {selectedChat && showDetails && (
          <>
            <PanelResizeHandle className="w-1 bg-(--chat-muted)/50 transition-colors hover:bg-(--chat-primary)/50" />
            <Panel defaultSize={30} minSize={26} maxSize={40} className="bg-(--chat-card) border-l border-(--chat-muted)">
              <ContactDetails chat={selectedChat} onClose={() => setShowDetails(false)} onToggleStatus={handleToggleStatus} onToggleIA={handleToggleIA} />
            </Panel>
          </>
        )}
      </PanelGroup>
    </div>
  );
}
