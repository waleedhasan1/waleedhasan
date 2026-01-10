'use client'

import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

export default function WeatherRadarInline() {
  const [loading, setLoading] = useState(true)
  const [selectedFrame, setSelectedFrame] = useState(3) // Start with NOW
  const mapRefs = useRef<(L.Map | null)[]>([null, null, null, null])
  const isSyncing = useRef(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const initMaps = async () => {
      // Fetch radar data first
      try {
        const response = await fetch('https://api.rainviewer.com/public/weather-maps.json')
        const data = await response.json()
        
        // Get frames at hourly intervals (every 6th frame)
        const allFrames = data.radar.past
        const hourlyFrames = []
        
        for (let i = 3; i >= 0; i--) {
          const index = allFrames.length - 1 - (i * 6)
          if (index >= 0) {
            hourlyFrames.push(allFrames[index])
          }
        }
        
        const urls = hourlyFrames.map((frame: any) => 
          `https://tilecache.rainviewer.com/v2/radar/${frame.path}/256/{z}/{x}/{y}/2/1_1.png`
        )
        
        // Initialize all 4 maps
        urls.forEach((url: string, index: number) => {
          const mapId = `radar-map-${index}`
          const mapEl = document.getElementById(mapId)
          
          if (mapEl && !mapRefs.current[index]) {
            const map = L.map(mapId, {
              zoomControl: true
            }).setView([41.8781, -87.6298], 9)

            // Base map
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '© OpenStreetMap'
            }).addTo(map)

            // Radar overlay
            L.tileLayer(url, {
              opacity: 0.7,
              zIndex: 1000
            }).addTo(map)

            mapRefs.current[index] = map
          }
        })
        
        setLoading(false)
      } catch (err) {
        console.error('Error loading radar:', err)
        setLoading(false)
      }
    }

    setTimeout(initMaps, 100)

    return () => {
      mapRefs.current.forEach(map => {
        if (map) map.remove()
      })
    }
  }, [])

  // Fix map size when switching frames
  useEffect(() => {
    if (mapRefs.current[selectedFrame]) {
      setTimeout(() => {
        mapRefs.current[selectedFrame]?.invalidateSize()
      }, 100)
    }
  }, [selectedFrame])

  // Sync map views
  useEffect(() => {
    if (mapRefs.current.every(map => map !== null)) {
      mapRefs.current.forEach((sourceMap, sourceIndex) => {
        if (!sourceMap) return

        const syncMaps = () => {
          if (isSyncing.current) return
          isSyncing.current = true

          const center = sourceMap.getCenter()
          const zoom = sourceMap.getZoom()

          mapRefs.current.forEach((targetMap, targetIndex) => {
            if (targetMap && targetIndex !== sourceIndex) {
              targetMap.setView(center, zoom, { animate: false })
            }
          })

          setTimeout(() => {
            isSyncing.current = false
          }, 100)
        }

        sourceMap.on('moveend', syncMaps)
        sourceMap.on('zoomend', syncMaps)
      })

      return () => {
        mapRefs.current.forEach(map => {
          if (map) {
            map.off('moveend')
            map.off('zoomend')
          }
        })
      }
    }
  }, [loading])

  const getTimeLabel = (index: number) => {
    const hoursAgo = 3 - index
    if (hoursAgo === 0) return 'NOW'
    if (hoursAgo === 1) return '1 HR AGO'
    return `${hoursAgo} HRS AGO`
  }

  return (
    <div style={{ 
      height: '100%', 
      width: '100%',
      background: '#008080',
      padding: 8,
      fontFamily: 'MS Sans Serif, Arial, sans-serif',
      fontSize: 11,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        background: '#C0C0C0',
        border: '2px outset #DFDFDF',
        padding: 8,
        marginBottom: 8,
        boxShadow: '2px 2px 0 rgba(0,0,0,0.3)'
      }}>
        <div style={{
          background: '#000080',
          color: 'white',
          padding: '6px 8px',
          fontWeight: 'bold',
          fontSize: 12,
          textAlign: 'center',
          marginBottom: 8
        }}>
          🌧️ WEATHER RADAR - CHICAGO {loading && '(Loading...)'}
        </div>

        {/* Time Selection Buttons */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr 1fr',
          gap: 4,
          background: '#1A1A1A',
          padding: 8,
          border: '2px inset #000'
        }}>
          {[0, 1, 2, 3].map((index) => (
            <button
              key={index}
              onClick={() => setSelectedFrame(index)}
              disabled={loading}
              style={{
                background: selectedFrame === index ? '#00AA00' : '#C0C0C0',
                color: selectedFrame === index ? '#FFF' : '#000',
                border: selectedFrame === index ? '2px inset #DFDFDF' : '2px outset #DFDFDF',
                padding: '8px 4px',
                cursor: loading ? 'wait' : 'pointer',
                fontWeight: 'bold',
                fontSize: 10,
                fontFamily: 'Courier New, monospace'
              }}
              onMouseDown={(e) => {
                if (!loading && selectedFrame !== index) {
                  e.currentTarget.style.border = '2px inset #DFDFDF';
                }
              }}
              onMouseUp={(e) => {
                if (selectedFrame !== index) {
                  e.currentTarget.style.border = '2px outset #DFDFDF';
                }
              }}
            >
              {getTimeLabel(index)}
            </button>
          ))}
        </div>
      </div>

      {/* Map Container */}
      <div style={{
        flex: 1,
        background: '#C0C0C0',
        border: '2px inset #DFDFDF',
        padding: 4,
        boxShadow: '2px 2px 0 rgba(0,0,0,0.3)',
        position: 'relative'
      }}>
        {/* All 4 maps, but only one visible at a time */}
        {[0, 1, 2, 3].map((index) => (
          <div 
            key={index}
            id={`radar-map-${index}`}
            style={{ 
              width: '100%',
              height: '100%',
              border: '1px solid #000',
              display: selectedFrame === index ? 'block' : 'none'
            }}
          />
        ))}
        
        {/* Legend */}
        <div style={{
          position: 'absolute',
          bottom: 12,
          right: 12,
          background: 'rgba(0,0,0,0.8)',
          border: '2px outset #DFDFDF',
          padding: 8,
          color: 'white',
          fontSize: 9,
          zIndex: 1000
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: 4 }}>PRECIPITATION</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
            <div style={{ width: 12, height: 12, background: '#0000FF' }} />
            <span>Light</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
            <div style={{ width: 12, height: 12, background: '#00FF00' }} />
            <span>Moderate</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 12, height: 12, background: '#FF0000' }} />
            <span>Heavy</span>
          </div>
        </div>
      </div>
    </div>
  )
}