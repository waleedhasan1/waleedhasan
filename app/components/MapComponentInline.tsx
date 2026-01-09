'use client'

import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import stationsData from '../cta-stations.json'

interface Station {
  name: string
  mapId: number
  lines: string
  lat: number
  lng: number
}

const stations: Station[] = stationsData as Station[]

const LINE_COLORS: Record<string, string> = {
  'Red': '#c60c30',
  'Blue': '#00a1de',
  'Brown': '#62361b',
  'Green': '#009b3a',
  'Orange': '#f9461c',
  'Purple': '#522398',
  'Pink': '#e27ea6',
  'Yellow': '#f9e300'
}

function getStationColor(lines: string): string {
  for (const [line, color] of Object.entries(LINE_COLORS)) {
    if (lines.includes(line)) {
      return color
    }
  }
  return '#999'
}

// Component to fix map loading
function MapFixer() {
  const map = useMap()
  
  useEffect(() => {
    // Force map to refresh multiple times on initial load
    const timeouts = [100, 300, 500, 1000].map(delay =>
      setTimeout(() => {
        map.invalidateSize()
      }, delay)
    )
    
    // Refresh tiles after any map movement
    const handleMoveEnd = () => {
      map.invalidateSize()
    }
    
    const handleZoomEnd = () => {
      map.invalidateSize()
    }
    
    map.on('moveend', handleMoveEnd)
    map.on('zoomend', handleZoomEnd)
    
    return () => {
      timeouts.forEach(clearTimeout)
      map.off('moveend', handleMoveEnd)
      map.off('zoomend', handleZoomEnd)
    }
  }, [map])
  
  return null
}

