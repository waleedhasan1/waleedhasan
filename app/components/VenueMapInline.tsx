'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import venuesData from '../chicago-venues.json'
import showsData from '../chicago-venue-shows.json'

interface Venue {
  id: number
  name: string
  address: string
  neighborhood: string
  lat: number
  lng: number
  genre: string
  capacity: number
  website: string
  description: string
}

const GENRES: Record<string, { label: string; color: string }> = {
  rock:       { label: 'Rock / Indie',          color: '#DC143C' },
  jazz:       { label: 'Jazz / Blues',           color: '#DAA520' },
  electronic: { label: 'Electronic / DJ',        color: '#8B00FF' },
  hiphop:     { label: 'Hip-Hop / R&B',         color: '#FF6600' },
  classical:  { label: 'Classical',              color: '#006666' },
  country:    { label: 'Country',                color: '#8B4513' },
  punk:       { label: 'Punk / Metal',           color: '#FF1493' },
  multi:      { label: 'Multi-Genre / Major',    color: '#000080' },
  latin:      { label: 'Latin / World',          color: '#32CD32' },
  comedy:     { label: 'Comedy / Spoken Word',   color: '#708090' },
}

interface Show {
  artist: string
  date: string
  time: string
  price: string
  soldOut: boolean
}

const venues: Venue[] = venuesData as Venue[]
const showsByVenue: Record<string, Show[]> = showsData as Record<string, Show[]>

