import { Check, CheckCheck, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

type MessageStatusIconProps = {
  fromMe?: boolean | null
  status?: string | null
  timestamp?: string | null
  className?: string
}

const LEGACY_READ_CUTOFF_TIME = Date.parse("2026-05-12T19:30:00-03:00")

function getNormalizedStatus(status?: string | null) {
  return status?.trim().toLowerCase() ?? ""
}

function getEffectiveStatus(status?: string | null, timestamp?: string | null) {
  if (!timestamp) return status

  const messageTime = Date.parse(timestamp)

  if (Number.isFinite(messageTime) && messageTime < LEGACY_READ_CUTOFF_TIME) {
    return "read"
  }

  return status
}

export function MessageStatusIcon({ fromMe, status, timestamp, className }: MessageStatusIconProps) {
  if (!fromMe) return null

  const normalizedStatus = getNormalizedStatus(getEffectiveStatus(status, timestamp))

  if (normalizedStatus.includes("pending") || normalizedStatus.includes("sending")) {
    return <Clock className={cn("h-3.5 w-3.5 shrink-0 text-muted-foreground", className)} aria-label="Enviando" />
  }

  if (
    normalizedStatus.includes("read") ||
    normalizedStatus.includes("played") ||
    normalizedStatus.includes("view") ||
    normalizedStatus.includes("visualiz")
  ) {
    return <CheckCheck className={cn("h-3.5 w-3.5 shrink-0 text-blue-500", className)} aria-label="Visualizada" />
  }

  if (normalizedStatus.includes("deliver")) {
    return <CheckCheck className={cn("h-3.5 w-3.5 shrink-0 text-muted-foreground", className)} aria-label="Entregue" />
  }

  if (
    normalizedStatus.includes("sent") ||
    normalizedStatus.includes("server") ||
    normalizedStatus.includes("ack")
  ) {
    return <Check className={cn("h-3.5 w-3.5 shrink-0 text-muted-foreground", className)} aria-label="Enviada" />
  }

  return <CheckCheck className={cn("h-3.5 w-3.5 shrink-0 text-muted-foreground", className)} aria-label="Enviada" />
}