export default function MapComponentInline() {
  const [mapKey, setMapKey] = useState(0)
  const [selectedStation, setSelectedStation] = useState<string | null>(null)
  const [arrivals, setArrivals] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [visibleLines, setVisibleLines] = useState<Set<string>>(
    new Set(['Red', 'Blue', 'Brown', 'Green', 'Orange', 'Purple', 'Pink', 'Yellow'])
  )
  
  useEffect(() => {
    // Force remount on first render
    setMapKey(1)
    
    // Debug: Check what's in stations
    console.log('Total stations loaded:', stations.length)
    console.log('First station:', stations[0])
    console.log('First station mapId:', stations[0]?.mapId)
  }, [])
  
  const toggleLine = (line: string) => {
    const newVisible = new Set(visibleLines)
    if (newVisible.has(line)) {
      newVisible.delete(line)
    } else {
      newVisible.add(line)
    }
    setVisibleLines(newVisible)
  }
  
  const isStationVisible = (stationLines: string): boolean => {
    // Check if any of the station's lines are visible
    for (const line of Array.from(visibleLines)) {
      if (stationLines.includes(line)) {
        return true
      }
    }
    return false
  }
  
  const fetchArrivals = async (mapId: number, stationName: string) => {
    console.log('=== FETCHING ARRIVALS ===')
    console.log('Station Name:', stationName)
    console.log('Map ID:', mapId)
    console.log('API URL:', `/api/cta?mapid=${mapId}`)
    
    setLoading(true)
    setSelectedStation(stationName)
    
    try {
      const response = await fetch(`/api/cta?mapid=${mapId}`)
      console.log('Response Status:', response.status)
      console.log('Response OK:', response.ok)
      
      const xmlText = await response.text()
      console.log('Response Text (first 200 chars):', xmlText.substring(0, 200))
      
      // Parse XML
      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml')
      const etas = xmlDoc.getElementsByTagName('eta')
      console.log('Number of ETAs found:', etas.length)
      
      const arrivalData = []
      for (let i = 0; i < etas.length; i++) {
        const eta = etas[i]
        arrivalData.push({
          destNm: eta.getElementsByTagName('destNm')[0]?.textContent || '',
          arrT: eta.getElementsByTagName('arrT')[0]?.textContent || '',
          isApp: eta.getElementsByTagName('isApp')[0]?.textContent || '0',
          rt: eta.getElementsByTagName('rt')[0]?.textContent || ''
        })
      }
      
      console.log('Parsed Arrivals:', arrivalData)
      setArrivals(arrivalData)
    } catch (error) {
      console.error('ERROR fetching arrivals:', error)
      setArrivals([])
    } finally {
      setLoading(false)
    }
  }
  
  const getMinutesUntil = (arrivalTime: string) => {
    const now = new Date()
    const arrival = new Date(arrivalTime)
    const diff = Math.round((arrival.getTime() - now.getTime()) / 60000)
    return diff <= 0 ? 'Due' : `${diff} min`
  }
  
  const getLineColorFromCode = (rt: string): string => {
    const colorMap: Record<string, string> = {
      'Red': LINE_COLORS['Red'],
      'Blue': LINE_COLORS['Blue'],
      'Brn': LINE_COLORS['Brown'],
      'G': LINE_COLORS['Green'],
      'Org': LINE_COLORS['Orange'],
      'P': LINE_COLORS['Purple'],
      'Pink': LINE_COLORS['Pink'],
      'Y': LINE_COLORS['Yellow']
    }
    return colorMap[rt] || '#999'
  }
  
  // Bounds set to exactly what's visible in the window at zoom 11
  const chicagoBounds: [[number, number], [number, number]] = [
    [41.78, -87.75],  // Southwest corner (tight to window)
    [41.98, -87.52]   // Northeast corner (tight to window)
  ]

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative' }}>
      {/* CTA API Beta Notice */}
      <div style={{
        position: 'absolute',
        top: 10,
        left: 10,
        background: '#FFF3CD',
        border: '2px solid #FFC107',
        borderRadius: 6,
        padding: '8px 12px',
        zIndex: 1000,
        maxWidth: 350,
        fontSize: 12,
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
      }}>
        <strong>⚠️ Note:</strong> The CTA Train Tracker API is in beta and may not always be available. 
        Arrival times may be temporarily unavailable.
      </div>

      {/* Line Filter Buttons */}
      <div style={{
        position: 'absolute',
        bottom: 20,
        left: 20,
        background: 'white',
        padding: 12,
        borderRadius: 8,
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        zIndex: 1000
      }}>
        <div style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 8 }}>Filter Lines</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {Object.entries(LINE_COLORS).map(([line, color]) => (
            <button
              key={line}
              onClick={() => toggleLine(line)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 10px',
                border: '2px solid ' + color,
                borderRadius: 4,
                background: visibleLines.has(line) ? color : 'white',
                color: visibleLines.has(line) ? 'white' : color,
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 'bold',
                opacity: visibleLines.has(line) ? 1 : 0.5,
                transition: 'all 0.2s'
              }}
            >
              <div style={{ 
                width: 12, 
                height: 12, 
                borderRadius: '50%', 
                background: color,
                border: '1px solid white'
              }} />
              {line}
            </button>
          ))}
        </div>
      </div>

      <MapContainer
        key={mapKey}
        center={[41.8781, -87.6298]}
        zoom={11}
        minZoom={10}
        maxZoom={16}
        maxBounds={chicagoBounds}
        maxBoundsViscosity={1.0}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <MapFixer />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap'
        />
        
        {stations.map((station, idx) => {
          // Skip stations that are filtered out
          if (!isStationVisible(station.lines)) return null
          
          return (
            <CircleMarker
              key={idx}
              center={[station.lat, station.lng]}
              radius={6}
              fillColor={getStationColor(station.lines)}
              color="#fff"
              weight={2}
              fillOpacity={0.8}
              eventHandlers={{
                click: () => fetchArrivals(station.mapId, station.name)
              }}
            >
              <Popup>
                <div style={{ minWidth: 150 }}>
                  <strong style={{ fontSize: 14 }}>{station.name}</strong>
                  <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>
                    {station.lines}
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          )
        })}
      </MapContainer>

      {/* Arrivals Panel */}
      {selectedStation && (
        <div style={{
          position: 'absolute',
          top: 10,
          right: 10,
          background: 'white',
          padding: 16,
          borderRadius: 8,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          maxWidth: 300,
          maxHeight: 'calc(100% - 20px)',
          overflow: 'auto',
          zIndex: 1000
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ margin: 0, fontSize: 14 }}>{selectedStation}</h3>
            <button
              onClick={() => setSelectedStation(null)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: 20,
                cursor: 'pointer',
                padding: 0,
                color: '#666'
              }}
            >
              ×
            </button>
          </div>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: 16, color: '#666' }}>
              Loading arrivals...
            </div>
          ) : arrivals.length > 0 ? (
            <div>
              {arrivals.map((arrival, idx) => (
                <div key={idx} style={{
                  padding: '10px 0',
                  borderBottom: idx < arrivals.length - 1 ? '1px solid #eee' : 'none'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 6,
                    marginBottom: 4
                  }}>
                    <div style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: getLineColorFromCode(arrival.rt)
                    }} />
                    <div style={{ fontWeight: 'bold', fontSize: 13 }}>
                      {arrival.destNm}
                    </div>
                  </div>
                  <div style={{ fontSize: 20, color: '#0053EE', fontWeight: 'bold', marginLeft: 14 }}>
                    {getMinutesUntil(arrival.arrT)}
                  </div>
                  {arrival.isApp === '1' && (
                    <div style={{ fontSize: 10, color: '#009b3a', marginLeft: 14, marginTop: 2 }}>
                      🚇 Approaching
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: '#666', textAlign: 'center', padding: 16 }}>
              No arrivals scheduled
            </div>
          )}
        </div>
      )}
    </div>
  )
}