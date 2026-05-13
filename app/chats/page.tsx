"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ContactList } from "@/components/chat/contact-list"
import { ChatWindow } from "@/components/chat/chat-window"
import {
  ChatRecord,
  LatestMessageStatus,
  MessageRecord,
  fetchChats,
  fetchLatestMessageStatuses,
  fetchMessages,
  deleteMessage,
  forwardMessage,
  sendMessage,
} from "@/lib/supabase-rest"

const CHAT_PAGE_SIZE = 50
const MESSAGE_PAGE_SIZE = 50

function getOptimisticMessageType(file: File | null) {
  if (!file) return "text"
  if (file.type.startsWith("audio/")) return "audio"
  if (file.type.startsWith("image/")) return "image"
  if (file.type.startsWith("video/")) return "video"
  return "document"
}

function getMessagePreviewText(message: MessageRecord) {
  if (message.content?.trim()) return message.content.trim()

  const type = `${message.media_mime_type || ""} ${message.message_type || ""}`.toLowerCase()
  if (type.includes("image")) return "Foto"
  if (type.includes("video")) return "Video"
  if (type.includes("audio")) return "Audio"
  if (type.includes("sticker")) return "Figurinha"
  if (type.includes("document")) return "Documento"

  return "Mensagem"
}

function isMatchingSentMessage(message: MessageRecord, optimisticMessage: MessageRecord) {
  if (!message.from_me || !message.timestamp_msg || !optimisticMessage.timestamp_msg) return false

  const messageTime = new Date(message.timestamp_msg).getTime()
  const optimisticTime = new Date(optimisticMessage.timestamp_msg).getTime()
  const isNearOptimisticTime = messageTime >= optimisticTime - 10000

  if (!isNearOptimisticTime) return false

  if (optimisticMessage.media_url || optimisticMessage.public_media_url) {
    return message.message_type === optimisticMessage.message_type || !!message.media_url || !!message.public_media_url
  }

  return message.content?.trim() === optimisticMessage.content?.trim()
}

