'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import storesData from '../jewel-osco-stores.json'

interface Store {
  id: number
  name: string
  address: string
  neighborhood: string
  lat: number
  lng: number
  regular: number
  cageFree: number
  organic: number
  milkWhole: number
  milkTwoPercent: number
  milkOat: number
  lastUpdated: string
}

type Category = 'eggs' | 'milk'
type PriceKey = 'regular' | 'cageFree' | 'organic' | 'milkWhole' | 'milkTwoPercent' | 'milkOat'

const SUBTYPES: Record<Category, { key: PriceKey; label: string; shortLabel: string }[]> = {
  eggs: [
    { key: 'regular', label: 'Regular (1 doz)', shortLabel: 'Regular' },
    { key: 'cageFree', label: 'Cage-Free (1 doz)', shortLabel: 'Cage-Free' },
    { key: 'organic', label: 'Organic (1 doz)', shortLabel: 'Organic' },
  ],
  milk: [
    { key: 'milkWhole', label: 'Whole Milk (1 gal)', shortLabel: 'Whole' },
    { key: 'milkTwoPercent', label: '2% Milk (1 gal)', shortLabel: '2%' },
    { key: 'milkOat', label: 'Oat Milk (½ gal)', shortLabel: 'Oat' },
  ],
}

const stores: Store[] = storesData as Store[]

function priceColor(price: number, min: number, max: number): string {
  const range = max - min || 1
  const t = (price - min) / range
  if (t < 0.25) return '#228B22'
  if (t < 0.5) return '#DAA520'
  if (t < 0.75) return '#FF8C00'
  return '#DC143C'
}

function priceLabel(t: number): string {
  if (t < 0.25) return 'Low'
  if (t < 0.5) return 'Below Avg'
  if (t < 0.75) return 'Above Avg'
  return 'High'
}

