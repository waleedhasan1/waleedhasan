'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import routeData from '../ghost-bus-data.json'
import ridershipRaw from '../ghost-bus-ridership.json'

interface RouteFeature {
  type: 'Feature'
  geometry: { type: 'LineString'; coordinates: [number, number][] }
  properties: {
    route_id: string
    day_type: string
    ratio: number
    ratio_percentiles: number
    ratio_ranking: number
    shape_id: string
    direction: string
    trip_id: number
    route_short_name: string
    route_long_name: string
    route_type: string
    route_url: string
    route_color: string
    route_text_color: string
  }
}

interface RidershipEntry {
  route_id: string
  day_type: string
  avg_riders: number
  total_riders: number
}

const geojson = routeData as unknown as { type: 'FeatureCollection'; features: RouteFeature[] }
const ridershipData: RidershipEntry[] = (ridershipRaw as { data: RidershipEntry[] }).data

// Build ridership lookup: route_id -> { weekday, sat, sun }
const ridershipMap: Record<string, Record<string, number>> = {}
ridershipData.forEach(r => {
  if (!ridershipMap[r.route_id]) ridershipMap[r.route_id] = {}
  ridershipMap[r.route_id][r.day_type] = Math.round(r.avg_riders)
})

type Tier = 'all' | 'good' | 'fair' | 'poor'
type SortMode = 'rank' | 'route' | 'name'

function getTier(ratio: number): 'good' | 'fair' | 'poor' {
  if (ratio >= 0.95) return 'good'
  if (ratio >= 0.91) return 'fair'
  return 'poor'
}

const TIER_COLORS = { good: '#22C55E', fair: '#F59E0B', poor: '#EF4444' }
const TIER_LABELS = { good: 'Good', fair: 'Fair', poor: 'Poor' }
const ACCENT = '#6B21A8'

function ratioColor(ratio: number): string {
  // red 0.84 -> orange 0.89 -> yellow 0.92 -> yellow-green 0.95 -> green 0.98
  const t = Math.max(0, Math.min(1, (ratio - 0.84) / (0.98 - 0.84)))
  if (t < 0.25) {
    const s = t / 0.25
    return lerpColor('#EF4444', '#F97316', s)
  } else if (t < 0.5) {
    const s = (t - 0.25) / 0.25
    return lerpColor('#F97316', '#EAB308', s)
  } else if (t < 0.75) {
    const s = (t - 0.5) / 0.25
    return lerpColor('#EAB308', '#84CC16', s)
  } else {
    const s = (t - 0.75) / 0.25
    return lerpColor('#84CC16', '#22C55E', s)
  }
}