export default function ChatsPage() {
  const [chats, setChats] = useState<ChatRecord[]>([])
  const [searchChats, setSearchChats] = useState<ChatRecord[]>([])
  const [messages, setMessages] = useState<MessageRecord[]>([])
  const [latestMessageStatuses, setLatestMessageStatuses] = useState<Record<string, LatestMessageStatus>>({})
  const [messagesChatId, setMessagesChatId] = useState<string>()
  const [selectedChatId, setSelectedChatId] = useState<string>()
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [isLoadingChats, setIsLoadingChats] = useState(true)
  const [isLoadingMoreChats, setIsLoadingMoreChats] = useState(false)
  const [searchChatsTerm, setSearchChatsTerm] = useState("")
  const [isLoadingMoreSearchChats, setIsLoadingMoreSearchChats] = useState(false)
  const [hasMoreChats, setHasMoreChats] = useState(true)
  const [hasMoreSearchChats, setHasMoreSearchChats] = useState(false)
  const [isLoadingOlderMessages, setIsLoadingOlderMessages] = useState(false)
  const [hasMoreMessages, setHasMoreMessages] = useState(false)
  const [error, setError] = useState<string>()

  const isSearching = !!debouncedSearch.trim()
  const isSearchingChats = isSearching && searchChatsTerm !== debouncedSearch.trim()
  const visibleChats = isSearching ? searchChats : chats
  const selectedChat = useMemo(
    () => visibleChats.find((chat) => chat.id === selectedChatId),
    [selectedChatId, visibleChats],
  )
  const selectedChatRemoteId = selectedChat?.chat_id
  const selectedChatRemoteIdRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    selectedChatRemoteIdRef.current = selectedChatRemoteId
  }, [selectedChatRemoteId])

  const loadMoreChats = useCallback(async () => {
    if (isSearching) {
      if (isLoadingMoreSearchChats || !hasMoreSearchChats) return

      setIsLoadingMoreSearchChats(true)

      try {
        const data = await fetchChats({
          limit: CHAT_PAGE_SIZE,
          offset: searchChats.length,
          search: debouncedSearch,
        })
        setSearchChats((current) => {
          const knownIds = new Set(current.map((chat) => chat.id))
          return [...current, ...data.filter((chat) => !knownIds.has(chat.id))]
        })
        setHasMoreSearchChats(data.length === CHAT_PAGE_SIZE)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Nao foi possivel carregar mais resultados.")
      } finally {
        setIsLoadingMoreSearchChats(false)
      }
      return
    }

    if (isLoadingMoreChats || !hasMoreChats) return

    setIsLoadingMoreChats(true)

    try {
      const data = await fetchChats({ limit: CHAT_PAGE_SIZE, offset: chats.length })
      setChats((current) => {
        const knownIds = new Set(current.map((chat) => chat.id))
        return [...current, ...data.filter((chat) => !knownIds.has(chat.id))]
      })
      setHasMoreChats(data.length === CHAT_PAGE_SIZE)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel carregar mais chats.")
    } finally {
      setIsLoadingMoreChats(false)
    }
  }, [
    chats.length,
    debouncedSearch,
    hasMoreChats,
    hasMoreSearchChats,
    isLoadingMoreChats,
    isLoadingMoreSearchChats,
    isSearching,
    searchChats.length,
  ])

  const loadOlderMessages = useCallback(async () => {
    if (!selectedChatRemoteId || isLoadingOlderMessages || !hasMoreMessages) return 0

    setIsLoadingOlderMessages(true)

    try {
      const data = await fetchMessages(selectedChatRemoteId, {
        limit: MESSAGE_PAGE_SIZE,
        offset: messages.length,
      })
      const olderMessages = [...data].reverse()
      const knownIds = new Set(messages.map((message) => message.id))
      const newMessages = olderMessages.filter((message) => !knownIds.has(message.id))

      setMessages((current) => {
        const currentIds = new Set(current.map((message) => message.id))
        return [...olderMessages.filter((message) => !currentIds.has(message.id)), ...current]
      })
      setHasMoreMessages(data.length === MESSAGE_PAGE_SIZE)
      return newMessages.length
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel carregar mensagens antigas.")
      return 0
    } finally {
      setIsLoadingOlderMessages(false)
    }
  }, [hasMoreMessages, isLoadingOlderMessages, messages, selectedChatRemoteId])

  const refreshMessagesAfterSend = useCallback(
    async (chatId: string, optimisticId: string) => {
      const data = await fetchMessages(chatId, { limit: MESSAGE_PAGE_SIZE, offset: 0 })
      const freshMessages = [...data].reverse()

      if (selectedChatRemoteIdRef.current !== chatId) return

      setMessages((current) => {
        const optimisticMessage = current.find((message) => message.id === optimisticId)
        if (!optimisticMessage) return freshMessages

        const hasRealMessage = freshMessages.some((message) => isMatchingSentMessage(message, optimisticMessage))
        return hasRealMessage ? freshMessages : [...freshMessages, { ...optimisticMessage, status: "sent" }]
      })
      setMessagesChatId(chatId)
      setHasMoreMessages(data.length === MESSAGE_PAGE_SIZE)
    },
    [],
  )

  const handleSendMessage = useCallback(
    async ({ text, file }: { text: string; file: File | null }) => {
      if (!selectedChatRemoteId) return

      const timestamp = new Date().toISOString()
      const optimisticId = `optimistic-${crypto.randomUUID()}`
      const localMediaUrl = file ? URL.createObjectURL(file) : null
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
      }

      setMessages((current) => [...current, optimisticMessage])
      setError(undefined)

      try {
        await sendMessage({ chatId: selectedChatRemoteId, text, file })
        await refreshMessagesAfterSend(selectedChatRemoteId, optimisticId)
        window.setTimeout(() => void refreshMessagesAfterSend(selectedChatRemoteId, optimisticId), 2500)
        window.setTimeout(() => void refreshMessagesAfterSend(selectedChatRemoteId, optimisticId), 7000)
      } catch (err) {
        setMessages((current) =>
          current.map((message) => (message.id === optimisticId ? { ...message, status: "error" } : message)),
        )
        setError(err instanceof Error ? err.message : "Nao foi possivel enviar a mensagem.")
        throw err
      } finally {
        if (localMediaUrl) {
          window.setTimeout(() => URL.revokeObjectURL(localMediaUrl), 60000)
        }
      }
    },
    [refreshMessagesAfterSend, selectedChatRemoteId],
  )

  const handleReplyMessage = useCallback(
    async ({ text, file, replyTo }: { text: string; file: File | null; replyTo: MessageRecord }) => {
      if (!selectedChatRemoteId) return

      const timestamp = new Date().toISOString()
      const optimisticId = `optimistic-${crypto.randomUUID()}`
      const localMediaUrl = file ? URL.createObjectURL(file) : null
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
      }

      setMessages((current) => [...current, optimisticMessage])
      setError(undefined)

      try {
        await sendMessage({ chatId: selectedChatRemoteId, text, file, replyTo })
        await refreshMessagesAfterSend(selectedChatRemoteId, optimisticId)
        window.setTimeout(() => void refreshMessagesAfterSend(selectedChatRemoteId, optimisticId), 2500)
        window.setTimeout(() => void refreshMessagesAfterSend(selectedChatRemoteId, optimisticId), 7000)
      } catch (err) {
        setMessages((current) =>
          current.map((message) => (message.id === optimisticId ? { ...message, status: "error" } : message)),
        )
        setError(err instanceof Error ? err.message : "Nao foi possivel responder a mensagem.")
        throw err
      } finally {
        if (localMediaUrl) {
          window.setTimeout(() => URL.revokeObjectURL(localMediaUrl), 60000)
        }
      }
    },
    [refreshMessagesAfterSend, selectedChatRemoteId],
  )

  const handleForwardMessage = useCallback(
    async ({ message, targetChatId }: { message: MessageRecord; targetChatId: string }) => {
      await forwardMessage({ message, targetChatId })

      if (targetChatId === selectedChatRemoteId) {
        await refreshMessagesAfterSend(targetChatId, message.id)
      }
    },
    [refreshMessagesAfterSend, selectedChatRemoteId],
  )

  const handleDeleteMessage = useCallback(
    async (message: MessageRecord) => {
      if (!selectedChatRemoteId) return

      const previousMessages = messages
      setMessages((current) =>
        current.map((currentMessage) =>
          currentMessage.id === message.id
            ? {
                ...currentMessage,
                status: "deleted",
              }
            : currentMessage,
        ),
      )
      setError(undefined)

      try {
        await deleteMessage({ chatId: selectedChatRemoteId, message })
      } catch (err) {
        setMessages(previousMessages)
        setError(err instanceof Error ? err.message : "Nao foi possivel apagar a mensagem.")
        throw err
      }
    },
    [messages, selectedChatRemoteId],
  )

  useEffect(() => {
    let isMounted = true

    fetchChats({ limit: CHAT_PAGE_SIZE, offset: 0 })
      .then((data) => {
        if (!isMounted) return
        setChats(data)
        setHasMoreChats(data.length === CHAT_PAGE_SIZE)
      })
      .catch((err) => {
        if (!isMounted) return
        setError(err instanceof Error ? err.message : "Nao foi possivel carregar os chats.")
      })
      .finally(() => {
        if (isMounted) setIsLoadingChats(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search.trim())
    }, 350)

    return () => window.clearTimeout(timeout)
  }, [search])

  useEffect(() => {
    const term = debouncedSearch.trim()

    if (!term) {
      return
    }

    let isMounted = true

    fetchChats({ limit: CHAT_PAGE_SIZE, offset: 0, search: term })
      .then((data) => {
        if (!isMounted) return
        setSearchChats(data)
        setSearchChatsTerm(term)
        setSelectedChatId((current) => (data.some((chat) => chat.id === current) ? current : undefined))
        setHasMoreSearchChats(data.length === CHAT_PAGE_SIZE)
      })
      .catch((err) => {
        if (!isMounted) return
        setSearchChats([])
        setSearchChatsTerm(term)
        setHasMoreSearchChats(false)
        setError(err instanceof Error ? err.message : "Nao foi possivel buscar os chats.")
      })

    return () => {
      isMounted = false
    }
  }, [debouncedSearch])

  useEffect(() => {
    if (!selectedChatRemoteId) {
      return
    }

    let isMounted = true

    fetchMessages(selectedChatRemoteId, { limit: MESSAGE_PAGE_SIZE, offset: 0 })
      .then((data) => {
        if (!isMounted) return
        setMessages([...data].reverse())
        setMessagesChatId(selectedChatRemoteId)
        setHasMoreMessages(data.length === MESSAGE_PAGE_SIZE)
      })
      .catch((err) => {
        if (!isMounted) return
        setMessages([])
        setMessagesChatId(selectedChatRemoteId)
        setHasMoreMessages(false)
        setError(err instanceof Error ? err.message : "Nao foi possivel carregar as mensagens.")
      })

    return () => {
      isMounted = false
    }
  }, [selectedChatRemoteId])

  useEffect(() => {
    const chatIds = visibleChats
      .map((chat) => chat.chat_id)
      .filter((chatId) => !(chatId in latestMessageStatuses))

    if (chatIds.length === 0) return

    let isMounted = true

    fetchLatestMessageStatuses(chatIds)
      .then((statuses) => {
        if (!isMounted) return
        setLatestMessageStatuses((current) => ({ ...current, ...statuses }))
      })
      .catch((err) => {
        if (!isMounted) return
        setError(err instanceof Error ? err.message : "Nao foi possivel carregar os status das mensagens.")
      })

    return () => {
      isMounted = false
    }
  }, [latestMessageStatuses, visibleChats])

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
      <ChatWindow
        chat={selectedChat}
        messages={selectedChatRemoteId ? messages : []}
        isLoading={!!selectedChat?.chat_id && messagesChatId !== selectedChat.chat_id}
        isLoadingOlder={isLoadingOlderMessages}
        hasMoreMessages={!!selectedChatRemoteId && hasMoreMessages}
        onLoadOlderMessages={loadOlderMessages}
        onCloseChat={() => setSelectedChatId(undefined)}
        onSendMessage={handleSendMessage}
        onReplyMessage={handleReplyMessage}
        onForwardMessage={handleForwardMessage}
        onDeleteMessage={handleDeleteMessage}
        forwardTargets={chats}
        error={error}
      />
    </div>
  )
}
