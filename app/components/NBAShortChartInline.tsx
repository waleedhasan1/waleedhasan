'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'

type Shot = {
  x: number
  y: number
  made: boolean
  distance: number
  type: string
  zone: string
  area: string
  gameId: string
}

type Game = {
  gameId: string
  date: string
  homeTeam: string
  awayTeam: string
  playerTeam: string
  shots: Shot[]
}

type Player = {
  id: number
  name: string
  teamAbbr: string
  img?: string // filename in /public/nba/players/
}

type Stats = {
  made: number
  attempted: number
  pct: number
  twoPtMade: number
  twoPtAtt: number
  twoPtPct: number
  threePtMade: number
  threePtAtt: number
  threePtPct: number
}

const SEASONS = [
  '2024-25', '2023-24', '2022-23', '2021-22', '2020-21',
  '2019-20', '2018-19', '2017-18', '2016-17', '2015-16'
]

// Map team abbreviation -> logo filename in /public/nba/teams/
const TEAM_LOGOS: Record<string, string> = {
  MIN: 'twolves.svg',
  LAL: 'lakers.svg',
  MIL: 'bucks.svg',
  DEN: 'nuggets.svg',
  OKC: 'thunder.svg',
  GSW: 'warriors.svg',
  HOU: 'rockets.svg',
  DAL: 'mavs.svg',
  PHX: 'suns.svg',
}

function teamLogoSrc(abbr: string): string {
  return `/nba/teams/${TEAM_LOGOS[abbr] || abbr.toLowerCase() + '.svg'}`
}

const POPULAR_PLAYERS: Player[] = [
  { id: 1630162, name: 'Anthony Edwards', teamAbbr: 'MIN', img: 'anthonyedwards.png' },
  { id: 201142, name: 'Kevin Durant', teamAbbr: 'HOU', img: 'kevindurant.png' },
  { id: 203507, name: 'Giannis Antetokounmpo', teamAbbr: 'MIL', img: 'giannisantetekounpo.png' },
  { id: 1629029, name: 'Luka Doncic', teamAbbr: 'LAL', img: 'lukadoncic.png' },
  { id: 203999, name: 'Nikola Jokic', teamAbbr: 'DEN', img: 'nikolajokic.png' },
  { id: 1628983, name: 'Shai Gilgeous-Alexander', teamAbbr: 'OKC', img: 'sga.png' },
  { id: 201939, name: 'Stephen Curry', teamAbbr: 'GSW', img: 'stephencurry.png' },
  { id: 2544, name: 'LeBron James', teamAbbr: 'LAL', img: 'lebronjames.png' },
]

function calcPct(made: number, att: number): number {
  return att > 0 ? Math.round((made / att) * 1000) / 10 : 0
}

function calcStats(shots: Shot[]): Stats {
  const made = shots.filter(s => s.made).length
  const att = shots.length
  const twoPt = shots.filter(s => s.type === '2PT Field Goal')
  const threePt = shots.filter(s => s.type === '3PT Field Goal')
  const twoPtMade = twoPt.filter(s => s.made).length
  const threePtMade = threePt.filter(s => s.made).length
  return {
    made, attempted: att, pct: calcPct(made, att),
    twoPtMade, twoPtAtt: twoPt.length, twoPtPct: calcPct(twoPtMade, twoPt.length),
    threePtMade, threePtAtt: threePt.length, threePtPct: calcPct(threePtMade, threePt.length),
  }
}