export default function VenueMapInline() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<maplibregl.Marker[]>([])

  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null)
  const [activeGenres, setActiveGenres] = useState<Set<string>>(() => new Set(Object.keys(GENRES)))
  const [searchQuery, setSearchQuery] = useState('')
  const [neighborhoodFilter, setNeighborhoodFilter] = useState('All')
  const [view, setView] = useState<'list' | 'detail'>('list')

  const neighborhoods = useMemo(() => {
    const set = new Set(venues.map(v => v.neighborhood))
    return ['All', ...Array.from(set).sort()]
  }, [])

  const filteredVenues = useMemo(() => {
    return venues.filter(v => {
      if (!activeGenres.has(v.genre)) return false
      if (neighborhoodFilter !== 'All' && v.neighborhood !== neighborhoodFilter) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        if (!v.name.toLowerCase().includes(q) && !v.neighborhood.toLowerCase().includes(q) && !v.address.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [activeGenres, neighborhoodFilter, searchQuery])

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

    // Load neighborhood boundaries
    map.on('load', () => {
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
    })

    mapRef.current = map
    return () => { map.remove(); mapRef.current = null }
  }, [])

  // Update markers when filters change
  const updateMarkers = useCallback(() => {
    const map = mapRef.current
    if (!map) return
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    for (const v of filteredVenues) {
      const isSelected = selectedVenue?.id === v.id
      const el = document.createElement('div')
      const size = isSelected ? 18 : 13
      const color = isSelected ? '#FFD700' : (GENRES[v.genre]?.color || '#808080')
      const border = isSelected ? '2px solid #000' : '2px solid #FFF'
      el.style.cssText = `width:${size}px;height:${size}px;background:${color};border:${border};border-radius:50%;cursor:pointer;transition:all 0.15s;`
      if (isSelected) el.style.boxShadow = '0 0 8px rgba(0,0,0,0.5)'
      el.style.zIndex = isSelected ? '10' : '1'
      el.addEventListener('click', (e) => {
        e.stopPropagation()
        setSelectedVenue(v)
        setView('detail')
        map.flyTo({ center: [v.lng, v.lat], zoom: 14, duration: 1000 })
      })
      markersRef.current.push(
        new maplibregl.Marker({ element: el, anchor: 'center' }).setLngLat([v.lng, v.lat]).addTo(map)
      )
    }
  }, [filteredVenues, selectedVenue])

  useEffect(() => {
    updateMarkers()
  }, [updateMarkers])

  const selectVenue = (v: Venue) => {
    setSelectedVenue(v)
    setView('detail')
    if (mapRef.current) {
      mapRef.current.flyTo({ center: [v.lng, v.lat], zoom: 14, duration: 1000 })
    }
  }

  const backToList = () => {
    setSelectedVenue(null)
    setView('list')
    if (mapRef.current) {
      mapRef.current.flyTo({ center: [-87.6298, 41.8781], zoom: 11, duration: 1000 })
    }
  }

  const toggleGenre = (genre: string) => {
    setActiveGenres(prev => {
      const next = new Set(prev)
      if (next.has(genre)) next.delete(genre)
      else next.add(genre)
      return next
    })
  }

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
          placeholder="Search venues..."
          style={{
            width: 140, padding: '4px 5px', fontSize: 12, fontFamily: 'inherit',
            border: inset, background: '#FFF', outline: 'none'
          }}
        />
        <div style={{ width: 1, height: 20, background: '#808080', margin: '0 2px' }} />
        {Object.entries(GENRES).map(([key, { label, color }]) => {
          const active = activeGenres.has(key)
          return (
            <button
              key={key}
              onClick={() => toggleGenre(key)}
              title={label}
              style={{
                display: 'flex', alignItems: 'center', gap: 3,
                padding: '3px 6px', fontSize: 10, fontFamily: 'inherit',
                border: active ? outset : '2px outset #A0A0A0',
                background: active ? '#C0C0C0' : '#A0A0A0',
                cursor: 'pointer', opacity: active ? 1 : 0.5,
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{
                display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
                background: active ? color : '#888', border: '1px solid #666',
                flexShrink: 0,
              }} />
              <span style={{ color: active ? '#000' : '#666' }}>{label.split(' / ')[0]}</span>
            </button>
          )
        })}
        <div style={{ width: 1, height: 20, background: '#808080', margin: '0 2px' }} />
        <select
          value={neighborhoodFilter}
          onChange={e => setNeighborhoodFilter(e.target.value)}
          style={{
            padding: '4px 4px', fontSize: 11, fontFamily: 'inherit',
            border: inset, background: '#FFF', outline: 'none', maxWidth: 150
          }}
        >
          {neighborhoods.map(n => (
            <option key={n} value={n}>{n === 'All' ? 'All Neighborhoods' : n}</option>
          ))}
        </select>
      </div>

      {/* Main content */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* Map */}
        <div style={{ flex: '0 0 60%', minHeight: 0, position: 'relative' }}>
          <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
          <div style={{
            position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)',
            background: '#000080', color: '#FFF', padding: '4px 12px', fontSize: 11,
            fontWeight: 'bold', border: outset,
          }}>
            {filteredVenues.length} venue{filteredVenues.length !== 1 ? 's' : ''} — click a dot to view
          </div>
        </div>

        {/* Right panel */}
        <div style={{
          flex: '0 0 40%', display: 'flex', flexDirection: 'column',
          borderLeft: '2px groove #DFDFDF', overflowY: 'auto', background: '#C0C0C0'
        }}>
          {/* Detail view */}
          {view === 'detail' && selectedVenue ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <div style={{ padding: '8px 8px 0 8px' }}>
                <div
                  onClick={backToList}
                  style={{ cursor: 'pointer', fontSize: 11, color: '#000080', marginBottom: 6, textDecoration: 'underline' }}
                >
                  &larr; Back to list
                </div>
                <div style={{
                  background: '#000080', color: '#FFF', padding: '4px 8px',
                  fontWeight: 'bold', fontSize: 12, marginBottom: 1
                }}>
                  VENUE DETAILS
                </div>
                <div style={{ background: '#DFDFDF', border: inset, padding: 10 }}>
                  {/* Street View image */}
                  {process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY && (
                    <div style={{ marginBottom: 8, border: '2px inset #808080', lineHeight: 0 }}>
                      <img
                        src={`https://maps.googleapis.com/maps/api/streetview?size=400x180&location=${encodeURIComponent(selectedVenue.address + ', Chicago, IL')}&fov=90&pitch=5&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}`}
                        alt={`Street view of ${selectedVenue.name}`}
                        style={{ width: '100%', height: 'auto', display: 'block' }}
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                      />
                    </div>
                  )}
                  <div style={{ fontSize: 18, fontWeight: 'bold', color: '#000', marginBottom: 4, letterSpacing: '-0.02em' }}>
                    {selectedVenue.name}
                  </div>
                  <div style={{ fontSize: 11, color: '#444', marginBottom: 2 }}>
                    {selectedVenue.address}
                  </div>
                  <div style={{ fontSize: 11, color: '#666', marginBottom: 8 }}>
                    {selectedVenue.neighborhood}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <span style={{
                      display: 'inline-block', width: 10, height: 10, borderRadius: '50%',
                      background: GENRES[selectedVenue.genre]?.color || '#808080',
                      border: '1px solid #666'
                    }} />
                    <span style={{ fontSize: 11, fontWeight: 'bold', color: '#008080' }}>
                      {GENRES[selectedVenue.genre]?.label || selectedVenue.genre}
                    </span>
                    <span style={{ fontSize: 10, color: '#666', marginLeft: 'auto' }}>
                      Cap: {selectedVenue.capacity.toLocaleString()}
                    </span>
                  </div>

                  <div style={{ fontSize: 11, color: '#333', lineHeight: 1.6, marginBottom: 10 }}>
                    {selectedVenue.description}
                  </div>

                  <a
                    href={selectedVenue.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'block', textAlign: 'center', padding: '6px 12px',
                      fontSize: 12, fontWeight: 'bold', fontFamily: 'inherit',
                      border: outset, background: '#008080', color: '#FFF',
                      cursor: 'pointer', textDecoration: 'none',
                    }}
                  >
                    Visit Website
                  </a>
                </div>
              </div>

              {/* Upcoming Shows */}
              {(() => {
                const shows = showsByVenue[String(selectedVenue.id)] || []
                return shows.length > 0 ? (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, padding: '0 8px 8px 8px' }}>
                    <div style={{
                      background: '#008080', color: '#FFF', padding: '5px 8px',
                      fontWeight: 'bold', fontSize: 12, marginTop: 8
                    }}>
                      UPCOMING SHOWS ({shows.length})
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto', border: inset, background: '#FFF' }}>
                      {shows.map((show, i) => (
                        <div
                          key={i}
                          style={{
                            padding: '6px 8px',
                            borderBottom: '1px solid #E0E0E0',
                            background: i % 2 === 0 ? '#FFF' : '#F0F4F4',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          }}
                        >
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontSize: 11, fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {show.artist}
                            </div>
                            <div style={{ fontSize: 10, color: '#666', marginTop: 1 }}>
                              {new Date(show.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} &middot; {show.time}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', marginLeft: 8, whiteSpace: 'nowrap' }}>
                            <div style={{ fontSize: 11, fontWeight: 'bold', color: show.soldOut ? '#999' : '#008080' }}>
                              {show.price}
                            </div>
                            {show.soldOut && (
                              <div style={{
                                fontSize: 9, color: '#FFF', background: '#CC0000',
                                padding: '1px 4px', fontWeight: 'bold', marginTop: 1,
                                textAlign: 'center'
                              }}>
                                SOLD OUT
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '8px 8px', fontSize: 11, color: '#808080', fontStyle: 'italic' }}>
                    No upcoming shows listed.
                  </div>
                )
              })()}
            </div>
          ) : (
            <>
              {/* Empty state / legend when no search active */}
              {filteredVenues.length === 0 ? (
                <div style={{
                  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', padding: 24, textAlign: 'center'
                }}>
                  <div style={{ border: outset, background: '#C0C0C0', padding: 24, width: '85%' }}>
                    <div style={{
                      background: '#000080', color: '#FFF', padding: '4px 8px',
                      fontWeight: 'bold', fontSize: 12, marginBottom: 12, textAlign: 'left'
                    }}>
                      No Venues Found
                    </div>
                    <div style={{ fontSize: 12, color: '#000', lineHeight: 1.6 }}>
                      Try adjusting your filters or search query.
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                  {/* Legend header */}
                  <div style={{
                    background: '#000080', color: '#FFF', padding: '5px 8px',
                    fontWeight: 'bold', fontSize: 12
                  }}>
                    CHICAGO MUSIC VENUES
                  </div>
                  {/* Genre legend */}
                  <div style={{
                    padding: '6px 8px', background: '#DFDFDF', borderBottom: '1px solid #808080',
                    display: 'flex', flexWrap: 'wrap', gap: 6
                  }}>
                    {Object.entries(GENRES).map(([key, { label, color }]) => (
                      <span key={key} style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10 }}>
                        <span style={{
                          display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
                          background: color, border: '1px solid #666'
                        }} />
                        {label.split(' / ')[0]}
                      </span>
                    ))}
                  </div>
                  {/* Venue count */}
                  <div style={{
                    background: '#008080', color: '#FFF', padding: '5px 8px',
                    fontWeight: 'bold', fontSize: 12
                  }}>
                    VENUES ({filteredVenues.length})
                  </div>
                  {/* Venue list */}
                  <div style={{ flex: 1, overflowY: 'auto', border: inset, background: '#FFF' }}>
                    {filteredVenues.map((v, i) => (
                      <div
                        key={v.id}
                        onClick={() => selectVenue(v)}
                        style={{
                          padding: '6px 8px', cursor: 'pointer',
                          borderBottom: '1px solid #E0E0E0',
                          background: i % 2 === 0 ? '#FFF' : '#F0F4F4',
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#000080'; e.currentTarget.style.color = '#FFF' }}
                        onMouseLeave={e => { e.currentTarget.style.background = i % 2 === 0 ? '#FFF' : '#F0F4F4'; e.currentTarget.style.color = '#000' }}
                      >
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <span style={{
                              display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
                              background: GENRES[v.genre]?.color || '#808080',
                              border: '1px solid #666', flexShrink: 0
                            }} />
                            <span style={{ fontSize: 11, fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {v.name}
                            </span>
                          </div>
                          <div style={{ fontSize: 10, opacity: 0.7, marginTop: 1, paddingLeft: 13 }}>
                            {v.neighborhood} &middot; {GENRES[v.genre]?.label.split(' / ')[0] || v.genre}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', marginLeft: 8, whiteSpace: 'nowrap' }}>
                          <div style={{ fontSize: 11, fontWeight: 'bold' }}>{v.capacity.toLocaleString()}</div>
                          <div style={{ fontSize: 9, opacity: 0.6 }}>capacity</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: 4, fontSize: 10, color: '#808080', textAlign: 'center', background: '#C0C0C0' }}>
                    Click a venue to see details
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const tdLabel: React.CSSProperties = {
  padding: '2px 4px', fontWeight: 'bold', color: '#008080', width: '30%', verticalAlign: 'top', fontSize: 10
}
const tdVal: React.CSSProperties = {
  padding: '2px 4px', color: '#000', width: '70%', fontSize: 11
}
