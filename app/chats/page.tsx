"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ContactList } from "@/components/chat/contact-list";
import { ChatWindow } from "@/components/chat/chat-window";
import { ChatRecord, MessageRecord, fetchChats, fetchMessages } from "@/lib/supabase-rest";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { ContactDetails } from "@/components/contact-details/contact-details";

const CHAT_PAGE_SIZE = 50;
const MESSAGE_PAGE_SIZE = 50;

export default function ChatsPage() {
  const [showDetails, setShowDetails] = useState(false);

  const [chats, setChats] = useState<ChatRecord[]>([]);
  const [searchChats, setSearchChats] = useState<ChatRecord[]>([]);
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [messagesChatId, setMessagesChatId] = useState<string>();
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
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [error, setError] = useState<string>();

  const isSearching = !!debouncedSearch.trim();
  const isSearchingChats = isSearching && searchChatsTerm !== debouncedSearch.trim();
  const visibleChats = isSearching ? searchChats : chats;
  const selectedChat = useMemo(() => visibleChats.find((chat) => chat.id === selectedChatId), [selectedChatId, visibleChats]);
  const selectedChatRemoteId = selectedChat?.chat_id;

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

  const loadOlderMessages = useCallback(async () => {
    if (!selectedChatRemoteId || isLoadingOlderMessages || !hasMoreMessages) return 0;

    setIsLoadingOlderMessages(true);

    try {
      const data = await fetchMessages(selectedChatRemoteId, {
        limit: MESSAGE_PAGE_SIZE,
        offset: messages.length,
      });
      const olderMessages = [...data].reverse();
      const knownIds = new Set(messages.map((message) => message.id));
      const newMessages = olderMessages.filter((message) => !knownIds.has(message.id));

      setMessages((current) => {
        const currentIds = new Set(current.map((message) => message.id));
        return [...olderMessages.filter((message) => !currentIds.has(message.id)), ...current];
      });
      setHasMoreMessages(data.length === MESSAGE_PAGE_SIZE);
      return newMessages.length;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel carregar mensagens antigas.");
      return 0;
    } finally {
      setIsLoadingOlderMessages(false);
    }
  }, [hasMoreMessages, isLoadingOlderMessages, messages, selectedChatRemoteId]);

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
        setSelectedChatId((current) => (data.some((chat) => chat.id === current) ? current : undefined));
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
        setMessages([...data].reverse());
        setMessagesChatId(selectedChatRemoteId);
        setHasMoreMessages(data.length === MESSAGE_PAGE_SIZE);
      })
      .catch((err) => {
        if (!isMounted) return;
        setMessages([]);
        setMessagesChatId(selectedChatRemoteId);
        setHasMoreMessages(false);
        setError(err instanceof Error ? err.message : "Nao foi possivel carregar as mensagens.");
      });

    return () => {
      isMounted = false;
    };
  }, [selectedChatRemoteId]);

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
        onSearchChange={setSearch}
        onSelect={setSelectedChatId}
        onLoadMore={loadMoreChats}
      />

      <PanelGroup direction="horizontal" className="flex-1">
        <Panel defaultSize={70} minSize={30}>
          <ChatWindow
            chat={selectedChat}
            messages={selectedChatRemoteId ? messages : []}
            isLoading={!!selectedChat?.chat_id && messagesChatId !== selectedChat.chat_id}
            isLoadingOlder={isLoadingOlderMessages}
            hasMoreMessages={!!selectedChatRemoteId && hasMoreMessages}
            onLoadOlderMessages={loadOlderMessages}
            onCloseChat={() => setSelectedChatId(undefined)}
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
