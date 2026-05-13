import { NextRequest, NextResponse } from "next/server"

const WEBHOOK_URL = process.env.SEND_MESSAGE_WEBHOOK_URL || "https://n8n.srv1150529.hstgr.cloud/webhook/send-message"
const SUPABASE_REST_URL = process.env.NEXT_PUBLIC_SUPABASE_REST_URL
const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
const STORAGE_BUCKET = process.env.SEND_MESSAGE_STORAGE_BUCKET || "file"

const mediaTypeByMime = [
  { prefix: "audio/", type: "audio" },
  { prefix: "image/", type: "image" },
  { prefix: "video/", type: "video" },
] as const

function getSupabaseBaseUrl() {
  return SUPABASE_REST_URL?.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "")
}

function getMediaType(file: File) {
  const mimeType = file.type.toLowerCase()
  return mediaTypeByMime.find(({ prefix }) => mimeType.startsWith(prefix))?.type || "document"
}

function sanitizeFileName(fileName: string) {
  return fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120) || "file"
}

function getPublicStorageUrl(baseUrl: string, objectPath: string) {
  const encodedPath = objectPath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/")

  return `${baseUrl}/storage/v1/object/public/${STORAGE_BUCKET}/${encodedPath}`
}

async function uploadFile(file: File, chatId: string) {
  const baseUrl = getSupabaseBaseUrl()

  if (!baseUrl || !SUPABASE_PUBLISHABLE_KEY) {
    throw new Error("Configuracao do Supabase ausente para upload de anexos.")
  }

  const safeChatId = chatId.replace(/[^a-zA-Z0-9@._-]/g, "-")
  const objectPath = `sent/${safeChatId}/${Date.now()}-${crypto.randomUUID()}-${sanitizeFileName(file.name)}`
  const uploadUrl = `${baseUrl}/storage/v1/object/${STORAGE_BUCKET}/${objectPath}`
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
      "Content-Type": file.type || "application/octet-stream",
      "x-upsert": "false",
    },
    body: file,
  })

  if (!response.ok) {
    const details = await response.text()
    throw new Error(details || `Falha no upload do anexo (${response.status}).`)
  }

  return {
    mediaUrl: getPublicStorageUrl(baseUrl, objectPath),
    mediaType: getMediaType(file),
    fileName: file.name || "file",
    mimeType: file.type || "application/octet-stream",
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const chatId = String(formData.get("chat_id") || "").trim()
    const text = String(formData.get("text") || "").trim()
    const replyToMessageId = String(formData.get("reply_to_message_id") || "").trim()
    const replyToContent = String(formData.get("reply_to_content") || "").trim()
    const replyToType = String(formData.get("reply_to_type") || "").trim()
    const replyToFromMe = String(formData.get("reply_to_from_me") || "").trim()
    const file = formData.get("file")
    const attachment = file instanceof File && file.size > 0 ? file : null

    if (!chatId) {
      return NextResponse.json({ message: "chat_id e obrigatorio." }, { status: 400 })
    }

    if (!text && !attachment) {
      return NextResponse.json({ message: "Informe uma mensagem ou anexo para enviar." }, { status: 400 })
    }

    const uploaded = attachment ? await uploadFile(attachment, chatId) : null
    const replyPayload = replyToMessageId
      ? {
          reply_to: {
            message_id: replyToMessageId,
            content: replyToContent,
            type: replyToType,
            from_me: replyToFromMe === "true",
          },
        }
      : {}

    const payload = uploaded
      ? {
          type: uploaded.mediaType,
          chat_id: chatId,
          caption: text,
          filename: uploaded.fileName,
          media_url: uploaded.mediaUrl,
          media_mime_type: uploaded.mimeType,
          ...replyPayload,
        }
      : {
          type: "text",
          chat_id: chatId,
          text,
          content: text,
          ...replyPayload,
        }

    const webhookResponse = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    const webhookText = await webhookResponse.text()
    const webhookBody = webhookText
      ? (() => {
          try {
            return JSON.parse(webhookText)
          } catch {
            return webhookText
          }
        })()
      : null

    if (!webhookResponse.ok) {
      return NextResponse.json(
        {
          message: "Webhook recusou o envio da mensagem.",
          details: webhookBody,
        },
        { status: webhookResponse.status },
      )
    }

    return NextResponse.json({ ok: true, payload, webhook: webhookBody })
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Nao foi possivel enviar a mensagem.",
      },
      { status: 500 },
    )
  }
}