function formatDate(dateStr: string): string {
  // YYYYMMDD -> Mon DD, YYYY
  if (dateStr.length !== 8) return dateStr
  const y = dateStr.slice(0, 4)
  const m = parseInt(dateStr.slice(4, 6), 10) - 1
  const d = parseInt(dateStr.slice(6, 8), 10)
  const date = new Date(parseInt(y), m, d)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function NBAShortChartInline() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [allShots, setAllShots] = useState<Shot[]>([])
  const [games, setGames] = useState<Game[]>([])
  const [gameIndex, setGameIndex] = useState(0) // 0 = most recent
  const [viewMode, setViewMode] = useState<'game' | 'season'>('game')
  const [selectedPlayer, setSelectedPlayer] = useState<Player>(POPULAR_PLAYERS[0])
  const [season, setSeason] = useState('2024-25')

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Player[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [searching, setSearching] = useState(false)

  // Filter state
  const [shotFilter, setShotFilter] = useState<'all' | '2pt' | '3pt'>('all')
  const [showMade, setShowMade] = useState(true)
  const [showMissed, setShowMissed] = useState(true)

  // Hover state
  const [hoverInfo, setHoverInfo] = useState<{ x: number; y: number; shot: Shot } | null>(null)

  // Fetch shot data
  const fetchShots = useCallback(async (playerId: number, seasonStr: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/nba?playerId=${playerId}&season=${seasonStr}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      const shotData = data.resultSets[0]
      const h = shotData.headers
      const rows = shotData.rowSet

      const xi = h.indexOf('LOC_X')
      const yi = h.indexOf('LOC_Y')
      const mi = h.indexOf('SHOT_MADE_FLAG')
      const di = h.indexOf('SHOT_DISTANCE')
      const ti = h.indexOf('SHOT_TYPE')
      const zi = h.indexOf('SHOT_ZONE_BASIC')
      const ai = h.indexOf('SHOT_ZONE_AREA')
      const gi = h.indexOf('GAME_ID')
      const gdi = h.indexOf('GAME_DATE')
      const hti = h.indexOf('HTM')
      const vti = h.indexOf('VTM')
      const tni = h.indexOf('TEAM_NAME')

      const parsed: Shot[] = rows.map((r: any[]) => ({
        x: r[xi],
        y: r[yi],
        made: r[mi] === 1,
        distance: r[di],
        type: r[ti],
        zone: zi >= 0 ? r[zi] : '',
        area: ai >= 0 ? r[ai] : '',
        gameId: r[gi],
      }))

      // Group by game
      const gameMap = new Map<string, Game>()
      rows.forEach((r: any[]) => {
        const gid = r[gi]
        if (!gameMap.has(gid)) {
          gameMap.set(gid, {
            gameId: gid,
            date: r[gdi] || '',
            homeTeam: r[hti] || '',
            awayTeam: r[vti] || '',
            playerTeam: r[tni] || '',
            shots: [],
          })
        }
      })

      parsed.forEach(shot => {
        gameMap.get(shot.gameId)?.shots.push(shot)
      })

      // Sort games by date descending (most recent first)
      const sortedGames = Array.from(gameMap.values()).sort((a, b) => {
        if (b.date > a.date) return 1
        if (b.date < a.date) return -1
        return 0
      })

      setAllShots(parsed)
      setGames(sortedGames)
      setGameIndex(0) // start at most recent
      setLoading(false)
    } catch (err: any) {
      setError(err.message || 'Failed to load shot data')
      setAllShots([])
      setGames([])
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchShots(selectedPlayer.id, season)
  }, [selectedPlayer, season, fetchShots])

  // Current game & shots
  const currentGame = games[gameIndex] || null

  const activeShots = useMemo(() => {
    if (viewMode === 'season') return allShots
    return currentGame?.shots || []
  }, [viewMode, allShots, currentGame])

  const filteredShots = useMemo(() => {
    return activeShots.filter(s => {
      if (!showMade && s.made) return false
      if (!showMissed && !s.made) return false
      if (shotFilter === '2pt' && s.type !== '2PT Field Goal') return false
      if (shotFilter === '3pt' && s.type !== '3PT Field Goal') return false
      return true
    })
  }, [activeShots, showMade, showMissed, shotFilter])

  const stats = useMemo(() => calcStats(activeShots), [activeShots])

  // Game navigation
  const goNewerGame = () => setGameIndex(i => Math.max(0, i - 1))
  const goOlderGame = () => setGameIndex(i => Math.min(games.length - 1, i + 1))
  const goNewestGame = () => setGameIndex(0)
  const goOldestGame = () => setGameIndex(games.length - 1)

  // Opponent info
  const getMatchupLabel = (game: Game) => {
    const isHome = game.homeTeam === selectedPlayer.teamAbbr
    const opponent = isHome ? game.awayTeam : game.homeTeam
    const prefix = isHome ? 'vs' : '@'
    return `${prefix} ${opponent}`
  }

  // Search players
  const searchPlayers = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([])
      return
    }
    setSearching(true)
    try {
      const res = await fetch(`/api/nba/players?search=${encodeURIComponent(query)}&season=${season}`)
      const data = await res.json()
      if (Array.isArray(data)) setSearchResults(data)
    } catch {
      setSearchResults([])
    }
    setSearching(false)
  }, [season])

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setShowDropdown(true)
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    searchTimeoutRef.current = setTimeout(() => searchPlayers(value), 350)
  }

  const selectPlayer = (player: Player) => {
    setSelectedPlayer(player)
    setSearchQuery('')
    setShowDropdown(false)
    setSearchResults([])
  }

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Canvas hover
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const scaleX = 500 / rect.width
    const scaleY = 470 / rect.height
    const mx = (e.clientX - rect.left) * scaleX
    const my = (e.clientY - rect.top) * scaleY

    let closest: Shot | null = null
    let closestDist = 12

    for (const shot of filteredShots) {
      const sx = 250 + shot.x
      const sy = 52 + shot.y
      const d = Math.sqrt((mx - sx) ** 2 + (my - sy) ** 2)
      if (d < closestDist) {
        closestDist = d
        closest = shot
      }
    }

    if (closest) {
      setHoverInfo({ x: e.clientX - rect.left, y: e.clientY - rect.top, shot: closest })
    } else {
      setHoverInfo(null)
    }
  }

  // Draw court and shots
  useEffect(() => {
    if (!canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = 500, H = 470
    const bx = 250, by = 52

    const drawCourt = (logoImg?: HTMLImageElement) => {
      // Court floor
      ctx.fillStyle = '#E8D4A8'
      ctx.fillRect(0, 0, W, H)

      // Floor grain
      ctx.strokeStyle = 'rgba(180, 150, 100, 0.15)'
      ctx.lineWidth = 1
      for (let i = 0; i < W; i += 20) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, H); ctx.stroke()
      }

      // Team logo at half court
      if (logoImg) {
        const logoSize = 100
        ctx.save()
        ctx.globalAlpha = 0.18
        ctx.drawImage(logoImg, bx - logoSize / 2, H - logoSize / 2 - 10, logoSize, logoSize)
        ctx.restore()
      }

      ctx.strokeStyle = '#444'; ctx.lineWidth = 2
      ctx.strokeRect(0, 0, W, H)

      // Backboard
      ctx.lineWidth = 3; ctx.strokeStyle = '#333'
      ctx.beginPath(); ctx.moveTo(bx - 30, 40); ctx.lineTo(bx + 30, 40); ctx.stroke()

      // Rim
      ctx.lineWidth = 2.5; ctx.strokeStyle = '#E65100'
      ctx.beginPath(); ctx.arc(bx, by, 7.5, 0, Math.PI * 2); ctx.stroke()
      ctx.lineWidth = 1.5
      ctx.beginPath(); ctx.moveTo(bx, 40); ctx.lineTo(bx, by - 7.5); ctx.stroke()

      ctx.strokeStyle = '#444'; ctx.lineWidth = 2

      // Paint
      ctx.strokeRect(bx - 80, 0, 160, 190)
      ctx.setLineDash([6, 4]); ctx.lineWidth = 1; ctx.strokeStyle = '#888'
      ctx.strokeRect(bx - 60, 0, 120, 190)
      ctx.setLineDash([]); ctx.strokeStyle = '#444'; ctx.lineWidth = 2

      // Free throw circle
      ctx.beginPath(); ctx.arc(bx, 190, 60, 0, Math.PI); ctx.stroke()
      ctx.setLineDash([6, 4])
      ctx.beginPath(); ctx.arc(bx, 190, 60, Math.PI, Math.PI * 2); ctx.stroke()
      ctx.setLineDash([])

      // Restricted area
      ctx.lineWidth = 1.5
      ctx.beginPath(); ctx.arc(bx, by, 40, 0, Math.PI); ctx.stroke()

      // 3-point line
      ctx.lineWidth = 2
      const r3 = 237.5, cd = 220
      const lcx = bx - cd, rcx = bx + cd
      const dy = Math.sqrt(r3 * r3 - cd * cd)
      const cmy = by + dy

      ctx.beginPath(); ctx.moveTo(lcx, 0); ctx.lineTo(lcx, cmy); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(rcx, 0); ctx.lineTo(rcx, cmy); ctx.stroke()

      const ra = Math.atan2(cmy - by, rcx - bx)
      const la = Math.atan2(cmy - by, lcx - bx)
      ctx.beginPath(); ctx.arc(bx, by, r3, ra, la); ctx.stroke()

      // Half court arc
      ctx.lineWidth = 1.5
      ctx.beginPath(); ctx.arc(bx, H, 60, Math.PI, Math.PI * 2); ctx.stroke()

      // Lane ticks
      ctx.lineWidth = 1.5
      ;[70, 110, 150, 170].forEach(ty => {
        ctx.beginPath(); ctx.moveTo(bx - 80, ty); ctx.lineTo(bx - 86, ty); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(bx + 80, ty); ctx.lineTo(bx + 86, ty); ctx.stroke()
      })

      // Draw shots
      filteredShots.forEach(shot => {
      const x = bx + shot.x, y = by + shot.y
      if (x < -10 || x > W + 10 || y < -10 || y > H + 10) return

      ctx.beginPath()
      ctx.arc(x, y, 4, 0, Math.PI * 2)

      if (shot.made) {
        ctx.fillStyle = 'rgba(34, 197, 94, 0.75)'
        ctx.strokeStyle = 'rgba(22, 130, 60, 0.9)'
      } else {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.55)'
        ctx.strokeStyle = 'rgba(180, 30, 30, 0.75)'
      }

      ctx.fill()
      ctx.lineWidth = 1
      ctx.stroke()
    })
    }

    // Load team logo and draw court
    if (selectedPlayer.teamAbbr) {
      const img = new Image()
      img.onload = () => drawCourt(img)
      img.onerror = () => drawCourt()
      img.src = teamLogoSrc(selectedPlayer.teamAbbr)
    } else {
      drawCourt()
    }
  }, [filteredShots, selectedPlayer.teamAbbr])

  // Styles
  const panelStyle: React.CSSProperties = {
    background: '#C0C0C0',
    border: '2px outset #DFDFDF',
    padding: 6,
    marginBottom: 4,
    boxShadow: '1px 1px 0 rgba(0,0,0,0.2)',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#000',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  }

  const btnBase: React.CSSProperties = {
    fontFamily: 'MS Sans Serif, Arial, sans-serif',
    fontSize: 10,
    padding: '3px 8px',
    cursor: 'pointer',
    border: '2px outset #DFDFDF',
    background: '#C0C0C0',
    color: '#000',
  }

  const btnActive: React.CSSProperties = {
    ...btnBase,
    border: '2px inset #808080',
    background: '#000080',
    color: '#FFF',
  }

  const btnDisabled: React.CSSProperties = {
    ...btnBase,
    color: '#888',
    cursor: 'default',
  }

  const inputStyle: React.CSSProperties = {
    fontFamily: 'MS Sans Serif, Arial, sans-serif',
    fontSize: 11,
    padding: '3px 6px',
    border: '2px inset #808080',
    background: '#FFF',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  }

  const navBtn: React.CSSProperties = {
    ...btnBase,
    padding: '2px 6px',
    fontSize: 11,
    fontWeight: 'bold',
    minWidth: 24,
    textAlign: 'center',
  }

  return (
    <div style={{
      height: '100%',
      width: '100%',
      background: '#008080',
      padding: 6,
      fontFamily: 'MS Sans Serif, Arial, sans-serif',
      fontSize: 11,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Player Card */}
      <div style={{
        ...panelStyle,
        padding: 0,
        overflow: 'visible',
        background: '#000080',
        position: 'relative',
      }}>
        {/* Team logo background watermark */}
        {selectedPlayer.teamAbbr && (
          <div style={{
            position: 'absolute',
            right: 10,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 80,
            height: 80,
            opacity: 0.12,
            pointerEvents: 'none',
            zIndex: 0,
          }}>
            <img
              src={teamLogoSrc(selectedPlayer.teamAbbr)}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'brightness(3)' }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          </div>
        )}

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '8px 10px',
          position: 'relative',
          zIndex: 1,
        }}>
          {/* Player Headshot */}
          <div style={{
            width: 72,
            height: 72,
            border: '2px outset #DFDFDF',
            background: '#1a1a4e',
            overflow: 'hidden',
            flexShrink: 0,
          }}>
            <img
              src={selectedPlayer.img ? `/nba/players/${selectedPlayer.img}` : ''}
              alt={selectedPlayer.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          </div>

          {/* Player Info */}
          <div style={{ flex: 1, minWidth: 0, color: 'white' }}>
            <div style={{
              fontWeight: 'bold',
              fontSize: 15,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              textShadow: '1px 1px 0 rgba(0,0,0,0.5)',
            }}>
              {selectedPlayer.name.toUpperCase()}
            </div>
            <div style={{
              fontSize: 11,
              opacity: 0.9,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginTop: 4,
            }}>
              {/* Team Logo inline */}
              {selectedPlayer.teamAbbr && (
                <img
                  src={teamLogoSrc(selectedPlayer.teamAbbr)}
                  alt={selectedPlayer.teamAbbr}
                  style={{ width: 22, height: 22, objectFit: 'contain' }}
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              )}
              <span style={{ fontWeight: 'bold' }}>{selectedPlayer.teamAbbr || 'NBA'}</span>
              <span style={{ opacity: 0.5 }}>|</span>
              <span>{season}</span>
            </div>
          </div>
        </div>

        {/* Search & Season Row */}
        <div style={{ display: 'flex', gap: 6, padding: '5px 6px', alignItems: 'flex-end', background: '#C0C0C0' }}>
          <div style={{ flex: 1, position: 'relative' }} ref={dropdownRef}>
            <div style={labelStyle}>Player</div>
            <input
              type="text"
              value={searchQuery}
              onChange={e => handleSearchChange(e.target.value)}
              onFocus={() => { if (searchQuery.length >= 2) setShowDropdown(true) }}
              placeholder="Search player..."
              style={{ ...inputStyle, marginTop: 2 }}
            />
            {showDropdown && (searchResults.length > 0 || searching) && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0,
                background: '#FFF', border: '2px inset #808080',
                maxHeight: 150, overflowY: 'auto', zIndex: 9999,
              }}>
                {searching ? (
                  <div style={{ padding: 8, color: '#666', fontSize: 10 }}>Searching...</div>
                ) : (
                  searchResults.map(p => (
                    <div
                      key={p.id}
                      onClick={() => selectPlayer(p)}
                      style={{
                        padding: '4px 8px', cursor: 'pointer', fontSize: 11,
                        borderBottom: '1px solid #E0E0E0',
                        display: 'flex', justifyContent: 'space-between',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#000080'; e.currentTarget.style.color = '#FFF' }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#FFF'; e.currentTarget.style.color = '#000' }}
                    >
                      <span>{p.name}</span>
                      <span style={{ opacity: 0.6, fontSize: 10 }}>{p.teamAbbr}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div>
            <div style={labelStyle}>Season</div>
            <select
              value={season}
              onChange={e => setSeason(e.target.value)}
              style={{ ...inputStyle, marginTop: 2, width: 85, cursor: 'pointer' }}
            >
              {SEASONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Quick Select */}
        <div style={{ padding: '0 6px 5px', display: 'flex', flexWrap: 'wrap', gap: 3, background: '#C0C0C0' }}>
          {POPULAR_PLAYERS.map(p => (
            <button
              key={p.id}
              onClick={() => selectPlayer(p)}
              style={selectedPlayer.id === p.id ? {
                ...btnBase, fontSize: 9, padding: '2px 5px',
                border: '2px inset #808080', background: '#000080', color: '#FFF',
              } : {
                ...btnBase, fontSize: 9, padding: '2px 5px',
              }}
            >
              {p.name.split(' ').pop()}
            </button>
          ))}
        </div>
      </div>

      {/* Game Navigator */}
      {!loading && !error && games.length > 0 && (
        <div style={{
          ...panelStyle,
          padding: '4px 6px',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}>
          {/* View mode toggle */}
          <button
            onClick={() => setViewMode(viewMode === 'game' ? 'season' : 'game')}
            style={viewMode === 'season' ? {
              ...btnBase, fontSize: 9, padding: '2px 5px',
              border: '2px inset #808080', background: '#800080', color: '#FFF',
            } : {
              ...btnBase, fontSize: 9, padding: '2px 5px',
            }}
            title={viewMode === 'game' ? 'Show all games' : 'Show single game'}
          >
            {viewMode === 'season' ? 'SEASON' : 'GAME'}
          </button>

          <div style={{ width: 1, height: 20, background: '#808080' }} />

          {viewMode === 'game' ? (
            <>
              {/* Navigation buttons */}
              <button
                onClick={goNewestGame}
                disabled={gameIndex === 0}
                style={gameIndex === 0 ? btnDisabled : navBtn}
                title="Latest game"
              >
                {'<<'}
              </button>
              <button
                onClick={goNewerGame}
                disabled={gameIndex === 0}
                style={gameIndex === 0 ? btnDisabled : navBtn}
                title="Newer game"
              >
                {'<'}
              </button>

              {/* Game info */}
              <div style={{
                flex: 1,
                textAlign: 'center',
                fontFamily: 'Courier New, monospace',
                fontSize: 11,
                fontWeight: 'bold',
                color: '#000080',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                padding: '0 4px',
              }}>
                {currentGame && (
                  <>
                    <span>{formatDate(currentGame.date)}</span>
                    <span style={{ margin: '0 6px', color: '#666' }}>|</span>
                    <span>{getMatchupLabel(currentGame)}</span>
                  </>
                )}
              </div>

              <button
                onClick={goOlderGame}
                disabled={gameIndex >= games.length - 1}
                style={gameIndex >= games.length - 1 ? btnDisabled : navBtn}
                title="Older game"
              >
                {'>'}
              </button>
              <button
                onClick={goOldestGame}
                disabled={gameIndex >= games.length - 1}
                style={gameIndex >= games.length - 1 ? btnDisabled : navBtn}
                title="Oldest game"
              >
                {'>>'}
              </button>

              {/* Game counter */}
              <div style={{
                fontSize: 9,
                color: '#555',
                whiteSpace: 'nowrap',
                marginLeft: 2,
              }}>
                {gameIndex + 1}/{games.length}
              </div>
            </>
          ) : (
            <div style={{
              flex: 1,
              textAlign: 'center',
              fontFamily: 'Courier New, monospace',
              fontSize: 11,
              fontWeight: 'bold',
              color: '#800080',
            }}>
              ALL {games.length} GAMES &middot; {allShots.length} TOTAL SHOTS
            </div>
          )}
        </div>
      )}

      {/* Stats Bar */}
      {!loading && !error && (
        <div style={{
          ...panelStyle,
          display: 'flex',
          justifyContent: 'space-around',
          padding: '4px 4px',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ ...labelStyle, color: '#000080' }}>FG</div>
            <div style={{ fontFamily: 'Courier New, monospace', fontSize: 12, fontWeight: 'bold' }}>
              {stats.made}/{stats.attempted}
            </div>
            <div style={{ fontFamily: 'Courier New, monospace', fontSize: 12, fontWeight: 'bold', color: '#000080' }}>
              {stats.pct}%
            </div>
          </div>
          <div style={{ width: 1, background: '#808080' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ ...labelStyle, color: '#006600' }}>2PT</div>
            <div style={{ fontFamily: 'Courier New, monospace', fontSize: 12, fontWeight: 'bold' }}>
              {stats.twoPtMade}/{stats.twoPtAtt}
            </div>
            <div style={{ fontFamily: 'Courier New, monospace', fontSize: 12, fontWeight: 'bold', color: '#006600' }}>
              {stats.twoPtPct}%
            </div>
          </div>
          <div style={{ width: 1, background: '#808080' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ ...labelStyle, color: '#CC6600' }}>3PT</div>
            <div style={{ fontFamily: 'Courier New, monospace', fontSize: 12, fontWeight: 'bold' }}>
              {stats.threePtMade}/{stats.threePtAtt}
            </div>
            <div style={{ fontFamily: 'Courier New, monospace', fontSize: 12, fontWeight: 'bold', color: '#CC6600' }}>
              {stats.threePtPct}%
            </div>
          </div>
        </div>
      )}

      {/* Filter Controls */}
      <div style={{
        ...panelStyle,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '3px 6px',
      }}>
        <div style={{ display: 'flex', gap: 3 }}>
          {(['all', '2pt', '3pt'] as const).map(f => (
            <button
              key={f}
              onClick={() => setShotFilter(f)}
              style={shotFilter === f ? btnActive : btnBase}
            >
              {f === 'all' ? 'ALL' : f.toUpperCase()}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 3, cursor: 'pointer', fontSize: 10 }}>
            <input type="checkbox" checked={showMade} onChange={e => setShowMade(e.target.checked)} style={{ accentColor: '#22C55E' }} />
            <span style={{ color: '#166534' }}>Made</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 3, cursor: 'pointer', fontSize: 10 }}>
            <input type="checkbox" checked={showMissed} onChange={e => setShowMissed(e.target.checked)} style={{ accentColor: '#EF4444' }} />
            <span style={{ color: '#991B1B' }}>Missed</span>
          </label>
        </div>
        <div style={{ fontSize: 9, color: '#555' }}>
          {filteredShots.length} shots
        </div>
      </div>

      {/* Court Canvas */}
      <div style={{
        flex: 1,
        background: '#C0C0C0',
        border: '2px inset #808080',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        minHeight: 0,
      }}>
        {loading ? (
          <div style={{
            color: '#000080', fontSize: 13, fontWeight: 'bold',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          }}>
            <div>Loading shot data...</div>
            <div style={{ width: 120, height: 16, border: '2px inset #808080', background: '#FFF', padding: 2 }}>
              <div style={{ height: '100%', background: '#000080', animation: 'load 1.5s ease-in-out infinite', width: '60%' }} />
            </div>
          </div>
        ) : error ? (
          <div style={{ color: '#CC0000', fontSize: 12, textAlign: 'center', padding: 16 }}>
            <div style={{ fontWeight: 'bold', marginBottom: 8 }}>Error</div>
            <div>{error}</div>
            <button onClick={() => fetchShots(selectedPlayer.id, season)} style={{ ...btnBase, marginTop: 12 }}>Retry</button>
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            width={500}
            height={470}
            onMouseMove={handleCanvasMouseMove}
            onMouseLeave={() => setHoverInfo(null)}
            style={{
              border: '1px solid #333',
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              cursor: 'crosshair',
            }}
          />
        )}

        {/* Tooltip */}
        {hoverInfo && (
          <div style={{
            position: 'absolute',
            left: Math.min(hoverInfo.x + 12, 500 - 120),
            top: Math.max(hoverInfo.y - 50, 4),
            background: 'rgba(0,0,0,0.85)',
            color: '#FFF',
            padding: '5px 8px',
            fontSize: 9,
            border: '1px solid #666',
            pointerEvents: 'none',
            zIndex: 100,
            whiteSpace: 'nowrap',
          }}>
            <div style={{ fontWeight: 'bold', color: hoverInfo.shot.made ? '#4ADE80' : '#F87171' }}>
              {hoverInfo.shot.made ? 'MADE' : 'MISSED'}
            </div>
            <div>{hoverInfo.shot.type}</div>
            <div>{hoverInfo.shot.distance}ft &middot; {hoverInfo.shot.zone}</div>
          </div>
        )}

        {/* Legend */}
        {!loading && !error && (
          <div style={{
            position: 'absolute', bottom: 6, right: 6,
            background: 'rgba(0,0,0,0.8)', border: '1px solid #555',
            padding: '4px 7px', color: 'white', fontSize: 9,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
              <div style={{ width: 8, height: 8, background: 'rgba(34,197,94,0.8)', borderRadius: '50%' }} />
              <span>Made</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 8, height: 8, background: 'rgba(239,68,68,0.7)', borderRadius: '50%' }} />
              <span>Missed</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
