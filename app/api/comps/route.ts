import { NextRequest, NextResponse } from 'next/server'

const PLUTO_URL = 'https://data.cityofnewyork.us/resource/64uk-42ks.json'
const MAP_PLUTO_URL = 'https://data.cityofnewyork.us/resource/f888-ni5f.json'
const SALES_URL = 'https://data.cityofnewyork.us/resource/usep-8jbt.json'

interface PlutoRecord {
  bbl: string
  address: string
  borough: string
  block: string
  lot: string
  bldgclass: string
  landuse: string
  lotarea: string
  bldgarea: string
  numbldgs: string
  numfloors: string
  unitsres: string
  unitstotal: string
  yearbuilt: string
  assesstot: string
  zonedist1: string
  latitude: string
  longitude: string
  cd: string
  zipcode: string
}

interface SaleRecord {
  bbl?: string
  borough?: string
  block?: string
  lot?: string
  sale_price: string
  sale_date: string
  gross_square_feet?: string
  building_class_at_time_of_sale?: string
  building_class_at_time_of?: string
  address?: string
}

function makeBbl(borough: string, block: string, lot: string): string {
  return borough + block.padStart(5, '0') + lot.padStart(4, '0')
}

function boroughName(code: string): string {
  const map: Record<string, string> = {
    '1': 'Manhattan', '2': 'Bronx', '3': 'Brooklyn',
    '4': 'Queens', '5': 'Staten Island'
  }
  return map[code] || code
}

function scoreComp(
  subject: PlutoRecord,
  comp: PlutoRecord,
  distMeters: number
): number {
  // Building class match (0.25)
  let classScore = 0
  if (subject.bldgclass && comp.bldgclass) {
    if (subject.bldgclass === comp.bldgclass) classScore = 1.0
    else if (subject.bldgclass[0] === comp.bldgclass[0]) classScore = 0.5
  }

  // Building area similarity (0.30)
  let areaScore = 0
  const sArea = parseFloat(subject.bldgarea) || 0
  const cArea = parseFloat(comp.bldgarea) || 0
  if (sArea > 0 && cArea > 0) {
    const ratio = Math.min(sArea, cArea) / Math.max(sArea, cArea)
    areaScore = Math.max(0, (ratio - 0.5) / 0.5)
  }

  // Year built proximity (0.20)
  let yearScore = 0
  const sYear = parseInt(subject.yearbuilt) || 0
  const cYear = parseInt(comp.yearbuilt) || 0
  if (sYear > 1800 && cYear > 1800) {
    const diff = Math.abs(sYear - cYear)
    if (diff <= 5) yearScore = 1.0
    else if (diff >= 30) yearScore = 0
    else yearScore = 1.0 - (diff - 5) / 25
  }

  // Geographic distance (0.25)
  let distScore = 0
  if (distMeters <= 200) distScore = 1.0
  else if (distMeters >= 1000) distScore = 0
  else distScore = 1.0 - (distMeters - 200) / 800

  return Math.round(
    (classScore * 0.25 + areaScore * 0.30 + yearScore * 0.20 + distScore * 0.25) * 100
  )
}

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

