'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

interface Property {
  bbl: string
  address: string
  borough: string
  bldgclass: string
  lotarea: string
  bldgarea: string
  numfloors: string
  unitsres: string
  unitstotal: string
  yearbuilt: string
  assesstot: string
  zonedist1: string
  latitude: string
  longitude: string
  zipcode: string
  salePrice?: string | null
  saleDate?: string | null
}

function fmt(n: string | number | null | undefined): string {
  const v = typeof n === 'string' ? parseFloat(n) : n
  if (!v && v !== 0) return '—'
  return v.toLocaleString()
}

function fmtMoney(n: string | number | null | undefined): string {
  const v = typeof n === 'string' ? parseFloat(n) : n
  if (!v) return '—'
  return '$' + v.toLocaleString()
}

const BOROUGHS = [
  { value: '0', label: 'All Boroughs' },
  { value: '1', label: 'Manhattan' },
  { value: '2', label: 'Bronx' },
  { value: '3', label: 'Brooklyn' },
  { value: '4', label: 'Queens' },
  { value: '5', label: 'Staten Island' },
]

export default function CompFinderInline() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<maplibregl.Marker[]>([])
  const browseMarkersRef = useRef<maplibregl.Marker[]>([])

  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Property[]>([])
  const [searching, setSearching] = useState(false)
  const [subject, setSubject] = useState<Property | null>(null)
  const [similarSales, setSimilarSales] = useState<Property[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)

  const [minPrice, setMinPrice] = useState(200000)
  const [maxPrice, setMaxPrice] = useState(600000)
  const [borough, setBorough] = useState('0')
  const [browseResults, setBrowseResults] = useState<Property[]>([])
  const [browseLoading, setBrowseLoading] = useState(false)
  const [sameNeighborhood, setSameNeighborhood] = useState(false)

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasResults = browseResults.length > 0 || similarSales.length > 0 || subject !== null

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return
    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      center: [-74.006, 40.7128],
      zoom: 11,
    })
    map.addControl(new maplibregl.NavigationControl(), 'top-left')
    mapRef.current = map
    return () => { map.remove(); mapRef.current = null }
  }, [])

  const clearMarkers = useCallback(() => {
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []
  }, [])

  const clearBrowseMarkers = useCallback(() => {
    browseMarkersRef.current.forEach(m => m.remove())
    browseMarkersRef.current = []
  }, [])

  const doBrowse = useCallback(async () => {
    setBrowseLoading(true)
    setError('')
    setBrowseResults([])
    setSubject(null)
    setSimilarSales([])
    clearMarkers()
    clearBrowseMarkers()
    try {
      const res = await fetch(`/api/comps?action=browse&min=${minPrice}&max=${maxPrice}&borough=${borough}`)
      const data = await res.json()
      if (data.error) { setError(data.error); setBrowseLoading(false); return }
      const results: Property[] = data.results || []
      setBrowseResults(results)
      const map = mapRef.current
      if (map && results.length > 0) {
        const bounds = new maplibregl.LngLatBounds()
        for (const prop of results) {
          const lat = parseFloat(prop.latitude)
          const lng = parseFloat(prop.longitude)
          if (!lat || !lng) continue
          bounds.extend([lng, lat])
          const el = document.createElement('div')
          el.style.cssText = 'width:11px;height:11px;background:#008080;border:1.5px solid #fff;border-radius:50%;cursor:pointer;'
          el.onclick = (e) => { e.stopPropagation(); selectBrowseProperty(prop) }
          browseMarkersRef.current.push(new maplibregl.Marker({ element: el }).setLngLat([lng, lat]).addTo(map))
        }
        map.fitBounds(bounds, { padding: 60, duration: 1200 })
      }
    } catch (e) { setError(e instanceof Error ? e.message : 'Browse failed') }
    setBrowseLoading(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minPrice, maxPrice, borough, clearBrowseMarkers, clearMarkers])

  const selectBrowseProperty = (prop: Property) => {
    setSubject(prop); setSimilarSales([]); setError(''); setQuery(''); setSameNeighborhood(false)
    const lat = parseFloat(prop.latitude); const lng = parseFloat(prop.longitude)
    if (lat && lng && mapRef.current) {
      clearMarkers()
      mapRef.current.flyTo({ center: [lng, lat], zoom: 15, duration: 1000 })
      const el = document.createElement('div')
      el.style.cssText = 'width:18px;height:18px;background:#FFD700;border:2px solid #000;border-radius:50%;box-shadow:0 0 6px rgba(0,0,0,0.5);z-index:10;'
      markersRef.current.push(new maplibregl.Marker({ element: el }).setLngLat([lng, lat]).addTo(mapRef.current))
    }
  }

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) { setSearchResults([]); setShowDropdown(false); return }
    setSearching(true)
    try {
      const res = await fetch(`/api/comps?action=search&q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setSearchResults(data.results || []); setShowDropdown((data.results || []).length > 0)
    } catch { setSearchResults([]) }
    setSearching(false)
  }, [])

  const handleInputChange = (val: string) => {
    setQuery(val)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => doSearch(val), 350)
  }

  const selectProperty = (prop: Property) => {
    setSubject(prop); setSimilarSales([]); setShowDropdown(false); setQuery(prop.address || ''); setError(''); setSameNeighborhood(false)
    const lat = parseFloat(prop.latitude); const lng = parseFloat(prop.longitude)
    if (lat && lng && mapRef.current) {
      clearMarkers(); clearBrowseMarkers(); setBrowseResults([])
      mapRef.current.flyTo({ center: [lng, lat], zoom: 15, duration: 1500 })
      const el = document.createElement('div')
      el.style.cssText = 'width:18px;height:18px;background:#FFD700;border:2px solid #000;border-radius:50%;box-shadow:0 0 6px rgba(0,0,0,0.5);'
      markersRef.current.push(new maplibregl.Marker({ element: el }).setLngLat([lng, lat]).addTo(mapRef.current))
    }
  }

  const findSimilar = async () => {
    if (!subject || !subject.salePrice) return
    const price = parseFloat(subject.salePrice)
    if (!price || price <= 0) return
    setLoading(true); setError(''); setSimilarSales([])
    const simMin = Math.round(price * 0.9); const simMax = Math.round(price * 1.1)
    const boroughCode = sameNeighborhood ? (subject.bbl?.[0] || '0') : '0'
    try {
      const res = await fetch(`/api/comps?action=browse&min=${simMin}&max=${simMax}&borough=${boroughCode}`)
      const data = await res.json()
      if (data.error) { setError(data.error); setLoading(false); return }
      const results: Property[] = (data.results || []).filter((r: Property) => r.bbl !== subject.bbl)
      setSimilarSales(results); clearMarkers(); clearBrowseMarkers(); setBrowseResults([])
      const map = mapRef.current
      if (map) {
        const sLat = parseFloat(subject.latitude); const sLng = parseFloat(subject.longitude)
        const bounds = new maplibregl.LngLatBounds()
        if (sLat && sLng) {
          bounds.extend([sLng, sLat])
          const subEl = document.createElement('div')
          subEl.style.cssText = 'width:18px;height:18px;background:#FFD700;border:2px solid #000;border-radius:50%;box-shadow:0 0 6px rgba(0,0,0,0.5);z-index:10;'
          markersRef.current.push(new maplibregl.Marker({ element: subEl }).setLngLat([sLng, sLat]).addTo(map))
        }
        for (const sale of results) {
          const lat = parseFloat(sale.latitude); const lng = parseFloat(sale.longitude)
          if (!lat || !lng) continue
          bounds.extend([lng, lat])
          const el = document.createElement('div')
          el.style.cssText = 'width:11px;height:11px;background:#008080;border:1.5px solid #fff;border-radius:50%;cursor:pointer;'
          markersRef.current.push(
            new maplibregl.Marker({ element: el }).setLngLat([lng, lat])
              .setPopup(new maplibregl.Popup({ offset: 10, closeButton: false }).setHTML(
                `<div style="font-family:MS Sans Serif,Arial,sans-serif;font-size:11px"><b>${sale.address}</b><br/>${fmtMoney(sale.salePrice)}<br/>${sale.saleDate ? new Date(sale.saleDate).toLocaleDateString() : ''}</div>`
              )).addTo(map)
          )
        }
        if (results.length > 0) map.fitBounds(bounds, { padding: 80, duration: 1500 })
      }
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed to find similar sales') }
    setLoading(false)
  }

  const backToBrowse = () => {
    setSubject(null); setSimilarSales([]); setError(''); clearMarkers()
    if (browseResults.length > 0 && mapRef.current) {
      const bounds = new maplibregl.LngLatBounds()
      browseResults.forEach(r => { const lat = parseFloat(r.latitude); const lng = parseFloat(r.longitude); if (lat && lng) bounds.extend([lng, lat]) })
      mapRef.current.fitBounds(bounds, { padding: 60, duration: 1000 })
    }
  }

  const flyToSale = (sale: Property) => {
    const lat = parseFloat(sale.latitude); const lng = parseFloat(sale.longitude)
    if (lat && lng && mapRef.current) mapRef.current.flyTo({ center: [lng, lat], zoom: 17, duration: 1000 })
  }

  const hasSalePrice = subject && subject.salePrice && parseFloat(subject.salePrice) > 0

  // Shared styles
  const inset = '2px inset #808080'
  const outset = '2px outset #DFDFDF'

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%', width: '100%',
      background: '#C0C0C0', fontFamily: 'MS Sans Serif, Arial, sans-serif', fontSize: 12
    }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex', gap: 6, padding: '8px 8px', background: '#C0C0C0',
        borderBottom: '2px groove #DFDFDF', alignItems: 'center', flexWrap: 'wrap'
      }}>
        <span style={{ fontSize: 11, color: '#000', fontWeight: 'bold' }}>Price:</span>
        <input
          type="text" value={minPrice.toLocaleString()}
          onChange={e => { const v = parseInt(e.target.value.replace(/[^0-9]/g, '')); if (!isNaN(v)) setMinPrice(v) }}
          style={{ width: 82, padding: '4px 5px', fontSize: 12, fontFamily: 'inherit', border: inset, background: '#FFF', outline: 'none' }}
        />
        <span style={{ fontSize: 11, color: '#808080' }}>–</span>
        <input
          type="text" value={maxPrice.toLocaleString()}
          onChange={e => { const v = parseInt(e.target.value.replace(/[^0-9]/g, '')); if (!isNaN(v)) setMaxPrice(v) }}
          style={{ width: 82, padding: '4px 5px', fontSize: 12, fontFamily: 'inherit', border: inset, background: '#FFF', outline: 'none' }}
        />
        <select
          value={borough} onChange={e => setBorough(e.target.value)}
          style={{ padding: '4px 4px', fontSize: 12, fontFamily: 'inherit', border: inset, background: '#FFF', outline: 'none' }}
        >
          {BOROUGHS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
        </select>
        <button
          onClick={doBrowse} disabled={browseLoading}
          style={{
            padding: '5px 20px', fontSize: 12, fontWeight: 'bold', fontFamily: 'inherit',
            border: outset, background: '#008080', color: '#FFF',
            cursor: browseLoading ? 'wait' : 'pointer', letterSpacing: '0.02em',
          }}
        >
          {browseLoading ? 'Searching...' : 'Search Sales'}
        </button>
        <div style={{ width: 1, height: 20, background: '#808080', margin: '0 2px' }} />
        <div style={{ flex: 1, position: 'relative', minWidth: 120 }}>
          <input
            type="text" value={query}
            onChange={e => handleInputChange(e.target.value)}
            onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
            placeholder="or search address..."
            style={{ width: '100%', padding: '4px 5px', fontSize: 12, fontFamily: 'inherit', border: inset, background: '#FFF', outline: 'none', boxSizing: 'border-box', color: '#444' }}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); doSearch(query) } }}
          />
          {showDropdown && searchResults.length > 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1000,
              background: '#FFF', border: '1px solid #808080', maxHeight: 200, overflowY: 'auto',
              boxShadow: '2px 2px 4px rgba(0,0,0,0.3)'
            }}>
              {searchResults.map(r => (
                <div key={r.bbl} onClick={() => selectProperty(r)}
                  style={{ padding: '4px 8px', cursor: 'pointer', borderBottom: '1px solid #E0E0E0', fontSize: 11 }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#000080', e.currentTarget.style.color = '#FFF')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#FFF', e.currentTarget.style.color = '#000')}
                >
                  <b>{r.address}</b> — {r.borough} {r.zipcode ? `(${r.zipcode})` : ''} — Class {r.bldgclass || '?'}
                </div>
              ))}
            </div>
          )}
        </div>
        {searching && <span style={{ fontSize: 10, color: '#808080' }}>...</span>}
      </div>

      {/* Main content */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* Map */}
        <div style={{ flex: '0 0 60%', minHeight: 0, position: 'relative' }}>
          <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
          {browseResults.length > 0 && !subject && (
            <div style={{
              position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)',
              background: '#000080', color: '#FFF', padding: '4px 12px', fontSize: 11,
              fontWeight: 'bold', border: outset,
            }}>
              {browseResults.length} sales — click a dot to select
            </div>
          )}
        </div>

        {/* Right panel */}
        <div style={{
          flex: '0 0 40%', display: 'flex', flexDirection: 'column',
          borderLeft: '2px groove #DFDFDF', overflowY: 'auto', background: '#C0C0C0'
        }}>
          {/* Empty state */}
          {!hasResults && !browseLoading && !loading && (
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', padding: 24, textAlign: 'center'
            }}>
              <div style={{
                border: outset, background: '#C0C0C0', padding: 24, width: '85%'
              }}>
                <div style={{
                  background: '#000080', color: '#FFF', padding: '4px 8px',
                  fontWeight: 'bold', fontSize: 12, marginBottom: 12, textAlign: 'left'
                }}>
                  NYC Apartment Sales
                </div>
                <div style={{ fontSize: 12, color: '#000', lineHeight: 1.6, marginBottom: 16 }}>
                  Set a price range above, then press:
                </div>
                <button
                  onClick={doBrowse}
                  style={{
                    padding: '8px 28px', fontSize: 13, fontWeight: 'bold', fontFamily: 'inherit',
                    border: outset, background: '#008080', color: '#FFF',
                    cursor: 'pointer', width: '100%', marginBottom: 10,
                  }}
                >
                  Search Sales
                </button>
                <div style={{ fontSize: 11, color: '#808080' }}>
                  to see recent apartment sales on the map.
                </div>
              </div>
            </div>
          )}

          {/* Selected property card */}
          {subject && similarSales.length === 0 && !loading ? (
            <div style={{ padding: 8 }}>
              {browseResults.length > 0 && (
                <div onClick={backToBrowse}
                  style={{ cursor: 'pointer', fontSize: 11, color: '#000080', marginBottom: 6, textDecoration: 'underline' }}
                >
                  &larr; Back to results
                </div>
              )}
              <div style={{
                background: '#000080', color: '#FFF', padding: '4px 8px',
                fontWeight: 'bold', fontSize: 12, marginBottom: 1
              }}>
                SELECTED PROPERTY
              </div>
              <div style={{ background: '#DFDFDF', border: inset, padding: 10 }}>
                {/* Sale price big */}
                {subject.salePrice && parseFloat(subject.salePrice) > 0 && (
                  <div style={{ fontSize: 18, fontWeight: 'bold', color: '#008080', marginBottom: 2, letterSpacing: '-0.02em' }}>
                    {fmtMoney(subject.salePrice)}
                  </div>
                )}
                <div style={{ fontWeight: 'bold', fontSize: 13, color: '#000', marginBottom: 2 }}>
                  {subject.address}
                </div>
                <div style={{ fontSize: 11, color: '#444', marginBottom: 8 }}>
                  {subject.borough}{subject.zipcode ? ` ${subject.zipcode}` : ''}
                  {subject.saleDate ? ` — sold ${new Date(subject.saleDate).toLocaleDateString()}` : ''}
                </div>

                <table style={{ fontSize: 11, width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr><td style={tdLabel}>Class</td><td style={tdVal}>{subject.bldgclass || '—'}</td><td style={tdLabel}>Area</td><td style={tdVal}>{fmt(subject.bldgarea)} sf</td></tr>
                    <tr><td style={tdLabel}>Year</td><td style={tdVal}>{subject.yearbuilt || '—'}</td><td style={tdLabel}>Floors</td><td style={tdVal}>{subject.numfloors || '—'}</td></tr>
                    <tr><td style={tdLabel}>Units</td><td style={tdVal}>{subject.unitstotal || '—'}</td><td style={tdLabel}>Lot</td><td style={tdVal}>{fmt(subject.lotarea)} sf</td></tr>
                    <tr><td style={tdLabel}>Zoning</td><td style={tdVal}>{subject.zonedist1 || '—'}</td><td style={tdLabel}>Assessed</td><td style={tdVal}>{fmtMoney(subject.assesstot)}</td></tr>
                  </tbody>
                </table>

                {hasSalePrice ? (
                  <div style={{ marginTop: 10, borderTop: '1px solid #808080', paddingTop: 10 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, cursor: 'pointer', marginBottom: 8 }}>
                      <input type="checkbox" checked={sameNeighborhood} onChange={e => setSameNeighborhood(e.target.checked)} />
                      Same borough only ({subject.borough})
                    </label>
                    <button
                      onClick={findSimilar}
                      style={{
                        width: '100%', padding: '7px 12px', fontSize: 12, fontWeight: 'bold',
                        fontFamily: 'inherit', border: outset, background: '#008080', color: '#FFF',
                        cursor: 'pointer',
                      }}
                    >
                      Find Similar Sales (±10%)
                    </button>
                    <div style={{ fontSize: 10, color: '#808080', marginTop: 4, textAlign: 'center' }}>
                      {fmtMoney(Math.round(parseFloat(subject.salePrice!) * 0.9))} – {fmtMoney(Math.round(parseFloat(subject.salePrice!) * 1.1))}
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: 10, color: '#808080', marginTop: 8, fontStyle: 'italic' }}>
                    No sale price on record.
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {/* Error */}
          {error && (
            <div style={{ padding: 8, background: '#FFC0C0', color: '#800000', border: '1px solid #800000', margin: 8, fontSize: 11 }}>
              {error}
            </div>
          )}

          {/* Browse results list */}
          {browseResults.length > 0 && !subject && similarSales.length === 0 && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <div style={{
                background: '#008080', color: '#FFF', padding: '5px 8px',
                fontWeight: 'bold', fontSize: 12
              }}>
                RECENT SALES ({browseResults.length})
              </div>
              <div style={{ flex: 1, overflowY: 'auto', border: inset, background: '#FFF' }}>
                {browseResults.map((r, i) => (
                  <div
                    key={r.bbl}
                    onClick={() => selectBrowseProperty(r)}
                    style={{
                      padding: '6px 8px', cursor: 'pointer',
                      borderBottom: '1px solid #E0E0E0',
                      background: i % 2 === 0 ? '#FFF' : '#F0F4F4',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#000080', e.currentTarget.style.color = '#FFF')}
                    onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? '#FFF' : '#F0F4F4', e.currentTarget.style.color = '#000')}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 11, fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {r.address}
                      </div>
                      <div style={{ fontSize: 10, opacity: 0.7, marginTop: 1 }}>
                        {r.borough} &middot; {r.bldgclass || '—'} &middot; {fmt(r.bldgarea)} sf
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', marginLeft: 8, whiteSpace: 'nowrap' }}>
                      <div style={{ fontSize: 12, fontWeight: 'bold' }}>{fmtMoney(r.salePrice)}</div>
                      <div style={{ fontSize: 9, opacity: 0.6 }}>
                        {r.saleDate ? new Date(r.saleDate).toLocaleDateString() : ''}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ padding: 4, fontSize: 10, color: '#808080', textAlign: 'center', background: '#C0C0C0' }}>
                Click a sale to see details
              </div>
            </div>
          )}

          {/* Similar sales results */}
          {similarSales.length > 0 && subject && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <div style={{ background: '#000080', color: '#FFF', padding: '5px 8px', fontWeight: 'bold', fontSize: 11 }}>
                {subject.address} — {fmtMoney(subject.salePrice)}
              </div>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '4px 8px', background: '#C0C0C0', borderBottom: '1px solid #808080'
              }}>
                <span onClick={() => { setSimilarSales([]); clearMarkers(); selectBrowseProperty(subject) }}
                  style={{ cursor: 'pointer', fontSize: 11, color: '#000080', textDecoration: 'underline' }}
                >
                  &larr; Back
                </span>
              </div>
              <div style={{
                background: '#008080', color: '#FFF', padding: '5px 8px',
                fontWeight: 'bold', fontSize: 12
              }}>
                SIMILAR SALES ({similarSales.length})
              </div>
              <div style={{ flex: 1, overflowY: 'auto', border: inset, background: '#FFF' }}>
                {similarSales.map((s, i) => (
                  <div
                    key={s.bbl}
                    onClick={() => flyToSale(s)}
                    style={{
                      padding: '6px 8px', cursor: 'pointer',
                      borderBottom: '1px solid #E0E0E0',
                      background: i % 2 === 0 ? '#FFF' : '#F0F4F4',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#000080', e.currentTarget.style.color = '#FFF')}
                    onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? '#FFF' : '#F0F4F4', e.currentTarget.style.color = '#000')}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 11, fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {s.address}
                      </div>
                      <div style={{ fontSize: 10, opacity: 0.7, marginTop: 1 }}>
                        {s.borough} &middot; {s.bldgclass || '—'} &middot; {fmt(s.bldgarea)} sf
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', marginLeft: 8, whiteSpace: 'nowrap' }}>
                      <div style={{ fontSize: 12, fontWeight: 'bold' }}>{fmtMoney(s.salePrice)}</div>
                      <div style={{ fontSize: 9, opacity: 0.6 }}>
                        {s.saleDate ? new Date(s.saleDate).toLocaleDateString() : ''}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ padding: 4, fontSize: 10, color: '#808080', textAlign: 'center', background: '#C0C0C0' }}>
                Click a row to fly to that property
              </div>
            </div>
          )}

          {(loading || browseLoading) && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000080', fontWeight: 'bold' }}>
              {loading ? 'Finding similar sales...' : 'Searching recent sales...'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const tdLabel: React.CSSProperties = {
  padding: '2px 4px', fontWeight: 'bold', color: '#008080', width: '20%', verticalAlign: 'top', fontSize: 10
}
const tdVal: React.CSSProperties = {
  padding: '2px 4px', color: '#000', width: '30%', fontSize: 11
}