export default function EggPriceMapInline() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<maplibregl.Marker[]>([])

  const [selectedStore, setSelectedStore] = useState<Store | null>(null)
  const [category, setCategory] = useState<Category>('eggs')
  const [subtype, setSubtype] = useState<PriceKey>('regular')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'price' | 'name'>('price')
  const [view, setView] = useState<'list' | 'detail'>('list')

  const currentSubtypes = SUBTYPES[category]
  const currentLabel = currentSubtypes.find(s => s.key === subtype)?.label || ''

  const switchCategory = (cat: Category) => {
    setCategory(cat)
    setSubtype(SUBTYPES[cat][0].key)
  }

  const filteredStores = useMemo(() => {
    let result = stores.filter(s => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        if (!s.name.toLowerCase().includes(q) && !s.neighborhood.toLowerCase().includes(q) && !s.address.toLowerCase().includes(q)) return false
      }
      return true
    })
    if (sortBy === 'price') {
      result = [...result].sort((a, b) => a[subtype] - b[subtype])
    } else {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name))
    }
    return result
  }, [searchQuery, sortBy, subtype])

  const priceRange = useMemo(() => {
    const prices = stores.map(s => s[subtype])
    return { min: Math.min(...prices), max: Math.max(...prices), avg: prices.reduce((a, b) => a + b, 0) / prices.length }
  }, [subtype])

  // Init map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return
    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      center: [-87.75, 41.85],
      zoom: 9.5,
    })
    map.addControl(new maplibregl.NavigationControl(), 'top-left')
    mapRef.current = map
    return () => { map.remove(); mapRef.current = null }
  }, [])

  const updateMarkers = useCallback(() => {
    const map = mapRef.current
    if (!map) return
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    for (const s of filteredStores) {
      const isSelected = selectedStore?.id === s.id
      const price = s[subtype]
      const color = isSelected ? '#FFD700' : priceColor(price, priceRange.min, priceRange.max)
      const size = isSelected ? 20 : 14
      const border = isSelected ? '2px solid #000' : '2px solid #FFF'

      const el = document.createElement('div')
      el.style.cssText = `display:flex;align-items:center;justify-content:center;padding:3px 6px;background:#FFF;border:${border};border-radius:4px;cursor:pointer;white-space:nowrap;font-family:MS Sans Serif,Arial,sans-serif;font-size:${isSelected ? 15 : 13}px;font-weight:bold;color:${color};box-shadow:0 1px 4px rgba(0,0,0,0.35);letter-spacing:-0.3px;`
      if (isSelected) el.style.boxShadow = '0 0 8px rgba(0,0,0,0.5)'
      el.style.zIndex = isSelected ? '10' : '1'
      el.textContent = `$${price.toFixed(2)}`
      el.title = s.name

      el.addEventListener('click', (e) => {
        e.stopPropagation()
        setSelectedStore(s)
        setView('detail')
        map.flyTo({ center: [s.lng, s.lat], zoom: 14, duration: 1000 })
      })
      markersRef.current.push(
        new maplibregl.Marker({ element: el, anchor: 'center' }).setLngLat([s.lng, s.lat]).addTo(map)
      )
    }
  }, [filteredStores, selectedStore, subtype, priceRange])

  useEffect(() => {
    updateMarkers()
  }, [updateMarkers])

  const selectStore = (s: Store) => {
    setSelectedStore(s)
    setView('detail')
    if (mapRef.current) {
      mapRef.current.flyTo({ center: [s.lng, s.lat], zoom: 14, duration: 1000 })
    }
  }

  const backToList = () => {
    setSelectedStore(null)
    setView('list')
    if (mapRef.current) {
      mapRef.current.flyTo({ center: [-87.75, 41.85], zoom: 9.5, duration: 1000 })
    }
  }

  const inset = '2px inset #808080'
  const outset = '2px outset #DFDFDF'

  const cheapest = filteredStores.length > 0 ? filteredStores.reduce((a, b) => a[subtype] < b[subtype] ? a : b) : null
  const priciest = filteredStores.length > 0 ? filteredStores.reduce((a, b) => a[subtype] > b[subtype] ? a : b) : null

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%', width: '100%',
      background: '#C0C0C0', fontFamily: 'MS Sans Serif, Arial, sans-serif', fontSize: 12
    }}>
      {/* Category tabs */}
      <div style={{ display: 'flex', background: '#C0C0C0', borderBottom: '2px groove #DFDFDF' }}>
        {([['eggs', 'Eggs'], ['milk', 'Milk']] as [Category, string][]).map(([cat, label]) => (
          <button
            key={cat}
            onClick={() => switchCategory(cat)}
            style={{
              flex: 1, padding: '8px 0', fontSize: 13, fontFamily: 'inherit', fontWeight: 'bold',
              border: 'none', cursor: 'pointer',
              background: category === cat ? '#DFDFDF' : '#A0A0A0',
              color: category === cat ? '#008080' : '#666',
              borderBottom: category === cat ? '3px solid #008080' : '3px solid transparent',
              letterSpacing: '0.5px',
            }}
          >
            {cat === 'eggs' ? '\uD83E\uDD5A' : '\uD83E\uDD5B'} {label}
          </button>
        ))}
      </div>
      {/* Toolbar */}
      <div style={{
        display: 'flex', gap: 6, padding: '6px 8px', background: '#C0C0C0',
        borderBottom: '2px groove #DFDFDF', alignItems: 'center', flexWrap: 'wrap'
      }}>
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search stores..."
          style={{
            width: 140, padding: '4px 5px', fontSize: 12, fontFamily: 'inherit',
            border: inset, background: '#FFF', outline: 'none'
          }}
        />
        <div style={{ width: 1, height: 20, background: '#808080', margin: '0 2px' }} />
        {currentSubtypes.map(({ key, shortLabel }) => (
          <button
            key={key}
            onClick={() => setSubtype(key)}
            style={{
              padding: '3px 8px', fontSize: 11, fontFamily: 'inherit',
              border: subtype === key ? '2px inset #808080' : outset,
              background: subtype === key ? '#DFDFDF' : '#C0C0C0',
              cursor: 'pointer', fontWeight: subtype === key ? 'bold' : 'normal',
              color: subtype === key ? '#008080' : '#000',
            }}
          >
            {shortLabel}
          </button>
        ))}
        <div style={{ width: 1, height: 20, background: '#808080', margin: '0 2px' }} />
        <span style={{ fontSize: 11, fontWeight: 'bold', color: '#000' }}>Sort:</span>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as 'price' | 'name')}
          style={{
            padding: '3px 4px', fontSize: 11, fontFamily: 'inherit',
            border: inset, background: '#FFF', outline: 'none'
          }}
        >
          <option value="price">Price (Low → High)</option>
          <option value="name">Name (A → Z)</option>
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
            background: '#C0C0C0', border: outset, padding: '6px 10px', fontSize: 10,
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: 4, color: '#000' }}>{currentLabel}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { color: '#228B22', label: `$${priceRange.min.toFixed(2)}` },
                { color: '#DAA520', label: '' },
                { color: '#FF8C00', label: '' },
                { color: '#DC143C', label: `$${priceRange.max.toFixed(2)}` },
              ].map((item, i) => (
                <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <span style={{
                    display: 'inline-block', width: 10, height: 10, borderRadius: '50%',
                    background: item.color, border: '1px solid #666'
                  }} />
                  {item.label && <span>{item.label}</span>}
                </span>
              ))}
            </div>
          </div>
          {/* Stats bar */}
          <div style={{
            position: 'absolute', bottom: 10, right: 10,
            background: '#000080', color: '#FFF', padding: '4px 10px', fontSize: 10,
            fontWeight: 'bold', border: outset,
          }}>
            Avg: ${priceRange.avg.toFixed(2)} &middot; {filteredStores.length} stores
          </div>
        </div>

        {/* Right panel */}
        <div style={{
          flex: '0 0 40%', display: 'flex', flexDirection: 'column',
          borderLeft: '2px groove #DFDFDF', overflowY: 'auto', background: '#C0C0C0'
        }}>
          {/* Detail view */}
          {view === 'detail' && selectedStore ? (
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
                  STORE DETAILS
                </div>
                <div style={{ background: '#DFDFDF', border: inset, padding: 10 }}>
                  {/* Street View */}
                  {process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY && (
                    <div style={{ marginBottom: 8, border: '2px inset #808080', lineHeight: 0 }}>
                      <img
                        src={`https://maps.googleapis.com/maps/api/streetview?size=400x180&location=${encodeURIComponent(selectedStore.address + ', Chicago, IL')}&fov=90&pitch=5&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}`}
                        alt={`Street view of ${selectedStore.name}`}
                        style={{ width: '100%', height: 'auto', display: 'block' }}
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                      />
                    </div>
                  )}
                  <div style={{ fontSize: 16, fontWeight: 'bold', color: '#000', marginBottom: 4 }}>
                    {selectedStore.name}
                  </div>
                  <div style={{ fontSize: 11, color: '#444', marginBottom: 2 }}>
                    {selectedStore.address}
                  </div>
                  <div style={{ fontSize: 11, color: '#666', marginBottom: 10 }}>
                    {selectedStore.neighborhood}
                  </div>

                  {/* Price comparison table */}
                  <div style={{
                    background: '#000080', color: '#FFF', padding: '4px 8px',
                    fontWeight: 'bold', fontSize: 11, marginBottom: 1
                  }}>
                    {category === 'eggs' ? 'EGG PRICES (1 DOZEN)' : 'MILK PRICES (PER UNIT)'}
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, background: '#FFF', border: '1px solid #808080' }}>
                    <tbody>
                      {currentSubtypes.map(({ key, shortLabel }) => {
                        const price = selectedStore[key]
                        const range = { min: Math.min(...stores.map(s => s[key])), max: Math.max(...stores.map(s => s[key])) }
                        const t = (price - range.min) / (range.max - range.min || 1)
                        const color = priceColor(price, range.min, range.max)
                        return (
                          <tr key={key} style={{ borderBottom: '1px solid #E0E0E0', background: subtype === key ? '#F0F4F4' : '#FFF' }}>
                            <td style={{ padding: '6px 8px', fontWeight: 'bold', color: '#008080', fontSize: 11 }}>
                              {shortLabel}
                            </td>
                            <td style={{ padding: '6px 8px', fontWeight: 'bold', fontSize: 14, color }}>
                              ${price.toFixed(2)}
                            </td>
                            <td style={{ padding: '6px 8px', fontSize: 10, color: '#666' }}>
                              {priceLabel(t)}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>

                  {/* Rank info */}
                  <div style={{ marginTop: 10, padding: '6px 8px', background: '#F0F4F4', border: '1px solid #CCC', fontSize: 11 }}>
                    {(() => {
                      const sorted = [...stores].sort((a, b) => a[subtype] - b[subtype])
                      const rank = sorted.findIndex(s => s.id === selectedStore.id) + 1
                      return (
                        <>
                          <span style={{ fontWeight: 'bold', color: '#008080' }}>
                            #{rank}
                          </span> of {stores.length} stores for {currentLabel.toLowerCase()}
                          <span style={{ color: '#666' }}> &middot; Updated {selectedStore.lastUpdated}</span>
                        </>
                      )
                    })()}
                  </div>
                </div>
              </div>

              {/* Nearby comparison */}
              <div style={{ padding: '0 8px 8px 8px', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <div style={{
                  background: '#008080', color: '#FFF', padding: '5px 8px',
                  fontWeight: 'bold', fontSize: 12, marginTop: 8
                }}>
                  ALL STORES BY PRICE
                </div>
                <div style={{ flex: 1, overflowY: 'auto', border: inset, background: '#FFF' }}>
                  {[...stores].sort((a, b) => a[subtype] - b[subtype]).map((s, i) => {
                    const isCurrent = s.id === selectedStore.id
                    return (
                      <div
                        key={s.id}
                        onClick={() => selectStore(s)}
                        style={{
                          padding: '5px 8px', cursor: 'pointer',
                          borderBottom: '1px solid #E0E0E0',
                          background: isCurrent ? '#000080' : (i % 2 === 0 ? '#FFF' : '#F0F4F4'),
                          color: isCurrent ? '#FFF' : '#000',
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        }}
                        onMouseEnter={e => { if (!isCurrent) { e.currentTarget.style.background = '#000080'; e.currentTarget.style.color = '#FFF' } }}
                        onMouseLeave={e => { if (!isCurrent) { e.currentTarget.style.background = i % 2 === 0 ? '#FFF' : '#F0F4F4'; e.currentTarget.style.color = '#000' } }}
                      >
                        <div style={{ fontSize: 10 }}>
                          <span style={{ fontWeight: 'bold', marginRight: 4 }}>#{i + 1}</span>
                          {s.neighborhood}
                        </div>
                        <div style={{ fontWeight: 'bold', fontSize: 11, color: isCurrent ? '#FFD700' : priceColor(s[subtype], priceRange.min, priceRange.max) }}>
                          ${s[subtype].toFixed(2)}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ) : (
            <>
              {filteredStores.length === 0 ? (
                <div style={{
                  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', padding: 24, textAlign: 'center'
                }}>
                  <div style={{ border: outset, background: '#C0C0C0', padding: 24, width: '85%' }}>
                    <div style={{
                      background: '#000080', color: '#FFF', padding: '4px 8px',
                      fontWeight: 'bold', fontSize: 12, marginBottom: 12, textAlign: 'left'
                    }}>
                      No Stores Found
                    </div>
                    <div style={{ fontSize: 12, color: '#000', lineHeight: 1.6 }}>
                      Try adjusting your search query.
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                  <div style={{
                    background: '#000080', color: '#FFF', padding: '5px 8px',
                    fontWeight: 'bold', fontSize: 12
                  }}>
                    JEWEL-OSCO {category === 'eggs' ? 'EGG' : 'MILK'} PRICES
                  </div>
                  {/* Quick stats */}
                  <div style={{
                    padding: '8px', background: '#DFDFDF', borderBottom: '1px solid #808080',
                    display: 'flex', gap: 8, justifyContent: 'space-around'
                  }}>
                    {cheapest && (
                      <div
                        onClick={() => selectStore(cheapest)}
                        style={{ textAlign: 'center', cursor: 'pointer', flex: 1, padding: '4px', border: outset, background: '#C0C0C0' }}
                      >
                        <div style={{ fontSize: 9, color: '#666', textTransform: 'uppercase', fontWeight: 'bold' }}>Cheapest</div>
                        <div style={{ fontSize: 16, fontWeight: 'bold', color: '#228B22' }}>${cheapest[subtype].toFixed(2)}</div>
                        <div style={{ fontSize: 9, color: '#444' }}>{cheapest.neighborhood}</div>
                      </div>
                    )}
                    <div style={{ textAlign: 'center', flex: 1, padding: '4px', border: outset, background: '#C0C0C0' }}>
                      <div style={{ fontSize: 9, color: '#666', textTransform: 'uppercase', fontWeight: 'bold' }}>Average</div>
                      <div style={{ fontSize: 16, fontWeight: 'bold', color: '#DAA520' }}>${priceRange.avg.toFixed(2)}</div>
                      <div style={{ fontSize: 9, color: '#444' }}>{stores.length} stores</div>
                    </div>
                    {priciest && (
                      <div
                        onClick={() => selectStore(priciest)}
                        style={{ textAlign: 'center', cursor: 'pointer', flex: 1, padding: '4px', border: outset, background: '#C0C0C0' }}
                      >
                        <div style={{ fontSize: 9, color: '#666', textTransform: 'uppercase', fontWeight: 'bold' }}>Priciest</div>
                        <div style={{ fontSize: 16, fontWeight: 'bold', color: '#DC143C' }}>${priciest[subtype].toFixed(2)}</div>
                        <div style={{ fontSize: 9, color: '#444' }}>{priciest.neighborhood}</div>
                      </div>
                    )}
                  </div>
                  {/* Store count */}
                  <div style={{
                    background: '#008080', color: '#FFF', padding: '5px 8px',
                    fontWeight: 'bold', fontSize: 12
                  }}>
                    {currentLabel.toUpperCase()} — {filteredStores.length} STORES
                  </div>
                  {/* Store list */}
                  <div style={{ flex: 1, overflowY: 'auto', border: inset, background: '#FFF' }}>
                    {filteredStores.map((s, i) => {
                      const price = s[subtype]
                      const color = priceColor(price, priceRange.min, priceRange.max)
                      return (
                        <div
                          key={s.id}
                          onClick={() => selectStore(s)}
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
                                display: 'inline-block', width: 10, height: 10, borderRadius: '50%',
                                background: color, border: '1px solid #666', flexShrink: 0
                              }} />
                              <span style={{ fontSize: 11, fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {s.neighborhood}
                              </span>
                            </div>
                            <div style={{ fontSize: 10, opacity: 0.7, marginTop: 1, paddingLeft: 15 }}>
                              {s.address}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', marginLeft: 8, whiteSpace: 'nowrap' }}>
                            <div style={{ fontSize: 13, fontWeight: 'bold', color }}>${price.toFixed(2)}</div>
                            {sortBy === 'price' && (
                              <div style={{ fontSize: 9, opacity: 0.6 }}>#{i + 1}</div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div style={{ padding: 4, fontSize: 10, color: '#808080', textAlign: 'center', background: '#C0C0C0' }}>
                    Click a store to compare prices
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