async function browseProperties(min: number, max: number, borough: string) {
  // Build price filter
  let where = `sale_price >= '${min}' AND sale_price <= '${max}' AND sale_price > '10000'`

  // Filter to residential building classes (A, B, C, D, R) — column is truncated in this dataset
  where += ` AND (building_class_at_time_of like 'A%' OR building_class_at_time_of like 'B%' OR building_class_at_time_of like 'C%' OR building_class_at_time_of like 'D%' OR building_class_at_time_of like 'R%')`

  // Borough filter — this dataset has a separate borough column (1-5)
  if (borough && borough !== '0') {
    where += ` AND borough='${borough}'`
  }

  const salesUrl = `${SALES_URL}?$where=${encodeURIComponent(where)}&$order=sale_date DESC&$limit=200`
  const salesRes = await fetch(salesUrl)
  if (!salesRes.ok) throw new Error(`Sales query failed: ${salesRes.status}`)
  const sales: SaleRecord[] = await salesRes.json()

  if (sales.length === 0) return []

  // Construct BBL from borough+block+lot and collect unique entries
  const bblMap = new Map<string, SaleRecord>()
  for (const s of sales) {
    if (!s.borough || !s.block || !s.lot) continue
    const bbl = makeBbl(s.borough, s.block, s.lot)
    s.bbl = bbl
    if (!bblMap.has(bbl)) bblMap.set(bbl, s)
  }
  const uniqueBbls = Array.from(bblMap.keys())

  // Batch-query PLUTO for coordinates + details (chunks of 20)
  const plutoMap = new Map<string, PlutoRecord>()
  for (let i = 0; i < uniqueBbls.length; i += 20) {
    const chunk = uniqueBbls.slice(i, i + 20)
    const bblFilter = chunk.map(b => `bbl='${b}'`).join(' OR ')
    const plutoUrl = `${PLUTO_URL}?$where=${encodeURIComponent(bblFilter)}&$limit=50&$select=bbl,address,borough,block,lot,bldgclass,lotarea,bldgarea,numfloors,unitsres,unitstotal,yearbuilt,assesstot,zonedist1,latitude,longitude,zipcode`
    try {
      const res = await fetch(plutoUrl)
      if (res.ok) {
        const data: PlutoRecord[] = await res.json()
        for (const r of data) {
          if (r.latitude && r.longitude) {
            // Normalize BBL — PLUTO stores as "3067640061.00000000"
            const normBbl = String(Math.round(parseFloat(r.bbl)))
            plutoMap.set(normBbl, r)
          }
        }
      }
    } catch { /* skip chunk on error */ }
  }

  // Merge sales + PLUTO data
  const results = []
  for (const [bbl, sale] of bblMap) {
    const pluto = plutoMap.get(bbl)
    if (!pluto) continue // skip if no coordinates
    results.push({
      bbl,
      address: pluto.address,
      borough: boroughName(bbl[0] || ''),
      bldgclass: pluto.bldgclass,
      lotarea: pluto.lotarea,
      bldgarea: pluto.bldgarea,
      numfloors: pluto.numfloors,
      unitsres: pluto.unitsres,
      unitstotal: pluto.unitstotal,
      yearbuilt: pluto.yearbuilt,
      assesstot: pluto.assesstot,
      zonedist1: pluto.zonedist1,
      latitude: pluto.latitude,
      longitude: pluto.longitude,
      zipcode: pluto.zipcode,
      salePrice: sale.sale_price,
      saleDate: sale.sale_date,
    })
  }

  return results
}

async function searchProperties(query: string) {
  const q = query.toUpperCase().trim()
  const url = `${PLUTO_URL}?$where=upper(address) like '%25${encodeURIComponent(q)}%25'&$limit=10&$select=bbl,address,borough,block,lot,bldgclass,lotarea,bldgarea,numfloors,unitsres,unitstotal,yearbuilt,assesstot,zonedist1,latitude,longitude,zipcode`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`PLUTO search failed: ${res.status}`)
  const data: PlutoRecord[] = await res.json()
  return data.map(r => ({
    bbl: r.bbl,
    address: r.address,
    borough: boroughName(r.bbl?.[0] || ''),
    bldgclass: r.bldgclass,
    lotarea: r.lotarea,
    bldgarea: r.bldgarea,
    numfloors: r.numfloors,
    unitsres: r.unitsres,
    unitstotal: r.unitstotal,
    yearbuilt: r.yearbuilt,
    assesstot: r.assesstot,
    zonedist1: r.zonedist1,
    latitude: r.latitude,
    longitude: r.longitude,
    zipcode: r.zipcode,
  }))
}

