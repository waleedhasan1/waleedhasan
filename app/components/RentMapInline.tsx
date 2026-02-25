'use client'

import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import ctaStations from '../cta-stations.json'

const CTA_COLORS: Record<string, string> = {
  red: '#c62828', blue: '#1565c0', brown: '#795548', green: '#2e7d32',
  orange: '#e65100', pink: '#ec407a', purple: '#7b1fa2', yellow: '#fdd835',
}

function ctaCoreLine(name: string): string | null {
  if (name.includes('Red')) return 'red'
  if (name.includes('Blue')) return 'blue'
  if (name.includes('Brown')) return 'brown'
  if (name.includes('Green')) return 'green'
  if (name.includes('Orange')) return 'orange'
  if (name.includes('Pink')) return 'pink'
  if (name.includes('Purple') || name.includes('Evanston')) return 'purple'
  if (name.includes('Yellow')) return 'yellow'
  return null
}

function buildCTALines() {
  // Group stations by line color
  const groups: Record<string, { lat: number; lng: number }[]> = {}
  for (const s of ctaStations) {
    for (const raw of s.lines.split(', ')) {
      const core = ctaCoreLine(raw.trim())
      if (!core) continue
      if (!groups[core]) groups[core] = []
      // Deduplicate by coords
      if (!groups[core].some(p => p.lat === s.lat && p.lng === s.lng)) {
        groups[core].push({ lat: s.lat, lng: s.lng })
      }
    }
  }

  // Order each line's stations via nearest-neighbor from northernmost
  const features = []
  for (const [color, stations] of Object.entries(groups)) {
    if (stations.length < 2) continue
    // Start from northernmost station
    stations.sort((a, b) => b.lat - a.lat)
    const ordered = [stations.shift()!]
    while (stations.length) {
      const last = ordered[ordered.length - 1]
      let best = 0, bestD = Infinity
      for (let i = 0; i < stations.length; i++) {
        const d = (stations[i].lat - last.lat) ** 2 + (stations[i].lng - last.lng) ** 2
        if (d < bestD) { bestD = d; best = i }
      }
      ordered.push(stations.splice(best, 1)[0])
    }
    features.push({
      type: 'Feature' as const,
      properties: { color: CTA_COLORS[color] || '#999', line: color },
      geometry: { type: 'LineString' as const, coordinates: ordered.map(s => [s.lng, s.lat]) },
    })
  }
  return { type: 'FeatureCollection' as const, features }
}