function lerpColor(a: string, b: string, t: number): string {
  const parse = (c: string) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]
  const [r1, g1, b1] = parse(a)
  const [r2, g2, b2] = parse(b)
  const r = Math.round(r1 + (r2 - r1) * t)
  const g = Math.round(g1 + (g2 - g1) * t)
  const bl = Math.round(b1 + (b2 - b1) * t)
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${bl.toString(16).padStart(2, '0')}`
}

interface EnrichedFeature {
  type: 'Feature'
  id: number
  geometry: { type: 'LineString'; coordinates: [number, number][] }
  properties: RouteFeature['properties'] & { _fid: number }
}

interface BusStop {
  stpid: string
  stpnm: string
  lat: number
  lon: number
}

interface BusPrediction {
  stpnm: string
  des: string
  prdtm: string
  tmstmp: string
  rtdir: string
  prdctdn: string
  vid: string
}

// Assign a unique numeric id to each feature for filtering
const features: EnrichedFeature[] = geojson.features.map((f, i) => ({ ...f, id: i, properties: { ...f.properties, _fid: i } }))

export default function GhostBusMapInline() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const popupRef = useRef<maplibregl.Popup | null>(null)

  const [selectedRoute, setSelectedRoute] = useState<EnrichedFeature | null>(null)
  const [tierFilter, setTierFilter] = useState<Tier>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortMode, setSortMode] = useState<SortMode>('rank')
  const [view, setView] = useState<'list' | 'detail'>('list')

  // Bus stop state
  const [busStops, setBusStops] = useState<BusStop[]>([])
  const [selectedStop, setSelectedStop] = useState<BusStop | null>(null)
  const [predictions, setPredictions] = useState<BusPrediction[]>([])
  const [predsLoading, setPredsLoading] = useState(false)
  const [predsError, setPredsError] = useState('')

  const filteredFeatures = useMemo(() => {
    let f = features
    if (tierFilter !== 'all') {
      f = f.filter(ft => getTier(ft.properties.ratio) === tierFilter)
    }
    return f
  }, [tierFilter])

  const panelFeatures = useMemo(() => {
    let f = filteredFeatures
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      f = f.filter(ft =>
        ft.properties.route_short_name.toLowerCase().includes(q) ||
        ft.properties.route_long_name.toLowerCase().includes(q)
      )
    }
    const sorted = [...f]
    if (sortMode === 'rank') sorted.sort((a, b) => a.properties.ratio_ranking - b.properties.ratio_ranking)
    else if (sortMode === 'route') sorted.sort((a, b) => {
      const na = parseInt(a.properties.route_short_name) || 9999
      const nb = parseInt(b.properties.route_short_name) || 9999
      return na - nb || a.properties.direction.localeCompare(b.properties.direction)
    })
    else sorted.sort((a, b) => a.properties.route_long_name.localeCompare(b.properties.route_long_name))
    return sorted
  }, [filteredFeatures, searchQuery, sortMode])

  // Stats
  const stats = useMemo(() => {
    const ratios = features.map(f => f.properties.ratio)
    const min = Math.min(...ratios)
    const max = Math.max(...ratios)
    const avg = ratios.reduce((a, b) => a + b, 0) / ratios.length
    const worst = features.find(f => f.properties.ratio === min)!
    const best = features.find(f => f.properties.ratio === max)!
    return { min, max, avg, worst, best }
  }, [])

  // Other direction for detail view
  const otherDirection = useMemo(() => {
    if (!selectedRoute) return null
    return features.find(f =>
      f.properties.route_id === selectedRoute.properties.route_id &&
      f.properties.direction !== selectedRoute.properties.direction
    ) || null
  }, [selectedRoute])

  // Init map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return
    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      center: [-87.6298, 41.8781],
      zoom: 11,
    })
    map.addControl(new maplibregl.NavigationControl(), 'top-left')

    map.on('load', () => {
      // Neighborhood boundaries
      fetch('/boundaries_communities.geojson')
        .then(r => r.json())
        .then(data => {
          if (!map.getSource('neighborhoods')) {
            map.addSource('neighborhoods', { type: 'geojson', data })
            map.addLayer({
              id: 'neighborhood-borders',
              type: 'line',
              source: 'neighborhoods',
              paint: { 'line-color': '#999', 'line-width': 0.8, 'line-opacity': 0.4 }
            })
          }
        })
        .catch(() => {})

      // Ghost bus routes source
      map.addSource('ghost-routes', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features },
      })

      // Main route lines
      map.addLayer({
        id: 'ghost-routes-layer',
        type: 'line',
        source: 'ghost-routes',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': [
            'interpolate', ['linear'], ['get', 'ratio'],
            0.84, '#EF4444',
            0.89, '#F97316',
            0.92, '#EAB308',
            0.95, '#84CC16',
            0.98, '#22C55E',
          ],
          'line-width': 3,
          'line-opacity': 0.85,
        }
      })

      // Highlight layer for selected route
      map.addLayer({
        id: 'ghost-routes-highlight',
        type: 'line',
        source: 'ghost-routes',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': '#FFD700',
          'line-width': 6,
          'line-opacity': 0.9,
        },
        filter: ['==', '_fid', -1],
      })

      // Invisible hit target layer
      map.addLayer({
        id: 'ghost-routes-hit',
        type: 'line',
        source: 'ghost-routes',
        paint: {
          'line-color': 'transparent',
          'line-width': 12,
          'line-opacity': 0,
        }
      })

      // Bus stops source (initially empty)
      map.addSource('bus-stops', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      })

      // Bus stop circles
      map.addLayer({
        id: 'bus-stops-layer',
        type: 'circle',
        source: 'bus-stops',
        paint: {
          'circle-radius': ['case', ['get', 'terminal'], 7, 5],
          'circle-color': ['case', ['get', 'terminal'], '#000080', ACCENT],
          'circle-stroke-color': '#FFF',
          'circle-stroke-width': 1.5,
          'circle-opacity': 0.9,
        },
      })

      // Terminal stop labels
      map.addLayer({
        id: 'bus-stops-labels',
        type: 'symbol',
        source: 'bus-stops',
        filter: ['==', 'terminal', true],
        layout: {
          'text-field': ['get', 'stpnm'],
          'text-size': 11,
          'text-offset': [0, 1.4],
          'text-anchor': 'top',
          'text-max-width': 12,
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
        },
        paint: {
          'text-color': '#000080',
          'text-halo-color': '#FFF',
          'text-halo-width': 1.5,
        },
      })

      // Selected stop highlight
      map.addLayer({
        id: 'bus-stops-highlight',
        type: 'circle',
        source: 'bus-stops',
        paint: {
          'circle-radius': 8,
          'circle-color': '#FFD700',
          'circle-stroke-color': ACCENT,
          'circle-stroke-width': 2,
        },
        filter: ['==', 'stpid', ''],
      })

      // Hover tooltip
      const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 10 })
      popupRef.current = popup

      map.on('mousemove', 'ghost-routes-hit', (e) => {
        if (!e.features || e.features.length === 0) return
        map.getCanvas().style.cursor = 'pointer'
        const props = e.features[0].properties!
        const pct = (props.ratio * 100).toFixed(1)
        popup
          .setLngLat(e.lngLat)
          .setHTML(`<div style="font-family:MS Sans Serif,Arial,sans-serif;font-size:11px;padding:2px 4px"><b>${props.route_short_name} ${props.route_long_name}</b><br/>${props.direction} — ${pct}% reliable</div>`)
          .addTo(map)
      })

      map.on('mouseleave', 'ghost-routes-hit', () => {
        map.getCanvas().style.cursor = ''
        popup.remove()
      })

      // Stop hover tooltip
      map.on('mousemove', 'bus-stops-layer', (e) => {
        if (!e.features || e.features.length === 0) return
        map.getCanvas().style.cursor = 'pointer'
        const props = e.features[0].properties!
        popup
          .setLngLat(e.lngLat)
          .setHTML(`<div style="font-family:MS Sans Serif,Arial,sans-serif;font-size:11px;padding:2px 4px"><b>${props.stpnm}</b><br/>Click for predictions</div>`)
          .addTo(map)
      })

      map.on('mouseleave', 'bus-stops-layer', () => {
        map.getCanvas().style.cursor = ''
        popup.remove()
      })

      // Click handler for routes
      map.on('click', 'ghost-routes-hit', (e) => {
        if (!e.features || e.features.length === 0) return
        const fid = e.features[0].properties!._fid
        const route = features.find(f => f.properties._fid === fid)
        if (route) {
          selectRoute(route, map)
        }
      })

      // Click handler for stops
      map.on('click', 'bus-stops-layer', (e) => {
        if (!e.features || e.features.length === 0) return
        e.preventDefault()
        const props = e.features[0].properties!
        const stop: BusStop = {
          stpid: props.stpid,
          stpnm: props.stpnm,
          lat: props.lat,
          lon: props.lon,
        }
        handleStopClick(stop)
      })
    })

    mapRef.current = map
    return () => { map.remove(); mapRef.current = null }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fetch stops when route is selected
  useEffect(() => {
    if (!selectedRoute) {
      setBusStops([])
      setSelectedStop(null)
      setPredictions([])
      // Clear stops from map
      const map = mapRef.current
      if (map && map.getSource('bus-stops')) {
        (map.getSource('bus-stops') as maplibregl.GeoJSONSource).setData({
          type: 'FeatureCollection', features: [],
        })
      }
      return
    }

    const p = selectedRoute.properties
    const ctaDir = p.direction.endsWith('bound') ? p.direction : p.direction + 'bound'
    fetch(`/api/cta-bus?action=stops&rt=${p.route_short_name}&dir=${encodeURIComponent(ctaDir)}`)
      .then(r => r.json())
      .then(data => {
        const rawStops: BusStop[] = data?.['bustime-response']?.stops || []

        // Sort stops geographically along the route direction
        const dir = p.direction.toLowerCase()
        const sorted = [...rawStops]
        if (dir === 'north' || dir === 'south') {
          sorted.sort((a, b) => dir === 'north' ? a.lat - b.lat : b.lat - a.lat)
        } else {
          sorted.sort((a, b) => dir === 'east' ? a.lon - b.lon : b.lon - a.lon)
        }

        setBusStops(sorted)

        // Identify terminal stop IDs
        const firstId = sorted.length > 0 ? sorted[0].stpid : ''
        const lastId = sorted.length > 0 ? sorted[sorted.length - 1].stpid : ''

        // Add stops to map with terminal flag
        const map = mapRef.current
        if (map && map.getSource('bus-stops')) {
          const stopFeatures = sorted.map(s => ({
            type: 'Feature' as const,
            geometry: { type: 'Point' as const, coordinates: [s.lon, s.lat] },
            properties: {
              stpid: s.stpid, stpnm: s.stpnm, lat: s.lat, lon: s.lon,
              terminal: s.stpid === firstId || s.stpid === lastId,
            },
          }))
          ;(map.getSource('bus-stops') as maplibregl.GeoJSONSource).setData({
            type: 'FeatureCollection',
            features: stopFeatures,
          })
        }
      })
      .catch(() => setBusStops([]))
  }, [selectedRoute])

  const handleStopClick = useCallback((stop: BusStop) => {
    setSelectedStop(stop)
    setPredsLoading(true)
    setPredsError('')
    setPredictions([])

    // Highlight on map
    const map = mapRef.current
    if (map && map.getLayer('bus-stops-highlight')) {
      map.setFilter('bus-stops-highlight', ['==', 'stpid', stop.stpid])
    }

    const rt = selectedRoute?.properties.route_short_name || ''
    fetch(`/api/cta-bus?action=predictions&stpid=${stop.stpid}&rt=${rt}`)
      .then(r => r.json())
      .then(data => {
        const prd = data?.['bustime-response']?.prd
        if (Array.isArray(prd) && prd.length > 0) {
          setPredictions(prd)
        } else {
          const errMsg = data?.['bustime-response']?.error?.[0]?.msg
          setPredsError(errMsg || 'No upcoming buses at this stop')
        }
      })
      .catch(() => setPredsError('Failed to load predictions'))
      .finally(() => setPredsLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRoute])

  const clearStop = useCallback(() => {
    setSelectedStop(null)
    setPredictions([])
    setPredsError('')
    const map = mapRef.current
    if (map && map.getLayer('bus-stops-highlight')) {
      map.setFilter('bus-stops-highlight', ['==', 'stpid', ''])
    }
  }, [])

  const selectRoute = useCallback((route: EnrichedFeature, map?: maplibregl.Map) => {
    const m = map || mapRef.current
    setSelectedRoute(route)
    setSelectedStop(null)
    setPredictions([])
    setPredsError('')
    setView('detail')

    if (m) {
      // Highlight
      if (m.getLayer('ghost-routes-highlight')) {
        m.setFilter('ghost-routes-highlight', ['==', '_fid', route.properties._fid])
      }
      // Clear stop highlight
      if (m.getLayer('bus-stops-highlight')) {
        m.setFilter('bus-stops-highlight', ['==', 'stpid', ''])
      }

      // Fit bounds
      const coords = route.geometry.coordinates
      const bounds = coords.reduce(
        (b, c) => b.extend(c as [number, number]),
        new maplibregl.LngLatBounds(coords[0] as [number, number], coords[0] as [number, number])
      )
      m.fitBounds(bounds, { padding: 60, duration: 1000 })
    }
  }, [])

  const backToList = useCallback(() => {
    setSelectedRoute(null)
    setSelectedStop(null)
    setPredictions([])
    setView('list')
    const map = mapRef.current
    if (map) {
      if (map.getLayer('ghost-routes-highlight')) {
        map.setFilter('ghost-routes-highlight', ['==', '_fid', -1])
      }
      if (map.getLayer('bus-stops-highlight')) {
        map.setFilter('bus-stops-highlight', ['==', 'stpid', ''])
      }
      map.flyTo({ center: [-87.6298, 41.8781], zoom: 11, duration: 1000 })
    }
  }, [])

  // Apply tier filter to map
  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded()) return
    const apply = () => {
      let filter: maplibregl.FilterSpecification | null = null
      if (tierFilter === 'good') filter = ['>=', 'ratio', 0.95]
      else if (tierFilter === 'fair') filter = ['all', ['>=', 'ratio', 0.91], ['<', 'ratio', 0.95]]
      else if (tierFilter === 'poor') filter = ['<', 'ratio', 0.91]

      if (map.getLayer('ghost-routes-layer')) map.setFilter('ghost-routes-layer', filter)
      if (map.getLayer('ghost-routes-hit')) map.setFilter('ghost-routes-hit', filter)
    }
    if (map.isStyleLoaded()) apply()
    else map.once('load', apply)
  }, [tierFilter])

  const inset = '2px inset #808080'
  const outset = '2px outset #DFDFDF'

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%', width: '100%',
      background: '#C0C0C0', fontFamily: 'MS Sans Serif, Arial, sans-serif', fontSize: 12
    }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex', gap: 6, padding: '6px 8px', background: '#C0C0C0',
        borderBottom: '2px groove #DFDFDF', alignItems: 'center', flexWrap: 'wrap'
      }}>
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search routes..."
          style={{
            width: 140, padding: '4px 5px', fontSize: 12, fontFamily: 'inherit',
            border: inset, background: '#FFF', outline: 'none'
          }}
        />
        <div style={{ width: 1, height: 20, background: '#808080', margin: '0 2px' }} />
        {([
          { key: 'all' as Tier, label: 'All', color: '#808080' },
          { key: 'good' as Tier, label: 'Good ≥95%', color: TIER_COLORS.good },
          { key: 'fair' as Tier, label: 'Fair 91-95%', color: TIER_COLORS.fair },
          { key: 'poor' as Tier, label: 'Poor <91%', color: TIER_COLORS.poor },
        ]).map(({ key, label, color }) => {
          const active = tierFilter === key
          return (
            <button
              key={key}
              onClick={() => { setTierFilter(key); if (view === 'detail') backToList() }}
              style={{
                display: 'flex', alignItems: 'center', gap: 3,
                padding: '3px 6px', fontSize: 10, fontFamily: 'inherit',
                border: active ? inset : outset,
                background: active ? '#D0D0D0' : '#C0C0C0',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{
                display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
                background: color, border: '1px solid #666', flexShrink: 0,
              }} />
              <span style={{ fontWeight: active ? 'bold' : 'normal' }}>{label}</span>
            </button>
          )
        })}
        <div style={{ width: 1, height: 20, background: '#808080', margin: '0 2px' }} />
        <select
          value={sortMode}
          onChange={e => setSortMode(e.target.value as SortMode)}
          style={{
            padding: '4px 4px', fontSize: 11, fontFamily: 'inherit',
            border: inset, background: '#FFF', outline: 'none'
          }}
        >
          <option value="rank">By Rank</option>
          <option value="route">By Route #</option>
          <option value="name">By Name</option>
        </select>
      </div>

      {/* Main content */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* Map */}
        <div style={{ flex: '0 0 60%', minHeight: 0, position: 'relative' }}>
          <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />

          {/* Legend */}
          <div style={{
            position: 'absolute', bottom: 10, left: 10,
            background: 'rgba(255,255,255,0.92)', border: outset, padding: '6px 8px', fontSize: 10,
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: 4, color: '#000' }}>Reliability</div>
            {[
              { label: '98%+', color: '#22C55E' },
              { label: '95%', color: '#84CC16' },
              { label: '92%', color: '#EAB308' },
              { label: '89%', color: '#F97316' },
              { label: '84%', color: '#EF4444' },
            ].map(({ label, color }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 1 }}>
                <span style={{ display: 'inline-block', width: 20, height: 3, background: color, borderRadius: 1 }} />
                <span>{label}</span>
              </div>
            ))}
          </div>

          {/* Stats bar */}
          <div style={{
            position: 'absolute', bottom: 10, right: 10,
            background: '#000080', color: '#FFF', padding: '4px 12px', fontSize: 11,
            fontWeight: 'bold', border: outset,
          }}>
            {filteredFeatures.length} route{filteredFeatures.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Right panel */}
        <div style={{
          flex: '0 0 40%', display: 'flex', flexDirection: 'column',
          borderLeft: '2px groove #DFDFDF', overflowY: 'auto', background: '#C0C0C0'
        }}>
          {view === 'detail' && selectedRoute ? (
            <DetailPanel
              route={selectedRoute}
              otherDirection={otherDirection}
              onBack={backToList}
              onSelectOther={(r) => selectRoute(r)}
              busStops={busStops}
              selectedStop={selectedStop}
              onSelectStop={handleStopClick}
              onClearStop={clearStop}
              predictions={predictions}
              predsLoading={predsLoading}
              predsError={predsError}
              inset={inset}
              outset={outset}
            />
          ) : (
            <ListPanel
              features={panelFeatures}
              totalCount={filteredFeatures.length}
              stats={stats}
              onSelect={(r) => selectRoute(r)}
              inset={inset}
              outset={outset}
            />
          )}
        </div>
      </div>
    </div>
  )
}

/* ---- List Panel ---- */
function ListPanel({ features: items, totalCount, stats, onSelect, inset }: {
  features: EnrichedFeature[]
  totalCount: number
  stats: { min: number; max: number; avg: number; worst: EnrichedFeature; best: EnrichedFeature }
  onSelect: (r: EnrichedFeature) => void
  inset: string
  outset: string
}) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* Header */}
      <div style={{
        background: '#000080', color: '#FFF', padding: '5px 8px',
        fontWeight: 'bold', fontSize: 12
      }}>
        CTA GHOST BUS TRACKER
      </div>

      {/* Summary stats */}
      <div style={{
        display: 'flex', gap: 4, padding: '6px 8px', background: '#DFDFDF',
        borderBottom: '1px solid #808080',
      }}>
        {[
          { label: 'Least Reliable', value: `${(stats.min * 100).toFixed(1)}%`, sub: `#${stats.worst.properties.route_short_name}`, color: TIER_COLORS.poor },
          { label: 'Average', value: `${(stats.avg * 100).toFixed(1)}%`, sub: `${totalCount} routes`, color: TIER_COLORS.fair },
          { label: 'Most Reliable', value: `${(stats.max * 100).toFixed(1)}%`, sub: `#${stats.best.properties.route_short_name}`, color: TIER_COLORS.good },
        ].map(({ label, value, sub, color }) => (
          <div key={label} style={{
            flex: 1, border: inset, background: '#FFF', padding: '4px 6px', textAlign: 'center'
          }}>
            <div style={{ fontSize: 9, color: '#666', textTransform: 'uppercase' }}>{label}</div>
            <div style={{ fontSize: 16, fontWeight: 'bold', color }}>{value}</div>
            <div style={{ fontSize: 9, color: '#888' }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Route count */}
      <div style={{
        background: ACCENT, color: '#FFF', padding: '5px 8px',
        fontWeight: 'bold', fontSize: 12
      }}>
        ROUTES ({items.length})
      </div>

      {/* Route list */}
      <div style={{ flex: 1, overflowY: 'auto', border: inset, background: '#FFF' }}>
        {items.map((ft, i) => {
          const p = ft.properties
          const tier = getTier(p.ratio)
          return (
            <div
              key={ft.properties._fid}
              onClick={() => onSelect(ft)}
              style={{
                padding: '6px 8px', cursor: 'pointer',
                borderBottom: '1px solid #E0E0E0',
                background: i % 2 === 0 ? '#FFF' : '#F4F0F8',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#000080'; e.currentTarget.style.color = '#FFF' }}
              onMouseLeave={e => { e.currentTarget.style.background = i % 2 === 0 ? '#FFF' : '#F4F0F8'; e.currentTarget.style.color = '#000' }}
            >
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{
                    display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
                    background: ratioColor(p.ratio), border: '1px solid #666', flexShrink: 0
                  }} />
                  <span style={{ fontSize: 11, fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    #{p.route_short_name} {p.route_long_name}
                  </span>
                </div>
                <div style={{ fontSize: 10, opacity: 0.7, marginTop: 1, paddingLeft: 13 }}>
                  {p.direction} &middot;{' '}
                  <span style={{ color: TIER_COLORS[tier], fontWeight: 'bold' }}>{TIER_LABELS[tier]}</span>
                </div>
              </div>
              <div style={{ textAlign: 'right', marginLeft: 8, whiteSpace: 'nowrap' }}>
                <div style={{ fontSize: 11, fontWeight: 'bold' }}>{(p.ratio * 100).toFixed(1)}%</div>
                <div style={{ fontSize: 9, opacity: 0.6 }}>Rank #{p.ratio_ranking}</div>
              </div>
            </div>
          )
        })}
      </div>
      <div style={{ padding: 4, fontSize: 10, color: '#808080', textAlign: 'center', background: '#C0C0C0' }}>
        Click a route to see details
      </div>
    </div>
  )
}

/* ---- Detail Panel ---- */
function DetailPanel({ route, otherDirection, onBack, onSelectOther, busStops, selectedStop, onSelectStop, onClearStop, predictions, predsLoading, predsError, inset, outset }: {
  route: EnrichedFeature
  otherDirection: EnrichedFeature | null
  onBack: () => void
  onSelectOther: (r: EnrichedFeature) => void
  busStops: BusStop[]
  selectedStop: BusStop | null
  onSelectStop: (stop: BusStop) => void
  onClearStop: () => void
  predictions: BusPrediction[]
  predsLoading: boolean
  predsError: string
  inset: string
  outset: string
}) {
  const p = route.properties
  const tier = getTier(p.ratio)
  const ghostPct = ((1 - p.ratio) * 100).toFixed(1)
  const reliablePct = (p.ratio * 100).toFixed(1)
  const ridership = ridershipMap[p.route_id] || {}

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{ padding: '8px 8px 0 8px' }}>
        <div
          onClick={onBack}
          style={{ cursor: 'pointer', fontSize: 11, color: ACCENT, marginBottom: 6, textDecoration: 'underline' }}
        >
          &larr; Back to list
        </div>
        <div style={{
          background: '#000080', color: '#FFF', padding: '4px 8px',
          fontWeight: 'bold', fontSize: 12, marginBottom: 1
        }}>
          ROUTE DETAILS
        </div>
        <div style={{ background: '#DFDFDF', border: inset, padding: 10 }}>
          <div style={{ fontSize: 18, fontWeight: 'bold', color: '#000', marginBottom: 4, letterSpacing: '-0.02em' }}>
            #{p.route_short_name} {p.route_long_name}
          </div>
          <div style={{ fontSize: 11, color: '#666', marginBottom: 10 }}>
            Direction: {p.direction}
          </div>

          {/* Ratio display */}
          <div style={{
            border: inset, background: '#FFF', padding: 12, marginBottom: 8, textAlign: 'center'
          }}>
            <div style={{ fontSize: 32, fontWeight: 'bold', color: ratioColor(p.ratio), lineHeight: 1 }}>
              {reliablePct}%
            </div>
            <div style={{ fontSize: 11, color: '#444', marginTop: 4 }}>
              of scheduled buses actually ran
            </div>
            <div style={{ fontSize: 13, fontWeight: 'bold', color: '#EF4444', marginTop: 6 }}>
              {ghostPct}% were ghost buses
            </div>
          </div>

          {/* Reliability badge + rank */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{
              display: 'inline-block', padding: '2px 8px', fontSize: 11, fontWeight: 'bold',
              color: '#FFF', background: TIER_COLORS[tier], border: '1px solid #666',
            }}>
              {TIER_LABELS[tier]}
            </span>
            <span style={{ fontSize: 11, color: '#666' }}>
              Rank #{p.ratio_ranking} of {features.length}
            </span>
          </div>

          {/* Ridership table */}
          {(ridership.weekday || ridership.sat || ridership.sun) && (
            <div style={{ marginBottom: 10 }}>
              <div style={{
                background: ACCENT, color: '#FFF', padding: '3px 6px',
                fontWeight: 'bold', fontSize: 11
              }}>
                AVG DAILY RIDERSHIP
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: inset, fontSize: 11 }}>
                <tbody>
                  {[
                    { label: 'Weekday', val: ridership.weekday },
                    { label: 'Saturday', val: ridership.sat },
                    { label: 'Sunday', val: ridership.sun },
                  ].map(({ label, val }) => val != null ? (
                    <tr key={label} style={{ borderBottom: '1px solid #E0E0E0' }}>
                      <td style={{ padding: '3px 6px', fontWeight: 'bold', color: ACCENT, width: '40%' }}>{label}</td>
                      <td style={{ padding: '3px 6px' }}>{val.toLocaleString()} riders</td>
                    </tr>
                  ) : null)}
                </tbody>
              </table>
            </div>
          )}

          {/* Bus stops & predictions section */}
          <div style={{ marginBottom: 10 }}>
            <div style={{
              background: ACCENT, color: '#FFF', padding: '3px 6px',
              fontWeight: 'bold', fontSize: 11,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span>
                {selectedStop ? `STOP: ${selectedStop.stpnm}` : `BUS STOPS (${busStops.length})`}
              </span>
              {selectedStop && (
                <span
                  onClick={onClearStop}
                  style={{ cursor: 'pointer', fontSize: 10, textDecoration: 'underline' }}
                >
                  all stops
                </span>
              )}
            </div>

            {/* Direction banner showing start → end */}
            {!selectedStop && busStops.length >= 2 && (
              <div style={{
                background: '#000080', color: '#FFF', padding: '4px 6px',
                fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}>
                <span style={{ fontWeight: 'bold' }}>{busStops[0].stpnm}</span>
                <span style={{ opacity: 0.7 }}>&rarr;</span>
                <span style={{ fontWeight: 'bold' }}>{busStops[busStops.length - 1].stpnm}</span>
              </div>
            )}

            {selectedStop ? (
              /* Predictions for selected stop */
              <div style={{ border: inset, background: '#FFF', maxHeight: 200, overflowY: 'auto' }}>
                {predsLoading ? (
                  <div style={{ padding: '12px 8px', fontSize: 11, color: '#666', textAlign: 'center' }}>
                    Loading predictions...
                  </div>
                ) : predsError ? (
                  <div style={{ padding: '12px 8px', fontSize: 11, color: '#888', textAlign: 'center' }}>
                    {predsError}
                  </div>
                ) : predictions.map((pred, i) => {
                  const countdown = pred.prdctdn === 'DUE' ? 'DUE' : `${pred.prdctdn} min`
                  const predTime = pred.prdtm?.slice(9)?.trim()
                  return (
                    <div key={i} style={{
                      padding: '5px 6px', borderBottom: '1px solid #E0E0E0',
                      background: i % 2 === 0 ? '#FFF' : '#F4F0F8',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      fontSize: 11
                    }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontWeight: 'bold' }}>
                          to {pred.des}
                        </div>
                        <div style={{ fontSize: 10, color: '#666' }}>
                          {pred.rtdir} &middot; Bus #{pred.vid}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', marginLeft: 8, whiteSpace: 'nowrap' }}>
                        <div style={{
                          fontWeight: 'bold', fontSize: 13,
                          color: pred.prdctdn === 'DUE' ? '#EF4444' : ACCENT,
                        }}>
                          {countdown}
                        </div>
                        <div style={{ fontSize: 9, color: '#888' }}>{predTime}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              /* Stop list */
              <div style={{ border: inset, background: '#FFF', maxHeight: 200, overflowY: 'auto' }}>
                {busStops.length === 0 ? (
                  <div style={{ padding: '12px 8px', fontSize: 11, color: '#888', textAlign: 'center' }}>
                    Loading stops...
                  </div>
                ) : busStops.map((stop, i) => {
                  const isFirst = i === 0
                  const isLast = i === busStops.length - 1
                  const isTerminal = isFirst || isLast
                  return (
                    <div
                      key={stop.stpid}
                      onClick={() => onSelectStop(stop)}
                      style={{
                        padding: '4px 6px', borderBottom: '1px solid #E0E0E0',
                        background: isTerminal ? '#E8E0F0' : (i % 2 === 0 ? '#FFF' : '#F4F0F8'),
                        cursor: 'pointer', fontSize: 11,
                        display: 'flex', alignItems: 'center', gap: 5,
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#000080'; e.currentTarget.style.color = '#FFF' }}
                      onMouseLeave={e => { e.currentTarget.style.background = isTerminal ? '#E8E0F0' : (i % 2 === 0 ? '#FFF' : '#F4F0F8'); e.currentTarget.style.color = '#000' }}
                    >
                      <span style={{
                        display: 'inline-block', width: isTerminal ? 8 : 6, height: isTerminal ? 8 : 6, borderRadius: '50%',
                        background: isTerminal ? '#000080' : ACCENT, flexShrink: 0,
                        border: isTerminal ? '1.5px solid #FFF' : 'none',
                        boxShadow: isTerminal ? '0 0 0 1px #000080' : 'none',
                      }} />
                      <span style={{ fontWeight: isTerminal ? 'bold' : 'normal', flex: 1 }}>
                        {stop.stpnm}
                      </span>
                      {isTerminal && (
                        <span style={{
                          fontSize: 8, fontWeight: 'bold', color: '#FFF', background: '#000080',
                          padding: '1px 4px', flexShrink: 0,
                        }}>
                          {isFirst ? 'START' : 'END'}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* CTA website link */}
          <a
            href={p.route_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'block', textAlign: 'center', padding: '6px 12px',
              fontSize: 12, fontWeight: 'bold', fontFamily: 'inherit',
              border: outset, background: ACCENT, color: '#FFF',
              cursor: 'pointer', textDecoration: 'none',
            }}
          >
            View on CTA Website
          </a>
        </div>
      </div>

      {/* Other direction */}
      {otherDirection && (
        <div style={{ padding: '0 8px 8px 8px' }}>
          <div style={{
            background: ACCENT, color: '#FFF', padding: '5px 8px',
            fontWeight: 'bold', fontSize: 12, marginTop: 8
          }}>
            OTHER DIRECTION
          </div>
          <div
            onClick={() => onSelectOther(otherDirection!)}
            style={{
              border: inset, background: '#FFF', padding: '8px 10px', cursor: 'pointer',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#000080'; e.currentTarget.style.color = '#FFF' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#FFF'; e.currentTarget.style.color = '#000' }}
          >
            <div>
              <div style={{ fontSize: 11, fontWeight: 'bold' }}>
                #{otherDirection.properties.route_short_name} {otherDirection.properties.route_long_name}
              </div>
              <div style={{ fontSize: 10, opacity: 0.7 }}>{otherDirection.properties.direction}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, fontWeight: 'bold' }}>{(otherDirection.properties.ratio * 100).toFixed(1)}%</div>
              <div style={{ fontSize: 9, opacity: 0.6 }}>Rank #{otherDirection.properties.ratio_ranking}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