async function findComps(bbl: string) {
  // 1. Fetch subject property
  const subjectUrl = `${PLUTO_URL}?bbl=${bbl}&$limit=1`
  const subRes = await fetch(subjectUrl)
  if (!subRes.ok) throw new Error(`Subject fetch failed: ${subRes.status}`)
  const subData: PlutoRecord[] = await subRes.json()
  if (subData.length === 0) throw new Error('Property not found')
  const subject = subData[0]

  const lat = parseFloat(subject.latitude)
  const lng = parseFloat(subject.longitude)
  if (!lat || !lng) throw new Error('No coordinates for this property')

  // 2. Query MapPLUTO within radius, same building class
  let radius = 1000
  let classFilter = subject.bldgclass
    ? `AND bldgclass='${subject.bldgclass}'`
    : ''

  let compsUrl = `${MAP_PLUTO_URL}?$where=within_circle(the_geom,${lat},${lng},${radius}) ${classFilter} AND bbl!='${bbl}'&$limit=50&$select=bbl,address,borough,block,lot,bldgclass,lotarea,bldgarea,numfloors,unitsres,unitstotal,yearbuilt,assesstot,zonedist1,latitude,longitude,zipcode`
  let compsRes = await fetch(compsUrl)
  let compsData: PlutoRecord[] = compsRes.ok ? await compsRes.json() : []

  // If <5 results, widen search
  if (compsData.length < 5) {
    radius = 2000
    classFilter = subject.bldgclass
      ? `AND upper(bldgclass) like '${subject.bldgclass[0]}%25'`
      : ''
    compsUrl = `${MAP_PLUTO_URL}?$where=within_circle(the_geom,${lat},${lng},${radius}) ${classFilter} AND bbl!='${bbl}'&$limit=50&$select=bbl,address,borough,block,lot,bldgclass,lotarea,bldgarea,numfloors,unitsres,unitstotal,yearbuilt,assesstot,zonedist1,latitude,longitude,zipcode`
    compsRes = await fetch(compsUrl)
    compsData = compsRes.ok ? await compsRes.json() : []
  }

  // 3. Batch-query sales for all candidate BBLs
  // The sales dataset has borough/block/lot separately, not a bbl column
  const allBbls = [bbl, ...compsData.map(c => c.bbl)].filter(Boolean)
  const salesMap: Record<string, { price: string; date: string }> = {}
  // Query in chunks of 10 (each BBL becomes a 3-part AND clause)
  for (let i = 0; i < allBbls.length; i += 10) {
    const chunk = allBbls.slice(i, i + 10)
    const bblFilter = chunk.map(b => {
      const boro = b[0]
      const block = String(parseInt(b.substring(1, 6)))
      const lot = String(parseInt(b.substring(6, 10)))
      return `(borough='${boro}' AND block='${block}' AND lot='${lot}')`
    }).join(' OR ')
    const salesUrl = `${SALES_URL}?$where=(${encodeURIComponent(bblFilter)}) AND sale_price > '0'&$order=sale_date DESC&$limit=100`
    try {
      const salesRes = await fetch(salesUrl)
      if (salesRes.ok) {
        const salesData: SaleRecord[] = await salesRes.json()
        for (const s of salesData) {
          if (!s.borough || !s.block || !s.lot) continue
          const sBbl = makeBbl(s.borough, s.block, s.lot)
          if (!salesMap[sBbl]) {
            salesMap[sBbl] = { price: s.sale_price, date: s.sale_date }
          }
        }
      }
    } catch { /* sales are optional */ }
  }

  // 4. Score and sort
  const scored = compsData
    .filter(c => c.latitude && c.longitude)
    .map(c => {
      const dist = haversineMeters(lat, lng, parseFloat(c.latitude), parseFloat(c.longitude))
      const score = scoreComp(subject, c, dist)
      const sale = salesMap[c.bbl]
      return {
        bbl: c.bbl,
        address: c.address,
        borough: boroughName(c.bbl?.[0] || ''),
        bldgclass: c.bldgclass,
        lotarea: c.lotarea,
        bldgarea: c.bldgarea,
        numfloors: c.numfloors,
        unitsres: c.unitsres,
        unitstotal: c.unitstotal,
        yearbuilt: c.yearbuilt,
        assesstot: c.assesstot,
        zonedist1: c.zonedist1,
        latitude: c.latitude,
        longitude: c.longitude,
        zipcode: c.zipcode,
        distance: Math.round(dist),
        score,
        salePrice: sale?.price || null,
        saleDate: sale?.date || null,
      }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 15)

  const subjectSale = salesMap[bbl]
  return {
    subject: {
      bbl: subject.bbl,
      address: subject.address,
      borough: boroughName(subject.bbl?.[0] || ''),
      bldgclass: subject.bldgclass,
      lotarea: subject.lotarea,
      bldgarea: subject.bldgarea,
      numfloors: subject.numfloors,
      unitsres: subject.unitsres,
      unitstotal: subject.unitstotal,
      yearbuilt: subject.yearbuilt,
      assesstot: subject.assesstot,
      zonedist1: subject.zonedist1,
      latitude: subject.latitude,
      longitude: subject.longitude,
      zipcode: subject.zipcode,
      salePrice: subjectSale?.price || null,
      saleDate: subjectSale?.date || null,
    },
    comps: scored,
    radius,
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  try {
    if (action === 'browse') {
      const min = parseInt(searchParams.get('min') || '200000')
      const max = parseInt(searchParams.get('max') || '600000')
      const borough = searchParams.get('borough') || '0'
      if (isNaN(min) || isNaN(max) || min < 0 || max < min) {
        return NextResponse.json({ error: 'Invalid price range' }, { status: 400 })
      }
      const results = await browseProperties(min, max, borough)
      return NextResponse.json({ results })
    }

    if (action === 'search') {
      const q = searchParams.get('q')
      if (!q || q.length < 2) {
        return NextResponse.json({ results: [] })
      }
      const results = await searchProperties(q)
      return NextResponse.json({ results })
    }

    if (action === 'comps') {
      const bbl = searchParams.get('bbl')
      if (!bbl) {
        return NextResponse.json({ error: 'bbl parameter required' }, { status: 400 })
      }
      const data = await findComps(bbl)
      return NextResponse.json(data)
    }

    return NextResponse.json({ error: 'Invalid action. Use browse, search, or comps.' }, { status: 400 })
  } catch (error) {
    console.error('Comps API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    )
  }
}