const RENT_DATA: Record<string, { avg: number; low: number; high: number }> = {
  'ROGERS PARK': { avg: 1150, low: 850, high: 1500 },
  'WEST RIDGE': { avg: 1100, low: 800, high: 1450 },
  'UPTOWN': { avg: 1250, low: 900, high: 1700 },
  'LINCOLN SQUARE': { avg: 1350, low: 950, high: 1800 },
  'NORTH CENTER': { avg: 1600, low: 1100, high: 2200 },
  'LAKE VIEW': { avg: 1750, low: 1200, high: 2500 },
  'LINCOLN PARK': { avg: 1900, low: 1300, high: 2800 },
  'NEAR NORTH SIDE': { avg: 2200, low: 1500, high: 3500 },
  'EDISON PARK': { avg: 1200, low: 900, high: 1550 },
  'NORWOOD PARK': { avg: 1150, low: 850, high: 1500 },
  'JEFFERSON PARK': { avg: 1100, low: 800, high: 1400 },
  'FOREST GLEN': { avg: 1300, low: 950, high: 1700 },
  'NORTH PARK': { avg: 1200, low: 850, high: 1550 },
  'ALBANY PARK': { avg: 1100, low: 800, high: 1450 },
  'PORTAGE PARK': { avg: 1050, low: 750, high: 1400 },
  'IRVING PARK': { avg: 1150, low: 800, high: 1500 },
  'DUNNING': { avg: 1050, low: 750, high: 1350 },
  'MONTCLARE': { avg: 1000, low: 750, high: 1300 },
  'BELMONT CRAGIN': { avg: 950, low: 700, high: 1250 },
  'HERMOSA': { avg: 900, low: 650, high: 1200 },
  'AVONDALE': { avg: 1300, low: 900, high: 1750 },
  'LOGAN SQUARE': { avg: 1450, low: 1000, high: 2000 },
  'HUMBOLDT PARK': { avg: 1050, low: 700, high: 1450 },
  'WEST TOWN': { avg: 1650, low: 1100, high: 2400 },
  'AUSTIN': { avg: 850, low: 600, high: 1150 },
  'WEST GARFIELD PARK': { avg: 800, low: 550, high: 1100 },
  'EAST GARFIELD PARK': { avg: 900, low: 600, high: 1250 },
  'NEAR WEST SIDE': { avg: 1800, low: 1200, high: 2600 },
  'NORTH LAWNDALE': { avg: 850, low: 600, high: 1150 },
  'SOUTH LAWNDALE': { avg: 900, low: 650, high: 1200 },
  'LOWER WEST SIDE': { avg: 1050, low: 750, high: 1400 },
  'LOOP': { avg: 2100, low: 1400, high: 3200 },
  'NEAR SOUTH SIDE': { avg: 1900, low: 1300, high: 2800 },
  'ARMOUR SQUARE': { avg: 1050, low: 750, high: 1400 },
  'DOUGLAS': { avg: 1300, low: 900, high: 1800 },
  'OAKLAND': { avg: 1200, low: 800, high: 1650 },
  'FULLER PARK': { avg: 800, low: 550, high: 1100 },
  'GRAND BOULEVARD': { avg: 1100, low: 750, high: 1500 },
  'KENWOOD': { avg: 1350, low: 950, high: 1850 },
  'WASHINGTON PARK': { avg: 900, low: 600, high: 1250 },
  'HYDE PARK': { avg: 1400, low: 950, high: 1950 },
  'WOODLAWN': { avg: 1050, low: 700, high: 1450 },
  'SOUTH SHORE': { avg: 950, low: 650, high: 1300 },
  'CHATHAM': { avg: 900, low: 650, high: 1200 },
  'AVALON PARK': { avg: 950, low: 700, high: 1250 },
  'SOUTH CHICAGO': { avg: 850, low: 600, high: 1150 },
  'BURNSIDE': { avg: 800, low: 550, high: 1100 },
  'CALUMET HEIGHTS': { avg: 950, low: 700, high: 1250 },
  'ROSELAND': { avg: 900, low: 650, high: 1200 },
  'PULLMAN': { avg: 950, low: 700, high: 1250 },
  'SOUTH DEERING': { avg: 850, low: 600, high: 1150 },
  'EAST SIDE': { avg: 900, low: 650, high: 1200 },
  'WEST PULLMAN': { avg: 850, low: 600, high: 1150 },
  'RIVERDALE': { avg: 750, low: 500, high: 1050 },
  'HEGEWISCH': { avg: 950, low: 700, high: 1250 },
  'GARFIELD RIDGE': { avg: 1050, low: 750, high: 1400 },
  'ARCHER HEIGHTS': { avg: 1000, low: 700, high: 1350 },
  'BRIGHTON PARK': { avg: 950, low: 700, high: 1250 },
  'MCKINLEY PARK': { avg: 1100, low: 800, high: 1450 },
  'NEW CITY': { avg: 900, low: 650, high: 1200 },
  'WEST ELSDON': { avg: 1000, low: 750, high: 1300 },
  'GAGE PARK': { avg: 950, low: 700, high: 1250 },
  'CLEARING': { avg: 1050, low: 750, high: 1400 },
  'WEST LAWN': { avg: 1000, low: 700, high: 1350 },
  'CHICAGO LAWN': { avg: 950, low: 650, high: 1300 },
  'WEST ENGLEWOOD': { avg: 800, low: 550, high: 1100 },
  'ENGLEWOOD': { avg: 750, low: 500, high: 1050 },
  'GREATER GRAND CROSSING': { avg: 850, low: 600, high: 1150 },
  'ASHBURN': { avg: 1050, low: 750, high: 1400 },
  'AUBURN GRESHAM': { avg: 850, low: 600, high: 1150 },
  'BEVERLY': { avg: 1250, low: 900, high: 1650 },
  'WASHINGTON HEIGHTS': { avg: 900, low: 650, high: 1200 },
  'MOUNT GREENWOOD': { avg: 1150, low: 850, high: 1500 },
  'MORGAN PARK': { avg: 1050, low: 750, high: 1400 },
  'OHARE': { avg: 1100, low: 800, high: 1450 },
  'EDGEWATER': { avg: 1300, low: 900, high: 1750 },
  'BRIDGEPORT': { avg: 1200, low: 850, high: 1600 },
}

