'use client'

import { useEffect, useRef, useState } from 'react'

type Shot = {
  x: number
  y: number
  made: boolean
  distance: number
  type: string
}

export default function NBAShortChartInline() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [loading, setLoading] = useState(true)
  const [shots, setShots] = useState<Shot[]>([])
  const [stats, setStats] = useState({ made: 0, attempted: 0, percentage: 0 })

  useEffect(() => {
    const fetchShots = async () => {
      try {
        const response = await fetch('/api/nba?playerId=1630162&season=2024-25')
        const data = await response.json()

        if (data.error) {
          throw new Error(data.error)
        }

        // Parse shot data
        const shotData = data.resultSets[0]
        const headers = shotData.headers
        const rows = shotData.rowSet

        const locXIndex = headers.indexOf('LOC_X')
        const locYIndex = headers.indexOf('LOC_Y')
        const madeIndex = headers.indexOf('SHOT_MADE_FLAG')
        const distanceIndex = headers.indexOf('SHOT_DISTANCE')
        const typeIndex = headers.indexOf('SHOT_TYPE')

        const parsedShots: Shot[] = rows.map((row: any[]) => ({
          x: row[locXIndex],
          y: row[locYIndex],
          made: row[madeIndex] === 1,
          distance: row[distanceIndex],
          type: row[typeIndex]
        }))

        setShots(parsedShots)

        // Calculate stats
        const made = parsedShots.filter(s => s.made).length
        const attempted = parsedShots.length
        const percentage = attempted > 0 ? Math.round((made / attempted) * 100) : 0

        setStats({ made, attempted, percentage })
        setLoading(false)
      } catch (error) {
        console.error('Error fetching shot data:', error)
        setLoading(false)
      }
    }

    fetchShots()
  }, [])

  useEffect(() => {
    if (!canvasRef.current || shots.length === 0) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Court dimensions (NBA court is 50ft wide x 47ft half court)
    const courtWidth = 500
    const courtHeight = 470
    const scale = 10 // 1 foot = 10 pixels

    // Clear canvas
    ctx.fillStyle = '#F4A460'
    ctx.fillRect(0, 0, courtWidth, courtHeight)

    // Draw court lines
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 2

    // Paint area (16ft wide box)
    ctx.strokeRect(170, 0, 160, 190)

    // Free throw circle
    ctx.beginPath()
    ctx.arc(250, 190, 60, 0, Math.PI * 2)
    ctx.stroke()

    // 3-point line
    ctx.beginPath()
    ctx.arc(250, 0, 237.5, 0.4, Math.PI - 0.4)
    ctx.stroke()

    // Basket
    ctx.beginPath()
    ctx.arc(250, 40, 9, 0, Math.PI * 2)
    ctx.fillStyle = '#FF0000'
    ctx.fill()
    ctx.stroke()

    // Draw shots
    shots.forEach(shot => {
      const x = 250 + (shot.x / 10) * scale // Center court and scale
      const y = 40 + (shot.y / 10) * scale  // Offset from basket

      ctx.beginPath()
      ctx.arc(x, y, 3, 0, Math.PI * 2)
      
      if (shot.made) {
        ctx.fillStyle = 'rgba(0, 200, 0, 0.6)'
      } else {
        ctx.fillStyle = 'rgba(200, 0, 0, 0.6)'
      }
      
      ctx.fill()
      ctx.strokeStyle = shot.made ? '#00AA00' : '#AA0000'
      ctx.lineWidth = 1
      ctx.stroke()
    })

  }, [shots])

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
          NBA SHOT CHART - ANTHONY EDWARDS
        </div>

        {/* Stats Display */}
        {!loading && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 8,
            background: '#C0C0C0',
            padding: 8,
            border: '2px inset #DFDFDF'
          }}>
            <div style={{
              textAlign: 'center',
              color: '#000080',
              fontFamily: 'Courier New, monospace',
              fontSize: 11,
              fontWeight: 'bold'
            }}>
              <div style={{ fontSize: 9 }}>MADE</div>
              <div style={{ fontSize: 14 }}>{stats.made}</div>
            </div>
            <div style={{
              textAlign: 'center',
              color: '#000080',
              fontFamily: 'Courier New, monospace',
              fontSize: 11,
              fontWeight: 'bold'
            }}>
              <div style={{ fontSize: 9 }}>ATTEMPTS</div>
              <div style={{ fontSize: 14 }}>{stats.attempted}</div>
            </div>
            <div style={{
              textAlign: 'center',
              color: '#000080',
              fontFamily: 'Courier New, monospace',
              fontSize: 11,
              fontWeight: 'bold'
            }}>
              <div style={{ fontSize: 9 }}>FG%</div>
              <div style={{ fontSize: 14 }}>{stats.percentage}%</div>
            </div>
          </div>
        )}
      </div>

      {/* Court Canvas */}
      <div style={{
        flex: 1,
        background: '#C0C0C0',
        border: '2px inset #DFDFDF',
        padding: 4,
        boxShadow: '2px 2px 0 rgba(0,0,0,0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'auto'
      }}>
        {loading ? (
          <div style={{
            color: '#000080',
            fontSize: 14,
            fontWeight: 'bold'
          }}>
            Loading shot data...
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            width={500}
            height={470}
            style={{
              border: '2px solid #000080',
              background: '#F4A460',
              maxWidth: '100%',
              height: 'auto'
            }}
          />
        )}

        {/* Legend */}
        {!loading && (
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
            <div style={{ fontWeight: 'bold', marginBottom: 4 }}>LEGEND</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
              <div style={{ width: 12, height: 12, background: 'rgba(0, 200, 0, 0.8)', borderRadius: '50%' }} />
              <span>Made</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 12, height: 12, background: 'rgba(200, 0, 0, 0.8)', borderRadius: '50%' }} />
              <span>Missed</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}