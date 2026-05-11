"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { ContactList } from "@/components/chat/contact-list"
import { ChatWindow } from "@/components/chat/chat-window"
import { ChatRecord, MessageRecord, fetchChats, fetchMessages } from "@/lib/supabase-rest"

const CHAT_PAGE_SIZE = 50
const MESSAGE_PAGE_SIZE = 50

export default function ChatsPage() {
  const [chats, setChats] = useState<ChatRecord[]>([])
  const [messages, setMessages] = useState<MessageRecord[]>([])
  const [messagesChatId, setMessagesChatId] = useState<string>()
  const [selectedChatId, setSelectedChatId] = useState<string>()
  const [isLoadingChats, setIsLoadingChats] = useState(true)
  const [isLoadingMoreChats, setIsLoadingMoreChats] = useState(false)
  const [hasMoreChats, setHasMoreChats] = useState(true)
  const [isLoadingOlderMessages, setIsLoadingOlderMessages] = useState(false)
  const [hasMoreMessages, setHasMoreMessages] = useState(false)
  const [error, setError] = useState<string>()

  const selectedChat = useMemo(
    () => chats.find((chat) => chat.id === selectedChatId) ?? chats[0],
    [chats, selectedChatId],
  )
  const selectedChatRemoteId = selectedChat?.chat_id

  const loadMoreChats = useCallback(async () => {
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
  }, [chats.length, hasMoreChats, isLoadingMoreChats])

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

  useEffect(() => {
    let isMounted = true

    fetchChats({ limit: CHAT_PAGE_SIZE, offset: 0 })
      .then((data) => {
        if (!isMounted) return
        setChats(data)
        setSelectedChatId((current) => current ?? data[0]?.id)
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

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <ContactList
        chats={chats}
        isLoading={isLoadingChats}
        isLoadingMore={isLoadingMoreChats}
        hasMore={hasMoreChats}
        selectedId={selectedChat?.id}
        onSelect={setSelectedChatId}
        onLoadMore={loadMoreChats}
      />
      <ChatWindow
        chat={selectedChat}
        messages={messages}
        isLoading={!!selectedChat?.chat_id && messagesChatId !== selectedChat.chat_id}
        isLoadingOlder={isLoadingOlderMessages}
        hasMoreMessages={hasMoreMessages}
        onLoadOlderMessages={loadOlderMessages}
        error={error}
      />
    </div>
  )
}