const COLOR_THEMES: Record<string, [number, string][]> = {
  default: [[750,'#2b83ba'],[1000,'#abdda4'],[1300,'#ffffbf'],[1600,'#fdae61'],[1900,'#d7191c'],[2200,'#8b0000']],
  cool: [[750,'#e0f3db'],[1000,'#a8ddb5'],[1300,'#4eb3d3'],[1600,'#2b8cbe'],[1900,'#0868ac'],[2200,'#084081']],
  warm: [[750,'#ffffb2'],[1000,'#fecc5c'],[1300,'#fd8d3c'],[1600,'#f03b20'],[1900,'#bd0026'],[2200,'#67000d']],
  neon: [[750,'#00ffff'],[1000,'#00ff88'],[1300,'#ccff00'],[1600,'#ffff00'],[1900,'#ff00ff'],[2200,'#ff0044']],
}

function colorExpr(theme: string) {
  const stops = COLOR_THEMES[theme] || COLOR_THEMES.default
  return ['interpolate', ['linear'], ['get', 'rent_avg'], ...stops.flat()] as any
}

function pointInPolygon(pt: [number, number], ring: number[][]) {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1]
    if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

function generateListings(geometry: any, rentInfo: { low: number; high: number }, count: number) {
  const polys = geometry.type === 'MultiPolygon' ? geometry.coordinates : [geometry.coordinates]
  let bestRing = polys[0][0], bestArea = 0
  for (const poly of polys) {
    const ring = poly[0]
    let area = 0
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) area += (ring[j][0] + ring[i][0]) * (ring[j][1] - ring[i][1])
    area = Math.abs(area / 2)
    if (area > bestArea) { bestArea = area; bestRing = ring }
  }
  let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity
  for (const [lng, lat] of bestRing) { if (lng < minLng) minLng = lng; if (lng > maxLng) maxLng = lng; if (lat < minLat) minLat = lat; if (lat > maxLat) maxLat = lat }
  const features = []
  let attempts = 0
  while (features.length < count && attempts < count * 50) {
    attempts++
    const lng = minLng + Math.random() * (maxLng - minLng), lat = minLat + Math.random() * (maxLat - minLat)
    if (pointInPolygon([lng, lat], bestRing)) {
      const price = Math.round((rentInfo.low + Math.random() * (rentInfo.high - rentInfo.low)) / 25) * 25
      const configs = [{ type: 'Studio', beds: 0, baths: 1, sqft: [350,550] }, { type: '1BR', beds: 1, baths: 1, sqft: [550,800] }, { type: '2BR', beds: 2, baths: 1, sqft: [800,1100] }, { type: '3BR', beds: 3, baths: 2, sqft: [1100,1500] }]
      const cfg = configs[Math.floor(Math.random() * configs.length)]
      const sqft = Math.round((cfg.sqft[0] + Math.random() * (cfg.sqft[1] - cfg.sqft[0])) / 10) * 10
      const streets = ['N Michigan Ave','W Division St','S State St','W Madison St','N Clark St','S Halsted St','W Fullerton Ave','N Ashland Ave','W 47th St','S Cottage Grove Ave','N Western Ave','W Irving Park Rd']
      const addr = `${Math.floor(Math.random() * 9000) + 100} ${streets[Math.floor(Math.random() * streets.length)]}`
      const available = ['Now','Mar 1','Apr 1','May 1'][Math.floor(Math.random() * 4)]
      const pets = Math.random() > 0.4 ? 'Cats/Dogs OK' : 'No Pets'
      const laundry = Math.random() > 0.5 ? 'In-unit' : 'In building'
      features.push({ type: 'Feature' as const, geometry: { type: 'Point' as const, coordinates: [lng, lat] }, properties: { price, type: cfg.type, beds: cfg.beds, baths: cfg.baths, sqft, addr, available, pets, laundry } })
    }
  }
  return features
}

