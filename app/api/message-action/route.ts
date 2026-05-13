import { NextRequest, NextResponse } from "next/server"

const SEND_MESSAGE_WEBHOOK_URL = process.env.SEND_MESSAGE_WEBHOOK_URL || "https://n8n.srv1150529.hstgr.cloud/webhook/send-message"
const MESSAGE_ACTION_WEBHOOK_URL = process.env.MESSAGE_ACTION_WEBHOOK_URL || SEND_MESSAGE_WEBHOOK_URL
const DELETE_MESSAGE_WEBHOOK_URL = process.env.DELETE_MESSAGE_WEBHOOK_URL || "https://n8n.srv1150529.hstgr.cloud/webhook/apagar-mensagem"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const action = String(body.action || "").trim()

    if (action !== "forward" && action !== "delete") {
      return NextResponse.json({ message: "Acao de mensagem invalida." }, { status: 400 })
    }

    const payload =
      action === "forward"
        ? {
            action,
            type: "forward",
            target_chat_id: String(body.target_chat_id || "").trim(),
            chat_id: String(body.target_chat_id || "").trim(),
            message_id: String(body.message_id || "").trim(),
            message_type: String(body.message_type || "text").trim(),
            content: String(body.content || ""),
            media_url: body.media_url || null,
            media_mime_type: body.media_mime_type || null,
          }
        : {
            remoteJid: String(body.chat_id || body.remoteJid || "").trim(),
            messageId: String(body.message_id || body.messageId || "").trim(),
            fromMe: Boolean(body.from_me ?? body.fromMe),
          }

    if (action === "forward" && (!payload.chat_id || !payload.message_id)) {
      return NextResponse.json({ message: "chat_id e message_id sao obrigatorios." }, { status: 400 })
    }

    if (action === "delete" && (!payload.remoteJid || !payload.messageId)) {
      return NextResponse.json({ message: "remoteJid e messageId sao obrigatorios." }, { status: 400 })
    }

    const webhookUrl = action === "delete" ? DELETE_MESSAGE_WEBHOOK_URL : MESSAGE_ACTION_WEBHOOK_URL
    const webhookResponse = await fetch(webhookUrl, {
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
          message: "Webhook recusou a acao da mensagem.",
          details: webhookBody,
        },
        { status: webhookResponse.status },
      )
    }

    return NextResponse.json({ ok: true, payload, webhook: webhookBody })
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Nao foi possivel executar a acao da mensagem.",
      },
      { status: 500 },
    )
  }
}
