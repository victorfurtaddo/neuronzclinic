const SUPABASE_REST_URL = process.env.NEXT_PUBLIC_SUPABASE_REST_URL

const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

if (!SUPABASE_REST_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_REST_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")
}

const headers = {
  apikey: SUPABASE_PUBLISHABLE_KEY,
  Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
}

export interface ChatRecord {
  id: string
  chat_id: string
  nome_contato: string | null
  pushname: string | null
  phone_contact: string | null
  url_foto_perfil: string | null
  text_last_message: string | null
  last_message_time: string | null
  last_time_formatado: string | null
  unread_count: number | null
  pinned: boolean | null
  archived: boolean | null
  finalizada: boolean | null
  ia_responde: boolean | null
  Status_chat: string | null
  hex_status: string | null
  json_tags: unknown
  json_tags_parsed: unknown
  tag_chat_array: unknown
  dono: string | null
  setor: string | null
  grupo: unknown
  draft: string | null
  lid_id: string | null
  updated_at: string | null
}

export interface MessageRecord {
  id: string
  message_id: string | null
  from_me: boolean | null
  chat_id: string | null
  participant: string | null
  message_type: string | null
  content: string | null
  media_url: string | null
  media_path: string | null
  media_mime_type: string | null
  public_media_url: string | null
  public_midia_thumb: string | null
  timestamp_msg: string | null
  status: string | null
}

async function supabaseGet<T>(path: string): Promise<T> {
  const url = `${SUPABASE_REST_URL.replace(/\/$/, "")}/${path}`
  const response = await fetch(url, {
    headers,
    cache: "no-store",
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(error || `Supabase request failed with ${response.status}`)
  }

  return response.json() as Promise<T>
}

interface PaginationOptions {
  limit?: number
  offset?: number
}

interface ChatQueryOptions extends PaginationOptions {
  search?: string
}

function escapePostgrestPattern(value: string) {
  return value.replace(/[%*_]/g, (character) => `\\${character}`)
}

export function fetchChats({ limit = 50, offset = 0, search }: ChatQueryOptions = {}) {
  const select = [
    "id",
    "chat_id",
    "nome_contato",
    "pushname",
    "phone_contact",
    "url_foto_perfil",
    "text_last_message",
    "last_message_time",
    "last_time_formatado",
    "unread_count",
    "pinned",
    "archived",
    "finalizada",
    "ia_responde",
    "Status_chat",
    "hex_status",
    "json_tags",
    "json_tags_parsed",
    "tag_chat_array",
    "dono",
    "setor",
    "grupo",
    "draft",
    "lid_id",
    "updated_at",
  ].join(",")
  const term = search?.trim()
  const searchFilter = term
    ? `&or=(${[
        "nome_contato",
        "pushname",
        "phone_contact",
        "chat_id",
        "text_last_message",
        "Status_chat",
      ]
        .map((field) => `${field}.ilike.*${encodeURIComponent(escapePostgrestPattern(term))}*`)
        .join(",")})`
    : ""

  return supabaseGet<ChatRecord[]>(
    `chats?select=${select}&archived=is.false${searchFilter}&order=last_message_time.desc.nullslast&limit=${limit}&offset=${offset}`,
  )
}

export function fetchMessages(chatId: string, { limit = 50, offset = 0 }: PaginationOptions = {}) {
  const select = [
    "id",
    "message_id",
    "from_me",
    "chat_id",
    "participant",
    "message_type",
    "content",
    "media_url",
    "media_path",
    "media_mime_type",
    "public_media_url",
    "public_midia_thumb",
    "timestamp_msg",
    "status",
  ].join(",")

  return supabaseGet<MessageRecord[]>(
    `messages?select=${select}&chat_id=eq.${encodeURIComponent(chatId)}&order=timestamp_msg.desc.nullslast&limit=${limit}&offset=${offset}`,
  )
}