export default function RentMapInline() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const [zoomed, setZoomed] = useState<string | null>(null)
  const zoomedRef = useRef<string | null>(null)
  const geojsonRef = useRef<any>(null)
  const hoveredIdRef = useRef<string | null>(null)
  const trendCache = useRef<Record<string, number[]>>({})
  const [darkMode, setDarkMode] = useState(false)
  const [priceRange, setPriceRange] = useState<[number, number]>([750, 2200])
  const [colorTheme, setColorTheme] = useState('default')
  const prevThemeRef = useRef('default')

  function getTrend(name: string, avg: number) {
    if (!trendCache.current[name]) {
      trendCache.current[name] = Array.from({ length: 12 }, (_, i) =>
        avg * 0.92 + (avg * 0.08) * (i / 11) + (Math.random() - 0.5) * 40
      )
    }
    return trendCache.current[name]
  }

  function zoomToNeighborhood(map: maplibregl.Map, name: string, geometry: any) {
    const d = RENT_DATA[name]
    if (!d) return
    zoomedRef.current = name
    setZoomed(name)
    const polys = geometry.type === 'MultiPolygon' ? geometry.coordinates : [geometry.coordinates]
    const bounds = new maplibregl.LngLatBounds()
    for (const poly of polys) for (const ring of poly) for (const pt of ring) bounds.extend(pt as [number, number])
    map.flyTo({ center: bounds.getCenter(), zoom: 15, pitch: 50, bearing: 20, duration: 1000 })
    map.setPaintProperty('rent-extrusion', 'fill-extrusion-opacity', 0.1)
    if (!map.getLayer('3d-buildings')) {
      map.addLayer({ id: '3d-buildings', type: 'fill-extrusion', source: 'openmaptiles', 'source-layer': 'building', minzoom: 13, paint: { 'fill-extrusion-color': darkMode ? '#334' : '#ddd', 'fill-extrusion-height': ['coalesce', ['get', 'render_height'], 10], 'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0], 'fill-extrusion-opacity': 0.8 } })
    } else {
      map.setLayoutProperty('3d-buildings', 'visibility', 'visible')
      map.setPaintProperty('3d-buildings', 'fill-extrusion-color', darkMode ? '#334' : '#ddd')
    }
    const listings = generateListings(geometry, d, 15)
    if (map.getSource('listings')) {
      (map.getSource('listings') as maplibregl.GeoJSONSource).setData({ type: 'FeatureCollection', features: listings })
    } else {
      map.addSource('listings', { type: 'geojson', data: { type: 'FeatureCollection', features: listings } })
      const size = 32, canvas = document.createElement('canvas')
      canvas.width = size; canvas.height = size
      const ctx = canvas.getContext('2d')!
      ctx.beginPath()
      for (let i = 0; i < 5; i++) {
        const oa = (i * 72 - 90) * Math.PI / 180, ia = ((i * 72) + 36 - 90) * Math.PI / 180
        ctx.lineTo(size/2 + Math.cos(oa)*14, size/2 + Math.sin(oa)*14)
        ctx.lineTo(size/2 + Math.cos(ia)*6, size/2 + Math.sin(ia)*6)
      }
      ctx.closePath(); ctx.fillStyle = '#9B59B6'; ctx.fill(); ctx.strokeStyle = '#6C3483'; ctx.lineWidth = 1.5; ctx.stroke()
      map.addImage('star-icon', { width: size, height: size, data: new Uint8Array(ctx.getImageData(0,0,size,size).data.buffer) })
      map.addLayer({ id: 'listing-stars', type: 'symbol', source: 'listings', layout: { 'icon-image': 'star-icon', 'icon-size': 1, 'icon-allow-overlap': true, 'text-field': ['concat','$',['to-string',['get','price']],' · ',['case',['==',['get','beds'],0],'Studio',['concat',['to-string',['get','beds']],'bd']],'/',['to-string',['get','baths']],'ba'], 'text-size': 12, 'text-font': ['Open Sans Bold'], 'text-offset': [0,1.6], 'text-allow-overlap': true, 'text-anchor': 'top' }, paint: { 'text-color': darkMode ? '#fff' : '#1a1a1a', 'text-halo-color': darkMode ? '#000' : '#fff', 'text-halo-width': 1.5 } })
      let listingPopup: maplibregl.Popup | null = null
      map.on('mouseenter', 'listing-stars', (e) => {
        map.getCanvas().style.cursor = 'pointer'
        if (!e.features || !e.features[0]) return
        const p = e.features[0].properties!
        const coords = (e.features[0].geometry as any).coordinates.slice()
        const bedLabel = p.beds === 0 ? 'STUDIO' : p.beds === 1 ? '1 BED' : `${p.beds} BEDS`
        const bathLabel = p.baths === 1 ? '1 BATH' : `${p.baths} BATHS`
        listingPopup = new maplibregl.Popup({ offset: 20, closeButton: false, closeOnClick: false })
          .setLngLat(coords)
          .setHTML(`<div style="font-family:'Segoe UI',Arial,sans-serif;text-align:center;padding:12px 18px;min-width:160px">
            <div style="font-size:36px;font-weight:800;color:#6C3483;line-height:1">${p.beds === 0 ? '☆' : p.beds}</div>
            <div style="font-size:13px;font-weight:700;color:#6C3483;letter-spacing:1px;margin-bottom:8px">${bedLabel}</div>
            <div style="font-size:28px;font-weight:800;color:#1a1a1a;line-height:1">$${p.price}<span style="font-size:14px;font-weight:400;color:#666">/mo</span></div>
            <div style="margin:8px 0 6px;height:1px;background:linear-gradient(90deg,transparent,#ccc,transparent)"></div>
            <div style="display:flex;justify-content:center;gap:12px;font-size:12px;color:#555"><span>${bathLabel}</span><span>·</span><span>${p.sqft} SF</span></div>
            <div style="font-size:11px;color:#888;margin-top:6px">${p.addr}</div>
            <div style="font-size:11px;color:#888">${p.pets} · ${p.laundry} laundry · Avail ${p.available}</div>
          </div>`).addTo(map)
      })
      map.on('mouseleave', 'listing-stars', () => { map.getCanvas().style.cursor = ''; if (listingPopup) { listingPopup.remove(); listingPopup = null } })
    }
  }

  function zoomOut(map: maplibregl.Map) {
    zoomedRef.current = null; setZoomed(null)
    map.flyTo({ center: [-87.65, 41.85], zoom: 10, pitch: 45, bearing: -10, duration: 1000 })
    map.setPaintProperty('rent-extrusion', 'fill-extrusion-opacity', 0.85)
    if (map.getLayer('3d-buildings')) map.setLayoutProperty('3d-buildings', 'visibility', 'none')
    if (map.getSource('listings')) (map.getSource('listings') as maplibregl.GeoJSONSource).setData({ type: 'FeatureCollection', features: [] })
  }

  // Init map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: [-87.65, 41.85],
      zoom: 10,
      pitch: 45,
      bearing: -10,
    })
    mapRef.current = map
    map.addControl(new maplibregl.NavigationControl(), 'top-right')

    fetch('/boundaries_communities.geojson').then(r => r.json()).then(geojson => {
      for (const f of geojson.features) {
        const rd = RENT_DATA[f.properties.community]
        f.properties.rent_avg = rd?.avg || 0
      }
      geojsonRef.current = geojson

      map.on('load', () => {
        // Dark overlay (hidden initially)
        map.addLayer({ id: 'dark-overlay', type: 'background', paint: { 'background-color': '#0a0a1e', 'background-opacity': 0 } })

        map.addSource('communities', { type: 'geojson', data: geojson, promoteId: 'area_numbe' })

        // Extrusion — starts at height 0 for fly-in
        map.addLayer({
          id: 'rent-extrusion', type: 'fill-extrusion', source: 'communities',
          paint: {
            'fill-extrusion-color': colorExpr('default'),
            'fill-extrusion-height': 0,
            'fill-extrusion-height-transition': { duration: 1800, delay: 0 },
            'fill-extrusion-base': 0,
            'fill-extrusion-opacity': 0,
            'fill-extrusion-opacity-transition': { duration: 1200, delay: 0 },
          },
        })

        map.addLayer({ id: 'rent-outline', type: 'line', source: 'communities', paint: { 'line-color': '#333', 'line-width': 1 } })

        // CTA train lines
        map.addSource('cta-lines', { type: 'geojson', data: buildCTALines() as any })
        map.addLayer({
          id: 'cta-lines-outline', type: 'line', source: 'cta-lines',
          paint: { 'line-color': '#000', 'line-width': 5, 'line-opacity': 0.3 },
        })
        map.addLayer({
          id: 'cta-lines-color', type: 'line', source: 'cta-lines',
          paint: { 'line-color': ['get', 'color'], 'line-width': 3, 'line-opacity': 0.85 },
          layout: { 'line-cap': 'round', 'line-join': 'round' },
        })

        // Buildings rise animation
        setTimeout(() => {
          map.setPaintProperty('rent-extrusion', 'fill-extrusion-opacity', 0.85)
          map.setPaintProperty('rent-extrusion', 'fill-extrusion-height', [
            '*', ['get', 'rent_avg'],
            ['case', ['boolean', ['feature-state', 'hover'], false], 2.5, 2],
          ])
        }, 400)

        // Hover tooltip with sparkline
        const tooltip = document.createElement('div')
        tooltip.style.cssText = 'position:absolute;pointer-events:none;background:rgba(0,0,0,0.85);color:#fff;padding:8px 12px;border-radius:4px;font-family:MS Sans Serif,Arial,sans-serif;font-size:14px;font-weight:bold;display:none;z-index:20;line-height:1.5;'
        containerRef.current!.appendChild(tooltip)

        map.on('mousemove', 'rent-extrusion', (e) => {
          if (zoomedRef.current) { tooltip.style.display = 'none'; return }
          if (!e.features || !e.features[0]) return

          // Hover highlight
          const id = e.features[0].id as string
          if (hoveredIdRef.current && hoveredIdRef.current !== id) {
            map.setFeatureState({ source: 'communities', id: hoveredIdRef.current }, { hover: false })
          }
          hoveredIdRef.current = id
          map.setFeatureState({ source: 'communities', id }, { hover: true })
          map.getCanvas().style.cursor = 'pointer'

          const name = e.features[0].properties?.community || ''
          const d = RENT_DATA[name]
          if (d) {
            const trend = getTrend(name, d.avg)
            const tMax = Math.max(...trend), tMin = Math.min(...trend)
            const range = tMax - tMin || 1
            const pts = trend.map((v, i) => `${(i / 11) * 90},${28 - ((v - tMin) / range) * 22}`).join(' ')
            tooltip.innerHTML = `
              <div style="margin-bottom:3px">${name}</div>
              <div style="font-size:12px;font-weight:normal;color:#ccc">$${d.low} – $${d.high}/mo</div>
              <svg width="90" height="32" style="margin-top:4px;display:block">
                <polyline points="${pts}" fill="none" stroke="#4CAF50" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="${(11/11)*90}" cy="${28 - ((trend[11] - tMin) / range) * 22}" r="3" fill="#4CAF50"/>
              </svg>
              <div style="font-size:9px;font-weight:normal;color:#777;margin-top:2px">12-month trend</div>
            `
          } else {
            tooltip.innerHTML = name
          }
          tooltip.style.display = 'block'
          tooltip.style.left = e.point.x + 14 + 'px'
          tooltip.style.top = e.point.y - 14 + 'px'
        })

        map.on('mouseleave', 'rent-extrusion', () => {
          tooltip.style.display = 'none'
          map.getCanvas().style.cursor = ''
          if (hoveredIdRef.current) {
            map.setFeatureState({ source: 'communities', id: hoveredIdRef.current }, { hover: false })
            hoveredIdRef.current = null
          }
        })

        // Click → zoom in
        map.on('click', 'rent-extrusion', (e) => {
          if (zoomedRef.current) return
          if (!e.features || !e.features[0]) return
          const name = e.features[0].properties?.community
          if (!name || !geojsonRef.current) return
          const feature = geojsonRef.current.features.find((f: any) => f.properties.community === name)
          if (feature) { tooltip.style.display = 'none'; zoomToNeighborhood(map, name, feature.geometry) }
        })

        map.on('mouseenter', 'rent-extrusion', () => { if (!zoomedRef.current) map.getCanvas().style.cursor = 'pointer' })
      })
    })

    return () => { map.remove(); mapRef.current = null }
  }, [])

  // Apply dark mode / theme / price filter changes
  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.getLayer('rent-extrusion') || zoomedRef.current) return

    const theme = darkMode ? 'neon' : colorTheme
    map.setPaintProperty('rent-extrusion', 'fill-extrusion-color', colorExpr(theme))
    map.setPaintProperty('rent-extrusion', 'fill-extrusion-opacity', darkMode ? 0.92 : 0.85)

    // Price filter: flatten out-of-range neighborhoods to height 0
    map.setPaintProperty('rent-extrusion', 'fill-extrusion-height', [
      'case',
      ['all', ['>=', ['get', 'rent_avg'], priceRange[0]], ['<=', ['get', 'rent_avg'], priceRange[1]]],
      ['*', ['get', 'rent_avg'], ['case', ['boolean', ['feature-state', 'hover'], false], 2.5, 2]],
      0,
    ] as any)

    if (map.getLayer('dark-overlay')) map.setPaintProperty('dark-overlay', 'background-opacity', darkMode ? 0.75 : 0)
    if (map.getLayer('rent-outline')) map.setPaintProperty('rent-outline', 'line-color', darkMode ? '#444' : '#333')
  }, [darkMode, colorTheme, priceRange])

  function toggleDark() {
    if (!darkMode) { prevThemeRef.current = colorTheme; setColorTheme('neon') }
    else { setColorTheme(prevThemeRef.current) }
    setDarkMode(d => !d)
  }

  const activeTheme = darkMode ? 'neon' : colorTheme
  const themeStops = COLOR_THEMES[activeTheme] || COLOR_THEMES.default

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {/* === Controls toolbar (overview only) === */}
      {!zoomed && (
        <div style={{
          position: 'absolute', top: 10, left: 10, zIndex: 20,
          display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap',
          background: darkMode ? 'rgba(30,30,50,0.92)' : 'rgba(192,192,192,0.95)',
          border: darkMode ? '2px solid #555' : '2px outset #dfdfdf',
          padding: '6px 10px',
          fontFamily: 'MS Sans Serif, Arial, sans-serif', fontSize: 12,
          color: darkMode ? '#eee' : '#000',
        }}>
          <button onClick={toggleDark} style={{
            background: darkMode ? '#333' : '#C0C0C0',
            color: darkMode ? '#eee' : '#000',
            border: darkMode ? '2px solid #555' : '2px outset #dfdfdf',
            padding: '3px 10px', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit',
          }}>
            {darkMode ? 'Day' : 'Night'}
          </button>

          <select
            value={darkMode ? 'neon' : colorTheme}
            disabled={darkMode}
            onChange={e => setColorTheme(e.target.value)}
            style={{
              background: darkMode ? '#333' : '#fff',
              color: darkMode ? '#888' : '#000',
              border: darkMode ? '2px solid #555' : '2px inset #dfdfdf',
              padding: '2px 4px', fontSize: 12, fontFamily: 'inherit',
            }}
          >
            <option value="default">Default</option>
            <option value="cool">Cool Blues</option>
            <option value="warm">Warm Sunset</option>
            <option value="neon">Neon</option>
          </select>

          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
            <span style={{ minWidth: 32 }}>${priceRange[0]}</span>
            <input type="range" min={750} max={2200} step={50} value={priceRange[0]}
              onChange={e => setPriceRange([Math.min(+e.target.value, priceRange[1] - 50), priceRange[1]])}
              style={{ width: 70, accentColor: '#6C3483' }}
            />
            <span>–</span>
            <input type="range" min={750} max={2200} step={50} value={priceRange[1]}
              onChange={e => setPriceRange([priceRange[0], Math.max(+e.target.value, priceRange[0] + 50)])}
              style={{ width: 70, accentColor: '#6C3483' }}
            />
            <span style={{ minWidth: 38 }}>${priceRange[1]}</span>
          </div>
        </div>
      )}

      {/* === Back button === */}
      {zoomed && (
        <button onClick={() => mapRef.current && zoomOut(mapRef.current)} style={{
          position: 'absolute', top: 10, left: 10, zIndex: 20,
          fontFamily: 'MS Sans Serif, Arial, sans-serif', fontSize: 13, fontWeight: 'bold',
          background: '#C0C0C0', border: '2px outset #dfdfdf', padding: '6px 14px', cursor: 'pointer',
        }}>
          &larr; Back to Chicago
        </button>
      )}

      {/* === Neighborhood title === */}
      {zoomed && (
        <div style={{
          position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', zIndex: 20,
          fontFamily: 'MS Sans Serif, Arial, sans-serif', fontSize: 16, fontWeight: 'bold',
          background: 'rgba(0,0,128,0.9)', color: '#fff', padding: '6px 16px', border: '2px outset #dfdfdf',
        }}>
          {zoomed} — Available Rentals
        </div>
      )}

      {/* === Legend (overview only) === */}
      {!zoomed && (
        <div style={{
          position: 'absolute', bottom: 24, left: 10, zIndex: 10,
          background: darkMode ? 'rgba(30,30,50,0.92)' : 'rgba(192,192,192,0.95)',
          border: darkMode ? '2px solid #555' : '2px outset #dfdfdf',
          padding: '8px 10px', fontFamily: 'MS Sans Serif, Arial, sans-serif',
          fontSize: 11, lineHeight: '16px', color: darkMode ? '#ddd' : '#000',
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: 4 }}>Avg Rent ($/mo)</div>
          {themeStops.map(([val, color]) => (
            <div key={val} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ display: 'inline-block', width: 14, height: 14, background: color, border: '1px solid #888' }} />
              ${val.toLocaleString()}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
