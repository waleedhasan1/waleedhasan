import fs from 'fs'
import path from 'path'

export type NeighborhoodData = {
  areaNumber: number
  rent: { avg: number; low: number; high: number } | null
  crime: { total: number; per100k: number | null; year: number } | null
  demographics: { population: number; estimatedMedianIncome: number; households: number } | null
  transit: { ctaStations: number; ctaLines: string[] }
  bus: { busReliability: number | null; busRouteCount: number; busAvgWeekdayRiders: number; busRoutes: string[] }
}

export type AllData = {
  neighborhoods: Record<string, NeighborhoodData>
}

export type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

let cached: AllData | null = null

export function loadNeighborhoods(): AllData {
  if (cached) return cached
  const filePath = path.join(process.cwd(), 'public', 'neighborhood-data.json')
  const raw = fs.readFileSync(filePath, 'utf-8')
  cached = JSON.parse(raw)
  return cached!
}

type ParsedCriteria = {
  rentBudget: number | null
  wantSafe: boolean
  wantTransit: boolean
  transitLines: string[]
  wantBus: boolean
  specificNeighborhoods: string[]
}

const CTA_LINES = ['red', 'blue', 'green', 'brown', 'orange', 'pink', 'purple', 'yellow']

export function parseQuery(query: string): ParsedCriteria {
  const q = query.toLowerCase()

  let rentBudget: number | null = null
  const rentMatchK = q.match(/\$?\s*(\d+)\s*k/)
  if (rentMatchK) rentBudget = parseInt(rentMatchK[1]) * 1000
  if (!rentBudget) {
    const rentMatch = q.match(/\$?\s*(\d{3,5})\s*(?:\/mo|a month|per month|rent|monthly|budget)?/)
    if (rentMatch) rentBudget = parseInt(rentMatch[1])
  }
  if (!rentBudget && /cheap|affordable|budget|low.?rent|inexpensive/.test(q)) rentBudget = 1200

  const wantSafe = /safe|low.?crime|quiet|peaceful|family.?friendly|secure/.test(q)

  const wantTransit = /transit|train|cta|\bl\b|commut|metro|subway/.test(q)
  const transitLines: string[] = []
  for (const line of CTA_LINES) {
    if (q.includes(line + ' line') || q.includes(line + 'line') || new RegExp(`\\b${line}\\s+line\\b`).test(q)) {
      transitLines.push(line.charAt(0).toUpperCase() + line.slice(1))
    }
    if (new RegExp(`(?:on|near|the)\\s+${line}\\b`).test(q)) {
      const capitalized = line.charAt(0).toUpperCase() + line.slice(1)
      if (!transitLines.includes(capitalized)) transitLines.push(capitalized)
    }
  }

  const wantBus = /\bbus\b|reliable bus/.test(q)

  const data = loadNeighborhoods()
  const specificNeighborhoods: string[] = []
  for (const name of Object.keys(data.neighborhoods)) {
    if (q.includes(name.toLowerCase())) {
      specificNeighborhoods.push(name)
    }
  }

  return { rentBudget, wantSafe, wantTransit, transitLines, wantBus, specificNeighborhoods }
}

function passesHardFilters(nd: NeighborhoodData, criteria: ParsedCriteria): boolean {
  if (criteria.rentBudget && nd.rent) {
    if (nd.rent.avg > criteria.rentBudget * 1.1) return false
  }
  if (criteria.transitLines.length > 0) {
    const hasLine = criteria.transitLines.some(line =>
      nd.transit.ctaLines.some(l => l.toLowerCase().includes(line.toLowerCase())),
    )
    if (!hasLine) return false
  }
  return true
}

export type SearchResult = {
  neighborhoods: { name: string; data: NeighborhoodData }[]
  transitLines: string[]
  topPicks: string[]
  specificNeighborhoods: string[]
  rentBudget: number | null
}

export function findRelevantNeighborhoods(query: string): SearchResult {
  const data = loadNeighborhoods()
  const criteria = parseQuery(query)

  if (criteria.specificNeighborhoods.length > 0) {
    const neighborhoods = criteria.specificNeighborhoods.map(name => ({
      name,
      data: data.neighborhoods[name],
    }))
    return {
      neighborhoods,
      transitLines: criteria.transitLines,
      topPicks: neighborhoods.slice(0, 5).map(n => n.name),
      specificNeighborhoods: criteria.specificNeighborhoods,
      rentBudget: criteria.rentBudget,
    }
  }

  const hasCriteria =
    criteria.rentBudget ||
    criteria.wantSafe ||
    criteria.wantTransit ||
    criteria.wantBus ||
    criteria.transitLines.length > 0

  if (!hasCriteria) {
    const all = Object.entries(data.neighborhoods).map(([name, d]) => ({ name, data: d }))
    return {
      neighborhoods: all,
      transitLines: [],
      topPicks: [],
      specificNeighborhoods: [],
      rentBudget: null,
    }
  }

  const passing: { name: string; data: NeighborhoodData; score: number }[] = []

  for (const [name, nd] of Object.entries(data.neighborhoods)) {
    if (!passesHardFilters(nd, criteria)) continue

    let score = 0
    if (criteria.rentBudget && nd.rent) {
      score += Math.max(0, 1 - (criteria.rentBudget - nd.rent.avg) / criteria.rentBudget) * 3
    }
    if (criteria.wantSafe && nd.crime?.per100k != null) {
      const crimePct = nd.crime.per100k / 15000
      score += (1 - crimePct) * 3
    }
    if (criteria.transitLines.length > 0) {
      score += nd.transit.ctaStations * 0.5
    } else if (criteria.wantTransit) {
      score += Math.min(nd.transit.ctaStations, 5) * 0.6
    }
    if (criteria.wantBus && nd.bus.busReliability != null) {
      score += nd.bus.busReliability * 3
    }
    passing.push({ name, data: nd, score })
  }

  passing.sort((a, b) => b.score - a.score)

  const results = passing.slice(0, 20)
  return {
    neighborhoods: results.map(({ name, data: d }) => ({ name, data: d })),
    transitLines: criteria.transitLines,
    topPicks: results.slice(0, 5).map(r => r.name),
    specificNeighborhoods: criteria.specificNeighborhoods,
    rentBudget: criteria.rentBudget,
  }
}
