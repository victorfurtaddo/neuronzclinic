import { NextResponse } from "next/server"

const AIRTABLE_BASE_ID = "app03ti52QQD3W9L2"
const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN || process.env.AIRTABLE_API_KEY
const TABLE_CANDIDATES = [
  process.env.AIRTABLE_SECTORS_TABLE,
  "Setores",
  "Setor",
  "SETOR",
  "setores",
  "setor",
  "Sectors",
  "Sector",
].filter(Boolean) as string[]

function getRecordLabel(fields: Record<string, unknown>) {
  const direct =
    fields.Nome ||
    fields.nome ||
    fields.Name ||
    fields.name ||
    fields.Setor ||
    fields.setor ||
    fields.Titulo ||
    fields.title

  if (typeof direct === "string" && direct.trim()) return direct.trim()

  for (const value of Object.values(fields)) {
    if (typeof value === "string" && value.trim() && !value.startsWith("rec")) {
      return value.trim()
    }
  }

  return null
}

function isExcludedSector(fields: Record<string, unknown>) {
  return typeof fields.Status === "string" && fields.Status.trim().toLowerCase() === "excluído"
}

async function fetchSectorDataFromTable(table: string, ids: string[]) {
  const records = await fetchAllRecords(table)
  const activeRecords = records.filter((record) => !isExcludedSector(record.fields ?? {}))
  const sectors = Array.from(
    new Set(
      activeRecords
        .map((record) => getRecordLabel(record.fields ?? {}))
        .filter((label): label is string => Boolean(label)),
    ),
  ).sort((a, b) => a.localeCompare(b, "pt-BR", { sensitivity: "base" }))

  const labels = Object.fromEntries(
    activeRecords.flatMap((record) => {
      const label = getRecordLabel(record.fields ?? {})
      if (!label) return []

      const sectorIds = [record.id]
      const tagIds = Array.isArray(record.fields?.Tags)
        ? record.fields.Tags.filter((value): value is string => typeof value === "string")
        : []

      return [...sectorIds, ...tagIds]
        .filter((id) => ids.includes(id))
        .map((id) => [id, label])
    }),
  )

  return { labels, sectors }
}

async function fetchAllRecords(table: string) {
  const records: Array<{ id: string; fields?: Record<string, unknown> }> = []
  let offset: string | undefined

  do {
    const params = new URLSearchParams({ pageSize: "100" })
    if (offset) params.set("offset", offset)

    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(table)}?${params}`
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_TOKEN}`,
      },
      cache: "no-store",
    })

    if (response.status === 404) return []

    if (!response.ok) {
      throw new Error(await response.text())
    }

    const data = (await response.json()) as {
      offset?: string
      records?: Array<{ id: string; fields?: Record<string, unknown> }>
    }

    records.push(...(data.records ?? []))
    offset = data.offset
  } while (offset)

  return records
}

export async function GET(request: Request) {
  if (!AIRTABLE_TOKEN) {
    return NextResponse.json(
      { labels: {}, sectors: [], error: "Missing AIRTABLE_TOKEN or AIRTABLE_API_KEY" },
      { status: 200 },
    )
  }

  const { searchParams } = new URL(request.url)
  const ids = getSectorIds(searchParams.get("ids"))

  for (const table of TABLE_CANDIDATES) {
    const data = await fetchSectorDataFromTable(table, ids)

    if (data.sectors.length > 0 || Object.keys(data.labels).length > 0) {
      return NextResponse.json(data)
    }
  }

  return NextResponse.json({ labels: {}, sectors: [] })
}

function getSectorIds(value: string | null) {
  if (!value) return []

  return Array.from(
    new Set(
      value
        .split(",")
        .map((id) => id.trim())
        .filter((id) => /^rec[a-zA-Z0-9]+$/.test(id)),
    ),
  ).slice(0, 100)
}
