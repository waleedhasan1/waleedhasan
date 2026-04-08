'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'

// Dynamically import the map component (Leaflet needs window)
const MapComponentInline = dynamic(() => import('./components/MapComponentInline'), {
  ssr: false,
  loading: () => <div style={{ padding: 20, textAlign: 'center' }}>Loading map...</div>
})

const AlbumBattleInline = dynamic(() => import('./components/AlbumBattleInline'), {
  ssr: false,
  loading: () => <div style={{ padding: 20, textAlign: 'center' }}>Loading album battle...</div>
})

const AlbumLeaderboardInline = dynamic(() => import('./components/AlbumLeaderboardInline'), {
  ssr: false,
  loading: () => <div style={{ padding: 20, textAlign: 'center' }}>Loading leaderboard...</div>
})

const PaintAppInline = dynamic(() => import('./components/SharedPaintAppInline'), {
  ssr: false,
  loading: () => <div style={{ padding: 20, textAlign: 'center' }}>Loading paint...</div>
})

const ChatAppInline = dynamic(() => import('./components/ChatAppInline'), {
  ssr: false,
  loading: () => <div style={{ padding: 20, textAlign: 'center' }}>Loading chat...</div>
})

const IPodInline = dynamic(() => import('./components/IPodInline'), {
  ssr: false,
  loading: () => <div style={{ padding: 20, textAlign: 'center' }}>Loading iPod...</div>
})

const SnakeGameInline = dynamic(() => import('./components/SnakeGameInline'), {
  ssr: false,
  loading: () => <div style={{ padding: 20, textAlign: 'center' }}>Loading Snake...</div>
})

const WeatherRadarInline = dynamic(() => import('./components/WeatherRadarInline'), {
  ssr: false,
  loading: () => <div style={{ padding: 20, textAlign: 'center' }}>Loading radar...</div>
})

const BikeGameInline = dynamic(() => import('./components/BikeGameInline'), {
  ssr: false,
  loading: () => <div style={{ padding: 20, textAlign: 'center' }}>Loading bike game...</div>
})

const NBAShortChartInline = dynamic(() => import('./components/NBAShortChartInline'), {
  ssr: false,
  loading: () => <div style={{ padding: 20, textAlign: 'center' }}>Loading shot chart...</div>
})

const StrudelInline = dynamic(() => import('./components/StrudelInline'), {
  ssr: false,
  loading: () => <div style={{ padding: 20, textAlign: 'center' }}>Loading Strudel...</div>
})

const RentMapInline = dynamic(() => import('./components/RentMapInline'), {
  ssr: false,
  loading: () => <div style={{ padding: 20, textAlign: 'center' }}>Loading rent map...</div>
})

const CompFinderInline = dynamic(() => import('./components/CompFinderInline'), {
  ssr: false,
  loading: () => <div style={{ padding: 20, textAlign: 'center' }}>Loading comp finder...</div>
})

const VenueMapInline = dynamic(() => import('./components/VenueMapInline'), {
  ssr: false,
  loading: () => <div style={{ padding: 20, textAlign: 'center' }}>Loading venue map...</div>
})

const EggPriceMapInline = dynamic(() => import('./components/EggPriceMapInline'), {
  ssr: false,
  loading: () => <div style={{ padding: 20, textAlign: 'center' }}>Loading egg prices...</div>
})

const GhostBusMapInline = dynamic(() => import('./components/GhostBusMapInline'), {
  ssr: false,
  loading: () => <div style={{ padding: 20, textAlign: 'center' }}>Loading ghost bus map...</div>
})

const SeventeenSquaresInline = dynamic(() => import('./components/SeventeenSquaresInline'), {
  ssr: false,
  loading: () => <div style={{ padding: 20, textAlign: 'center' }}>Loading 17 squares...</div>
})

interface Window {
  title: string
  icon: string
  pos: { top: number; left: number }
  size: { width: number; height?: number }
  content: React.ReactNode
}

export default function Portfolio() {
  const [time, setTime] = useState('')
  const [openWindows, setOpenWindows] = useState<string[]>([])
  const [minimizedWindows, setMinimizedWindows] = useState<string[]>([])
  const [dragging, setDragging] = useState<string | null>(null)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [iconPositions, setIconPositions] = useState<Record<string, { x: number; y: number }>>({})
  const [windowZIndex, setWindowZIndex] = useState<Record<string, number>>({})
  const [highestZIndex, setHighestZIndex] = useState(100)
  const [isMobile, setIsMobile] = useState(false)
  const [startMenuOpen, setStartMenuOpen] = useState(false)
  const [taskbarOrder, setTaskbarOrder] = useState<string[]>([])
  const [taskbarDrag, setTaskbarDrag] = useState<string | null>(null)
  const [taskbarDragOver, setTaskbarDragOver] = useState<string | null>(null)
  const startMenuRef = useRef<HTMLDivElement>(null)
  const startBtnRef = useRef<HTMLButtonElement>(null)

  // Detect mobile on mount
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    const updateClock = () => {
      const now = new Date()
      const hours = now.getHours() % 12 || 12
      const minutes = now.getMinutes().toString().padStart(2, '0')
      const ampm = now.getHours() >= 12 ? 'PM' : 'AM'
      setTime(`${hours}:${minutes} ${ampm}`)
    }
    updateClock()
    const interval = setInterval(updateClock, 1000)
    
    setTimeout(() => openWindow('about'), 2500)
    
    return () => clearInterval(interval)
  }, [])

  const bringToFront = (windowId: string) => {
    const newZIndex = highestZIndex + 1
    setWindowZIndex(prev => ({
      ...prev,
      [windowId]: newZIndex
    }))
    setHighestZIndex(newZIndex)
  }

  const openWindow = (windowId: string) => {
    if (!openWindows.includes(windowId)) {
      setOpenWindows([...openWindows, windowId])
      setTaskbarOrder(prev => prev.includes(windowId) ? prev : [...prev, windowId])
    }
    setMinimizedWindows(prev => prev.filter(id => id !== windowId))
    bringToFront(windowId)
  }

  const closeWindow = (windowId: string) => {
    setOpenWindows(openWindows.filter(id => id !== windowId))
    setTaskbarOrder(prev => prev.filter(id => id !== windowId))
  }

  const minimizeWindow = (windowId: string) => {
    if (!minimizedWindows.includes(windowId)) {
      setMinimizedWindows([...minimizedWindows, windowId])
    }
  }

  const restoreWindow = (windowId: string) => {
    setMinimizedWindows(minimizedWindows.filter(id => id !== windowId))
  }

  const startDrag = (e: React.MouseEvent, windowId: string) => {
    if ((e.target as HTMLElement).closest('.window-button')) return
    const rect = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect()
    setDragging(windowId)
    setOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
    bringToFront(windowId)
  }

  const startIconDrag = (e: React.MouseEvent, iconId: string) => {
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    setDragging(`icon-${iconId}`)
    setOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (dragging) {
      if (dragging.startsWith('icon-')) {
        // Dragging an icon
        const iconId = dragging.replace('icon-', '')
        const iconEl = document.getElementById(`icon-${iconId}`)
        if (iconEl) {
          iconEl.style.left = (e.clientX - offset.x) + 'px'
          iconEl.style.top = (e.clientY - offset.y) + 'px'
        }
      } else {
        // Dragging a window
        const windowEl = document.getElementById(`window-${dragging}`)
        if (windowEl) {
          windowEl.style.left = (e.clientX - offset.x) + 'px'
          windowEl.style.top = (e.clientY - offset.y) + 'px'
        }
      }
    }
  }

  const handleMouseUp = (e: MouseEvent) => {
    if (dragging && dragging.startsWith('icon-')) {
      // Save icon position
      const iconId = dragging.replace('icon-', '')
      const iconEl = document.getElementById(`icon-${iconId}`)
      if (iconEl) {
        const rect = iconEl.getBoundingClientRect()
        setIconPositions(prev => ({
          ...prev,
          [iconId]: { x: rect.left, y: rect.top }
        }))
      }
    }
    setDragging(null)
  }

  useEffect(() => {
    if (dragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [dragging, offset])

  // Close start menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        startMenuOpen &&
        startMenuRef.current && !startMenuRef.current.contains(e.target as Node) &&
        startBtnRef.current && !startBtnRef.current.contains(e.target as Node)
      ) {
        setStartMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [startMenuOpen])

  const startMenuItems = [
    { section: 'Programs', items: [
      { id: 'ctamap', label: 'CTA Train Map' },
      { id: 'albumbattle', label: 'Album Ranker' },
      { id: 'nbashotchart', label: 'NBA Shot Chart' },
      { id: 'rentmap', label: 'Chicago Rent Map' },
      { id: 'compfinder', label: 'NYC Comp Finder' },
      { id: 'venuemap', label: 'Chicago Venues' },
      { id: 'eggprices', label: 'Egg Price Map' },
      { id: 'ghostbuses', label: 'Ghost Bus Map' },
      { id: 'radar', label: 'Weather Radar' },
      { id: 'paint', label: 'Paint' },
      { id: 'chat', label: 'Chat Room' },
    ]},
    { section: 'Games', items: [
      { id: 'snake', label: 'Snake' },
      { id: 'bikegame', label: 'Bike Game' },
    ]},
    { section: 'Media', items: [
      { id: 'ipod', label: 'MP3 Player' },
      { id: 'strudel', label: 'Strudel Live Coder' },
      { id: 'leaderboard', label: 'Album Leaderboard' },
    ]},
  ]

  const openFromStartMenu = (id: string) => {
    openWindow(id)
    setStartMenuOpen(false)
  }

  const windows: Record<string, Window> = {
    about: {
      title: 'About Me',
      icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cpath fill='%23C0C0C0' d='M2 2h28v28H2z'/%3E%3Cpath fill='%23000080' d='M4 4h24v24H4z'/%3E%3Ccircle fill='%23FFCC99' cx='16' cy='12' r='4'/%3E%3Cpath fill='%23FFCC99' d='M10 20h12v6H10z'/%3E%3Cpath fill='%23FFF' d='M5 5h22v1H5zm0 21h22v1H5zM5 5h1v22H5zm21 0h1v22h-1z'/%3E%3C/svg%3E",
      pos: { top: 60, left: 300 },
      size: { width: 500, height: 600 },
      content: (
        <div style={{ fontFamily: 'Perfect DOS VGA 437, monospace', fontSize: 16, color: '#000', background: '#008080', padding: 16, letterSpacing: '0.5px', height: '100%', overflowY: 'auto' }}>
          <div style={{ 
            textAlign: 'center', 
            marginBottom: 16,
            background: '#C0C0C0',
            border: '2px outset #DFDFDF',
            padding: 12,
            boxShadow: '2px 2px 0 rgba(0,0,0,0.3)'
          }}>
            <img 
              src="/profilepic.png" 
              alt="Waleed Hasan" 
              style={{ 
                width: 150, 
                height: 150, 
                objectFit: 'cover', 
                border: '2px solid #808080', 
                boxShadow: '2px 2px 0 rgba(0,0,0,0.5)' 
              }} 
            />
          </div>
          
          <div style={{ 
            background: '#C0C0C0',
            border: '2px outset #DFDFDF',
            padding: 16,
            marginBottom: 12,
            boxShadow: '2px 2px 0 rgba(0,0,0,0.3)'
          }}>
            <div style={{
              background: '#000080',
              color: 'white',
              padding: '6px 8px',
              marginBottom: 12,
              fontWeight: 'bold',
              fontSize: 18,
              letterSpacing: '1px'
            }}>
              👋 Welcome!
            </div>
            <p style={{ margin: 0, lineHeight: '1.8', color: '#000' }}>
              Hi! My name is Waleed Hasan, Thank you for visiting my Page! I am a Developer based out of Chicago. I really like cities and transit, and like making projects that show off how transit works in cities and how transit affects cities through different metrics, I also like making music!
            </p>
          </div>

          <div style={{ 
            background: '#C0C0C0',
            border: '2px outset #DFDFDF',
            padding: 16,
            marginBottom: 12,
            boxShadow: '2px 2px 0 rgba(0,0,0,0.3)'
          }}>
            <div style={{
              background: '#000080',
              color: 'white',
              padding: '6px 8px',
              marginBottom: 12,
              fontWeight: 'bold',
              fontSize: 18,
              letterSpacing: '1px'
            }}>
              Background
            </div>
            <p style={{ margin: 0, lineHeight: '1.8', color: '#000' }}>
              I recently graduated from the University of Illinois at Chicago, there I have found a love for statistics and data, as well as helping out with the newspaper and radio from time to time. Math is Music!
            </p>
          </div>

          <div style={{ 
            background: '#C0C0C0',
            border: '2px outset #DFDFDF',
            padding: 16,
            boxShadow: '2px 2px 0 rgba(0,0,0,0.3)'
          }}>
            <div style={{
              background: '#000080',
              color: 'white',
              padding: '6px 8px',
              marginBottom: 12,
              fontWeight: 'bold',
              fontSize: 18,
              letterSpacing: '1px'
            }}>
              Things I Have Done
            </div>
            <ul style={{ margin: '0', paddingLeft: 24, lineHeight: '2', color: '#000' }}>
              <li style={{ marginBottom: 10 }}>Helped my friends at Kaleida health automate a pump report system, allowing a weekly meeting to be removed, saving over 50 staff members hours of time</li>
              <li style={{ marginBottom: 10 }}>Helped my friends at the Electronic Visualization Facility create automated data collection, sorting, cleaning system, that scraped google scholar pages of researchers, allowing for automatic bias detection</li>
              <li style={{ marginBottom: 10 }}>Helped my friends at the Bonfire Newspaper create an online polling and data tracking system</li>
              <li style={{ marginBottom: 10 }}>Helped my friends at Charred Fork set up their initial website for their lovely bbq restaurant</li>
            </ul>
          </div>
        </div>
      )
    },
    ctamap: {
      title: 'CTA Train Map',
      icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cpath fill='%23FFCC00' d='M3 6h10l2 3h14v17H3z'/%3E%3Cpath fill='%23FFE066' d='M3 6h10l2 3h14v2H3z'/%3E%3Cpath fill='%23CC9900' d='M3 25h26v1H3z'/%3E%3Cpath fill='%23FF0000' d='M8 14h3v8H8z'/%3E%3Cpath fill='%230000FF' d='M13 16h3v6h-3z'/%3E%3Cpath fill='%2300AA00' d='M18 13h3v9h-3z'/%3E%3C/svg%3E",
      pos: { top: 50, left: 100 },
      size: { width: 1000, height: 700 },
      content: (
        <div style={{ height: '100%', width: '100%', padding: 0, margin: 0 }}>
          <MapComponentInline />
        </div>
      )
    },
    albumbattle: {
      title: 'Album Ranker',
      icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ccircle fill='%23E0E0E0' cx='16' cy='16' r='13'/%3E%3Ccircle fill='%23FFD700' cx='16' cy='16' r='10'/%3E%3Ccircle fill='%23333' cx='16' cy='16' r='4'/%3E%3Cpath fill='%23FFD700' d='M14 4h4v3l-2 2-2-2z'/%3E%3Cpath fill='%23FFA500' d='M13 6h6v1h-6z'/%3E%3C/svg%3E",
      pos: { top: 80, left: 150 },
      size: { width: 900, height: 650 },
      content: (
        <div style={{ height: '100%', width: '100%', padding: 0, margin: 0 }}>
          <AlbumBattleInline openLeaderboard={() => openWindow('leaderboard')} />
        </div>
      )
    },
    leaderboard: {
      title: 'Album Leaderboard',
      icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect fill='%23FFAA00' width='32' height='32'/%3E%3Crect fill='%23FFD700' x='12' y='6' width='8' height='4'/%3E%3Cpath fill='%23FFD700' d='M14 10 L16 6 L18 10 Z'/%3E%3Crect fill='%23FFF' x='6' y='16' width='20' height='10'/%3E%3Crect fill='%23C0C0C0' x='4' y='22' width='4' height='4'/%3E%3Crect fill='%23C0C0C0' x='24' y='22' width='4' height='4'/%3E%3C/svg%3E",
      pos: { top: 110, left: 200 },
      size: { width: 900, height: 650 },
      content: (
        <div style={{ height: '100%', width: '100%', padding: 0, margin: 0 }}>
          <AlbumLeaderboardInline openBattle={() => openWindow('albumbattle')} />
        </div>
      )
    },
    paint: {
      title: 'Paint',
      icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cellipse fill='%23C0C0C0' cx='16' cy='18' rx='13' ry='11'/%3E%3Cellipse fill='%23E0E0E0' cx='16' cy='17' rx='12' ry='10'/%3E%3Ccircle fill='%23FF0000' cx='10' cy='14' r='2'/%3E%3Ccircle fill='%230000FF' cx='16' cy='12' r='2'/%3E%3Ccircle fill='%23FFFF00' cx='22' cy='14' r='2'/%3E%3Ccircle fill='%2300FF00' cx='13' cy='19' r='2'/%3E%3Ccircle fill='%23FF00FF' cx='19' cy='19' r='2'/%3E%3Crect fill='%23A0826D' x='14' y='2' width='4' height='12' rx='2'/%3E%3C/svg%3E",
      pos: { top: 60, left: 250 },
      size: { width: 900, height: 700 },
      content: (
        <div style={{ height: '100%', width: '100%', padding: 0, margin: 0 }}>
          <PaintAppInline />
        </div>
      )
    },
    chat: {
      title: 'Chat Room',
      icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect fill='%23FFDD88' x='4' y='6' width='24' height='16' rx='2'/%3E%3Cpath fill='%23FFDD88' d='M12 22l4 4 4-4z'/%3E%3Cpath fill='%23000' d='M8 11h16M8 14h12M8 17h14' stroke='%23000' stroke-width='1.5'/%3E%3Cpath fill='%23FFF' d='M5 7h22v1H5z'/%3E%3C/svg%3E",
      pos: { top: 80, left: 300 },
      size: { width: 600, height: 650 },
      content: (
        <div style={{ height: '100%', width: '100%', padding: 0, margin: 0 }}>
          <ChatAppInline />
        </div>
      )
    },
    ipod: {
      title: 'MP3 Player',
      icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect fill='%23333' width='32' height='32' rx='2'/%3E%3Ccircle fill='%23666' cx='8' cy='16' r='6'/%3E%3Ccircle fill='%23000' cx='8' cy='16' r='4'/%3E%3Ccircle fill='%23666' cx='24' cy='16' r='6'/%3E%3Ccircle fill='%23000' cx='24' cy='16' r='4'/%3E%3Crect fill='%2300AA00' x='12' y='8' width='8' height='6'/%3E%3Crect fill='%23004400' x='12' y='10' width='8' height='2'/%3E%3Crect fill='%23666' x='14' y='16' width='2' height='4'/%3E%3Crect fill='%23666' x='18' y='16' width='2' height='4'/%3E%3Crect fill='%23C0C0C0' x='13' y='4' width='6' height='2'/%3E%3C/svg%3E",
      pos: { top: 120, left: 400 },
      size: { width: 400, height: 600 },
      content: (
        <div style={{ height: '100%', width: '100%', padding: 0, margin: 0 }}>
          <IPodInline />
        </div>
      )
    },
    radar: {
      title: 'Weather Radar',
      icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect fill='%23008080' width='32' height='32'/%3E%3Ccircle fill='%23006666' cx='16' cy='16' r='12'/%3E%3Ccircle fill='%23004444' cx='16' cy='16' r='9'/%3E%3Ccircle fill='%23003333' cx='16' cy='16' r='6'/%3E%3Cpath fill='%2300FF00' d='M16 16L26 10' stroke='%2300FF00' stroke-width='2'/%3E%3Ccircle fill='%23FF0000' cx='22' cy='12' r='2'/%3E%3Ccircle fill='%23FFFF00' cx='12' cy='20' r='1.5'/%3E%3C/svg%3E",
      pos: { top: 70, left: 200 },
      size: { width: 900, height: 700 },
      content: (
        <div style={{ height: '100%', width: '100%', padding: 0, margin: 0 }}>
          <WeatherRadarInline />
        </div>
      )
    },
    snake: {
      title: 'Snake Game',
      icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect fill='%23666' width='32' height='32' rx='2'/%3E%3Crect fill='%23444' x='2' y='4' width='28' height='20' rx='1'/%3E%3Crect fill='%2300AA00' x='4' y='6' width='24' height='16'/%3E%3Crect fill='%2300FF00' x='8' y='12' width='3' height='3'/%3E%3Crect fill='%2300FF00' x='11' y='12' width='3' height='3'/%3E%3Crect fill='%2300FF00' x='14' y='15' width='3' height='3'/%3E%3Crect fill='%23FF0000' x='20' cy='10' width='3' height='3'/%3E%3Ctext x='16' y='30' text-anchor='middle' fill='%23FFF' font-size='6' font-family='Arial'>SNAKE%3C/text%3E%3C/svg%3E",
      pos: { top: 100, left: 350 },
      size: { width: 500, height: 600 },
      content: (
        <div style={{ height: '100%', width: '100%', padding: 0, margin: 0 }}>
          <SnakeGameInline />
        </div>
      )
    },
    bikegame: {
      title: 'Bike Game',
      icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect fill='%233a3a3a' width='32' height='32' rx='2'/%3E%3Ccircle fill='none' stroke='%23C0C0C0' stroke-width='2' cx='10' cy='22' r='5'/%3E%3Ccircle fill='none' stroke='%23C0C0C0' stroke-width='2' cx='22' cy='22' r='5'/%3E%3Cpath fill='none' stroke='%23FFD700' stroke-width='2' d='M10 22L14 14L18 14L22 22'/%3E%3Ccircle fill='%23FFCC99' cx='14' cy='10' r='3'/%3E%3Cpath fill='%23ddcc00' d='M4 28h24v2H4z'/%3E%3C/svg%3E",
      pos: { top: 80, left: 200 },
      size: { width: 900, height: 700 },
      content: (
        <div style={{ height: '100%', width: '100%', padding: 0, margin: 0 }}>
          <BikeGameInline />
        </div>
      )
    },
    nbashotchart: {
      title: 'NBA Shot Chart',
      icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect fill='%23F4A460' width='32' height='32' rx='2'/%3E%3Ccircle fill='none' stroke='%23000' stroke-width='1.5' cx='16' cy='16' r='10'/%3E%3Ccircle fill='none' stroke='%23000' stroke-width='1.5' cx='16' cy='16' r='5'/%3E%3Crect fill='%23000' x='6' y='15' width='20' height='2'/%3E%3Crect fill='%23000' x='15' y='6' width='2' height='20'/%3E%3Ccircle fill='%2300CC00' cx='12' cy='12' r='2'/%3E%3Ccircle fill='%23CC0000' cx='20' cy='10' r='2'/%3E%3Ccircle fill='%2300CC00' cx='22' cy='20' r='2'/%3E%3Ccircle fill='%23CC0000' cx='10' cy='22' r='2'/%3E%3C/svg%3E",
      pos: { top: 90, left: 250 },
      size: { width: 620, height: 750 },
      content: (
        <div style={{ height: '100%', width: '100%', padding: 0, margin: 0 }}>
          <NBAShortChartInline />
        </div>
      )
    },
    strudel: {
      title: 'Strudel Live Coder',
      icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect fill='%23222' width='32' height='32' rx='2'/%3E%3Crect fill='%23333' x='2' y='2' width='28' height='28' rx='1'/%3E%3Cpath d='M6 20 L10 12 L14 18 L18 8 L22 16 L26 10' stroke='%2300FF88' stroke-width='2' fill='none'/%3E%3Ccircle fill='%23FF00FF' cx='8' cy='24' r='2'/%3E%3Ccircle fill='%2300FFFF' cx='16' cy='24' r='2'/%3E%3Ccircle fill='%23FFFF00' cx='24' cy='24' r='2'/%3E%3Ctext x='16' y='7' text-anchor='middle' fill='%2300FF88' font-size='5' font-family='monospace'%3E&gt;_%3C/text%3E%3C/svg%3E",
      pos: { top: 70, left: 180 },
      size: { width: 700, height: 550 },
      content: (
        <div style={{ height: '100%', width: '100%', padding: 0, margin: 0 }}>
          <StrudelInline />
        </div>
      )
    },
    rentmap: {
      title: 'Chicago Rent Map',
      icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect fill='%23C0C0C0' width='32' height='32' rx='2'/%3E%3Crect fill='%232b83ba' x='4' y='20' width='5' height='8'/%3E%3Crect fill='%23abdda4' x='10' y='16' width='5' height='12'/%3E%3Crect fill='%23fdae61' x='17' y='10' width='5' height='18'/%3E%3Crect fill='%23d7191c' x='23' y='4' width='5' height='24'/%3E%3Cpath fill='%23333' d='M2 28h28v2H2z'/%3E%3C/svg%3E",
      pos: { top: 60, left: 150 },
      size: { width: 900, height: 700 },
      content: (
        <div style={{ height: '100%', width: '100%', padding: 0, margin: 0 }}>
          <RentMapInline />
        </div>
      )
    },
    compfinder: {
      title: 'NYC Comp Finder',
      icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect fill='%23C0C0C0' width='32' height='32' rx='2'/%3E%3Crect fill='%23000080' x='3' y='3' width='26' height='26' rx='1'/%3E%3Crect fill='%23FFF' x='5' y='5' width='22' height='22'/%3E%3Crect fill='%23E8E8E8' x='5' y='5' width='22' height='4'/%3E%3Ccircle fill='%23FFD700' cx='12' cy='16' r='3' stroke='%23000' stroke-width='1'/%3E%3Ccircle fill='%232e7d32' cx='20' cy='12' r='2' stroke='%23000' stroke-width='0.5'/%3E%3Ccircle fill='%232e7d32' cx='22' cy='20' r='2' stroke='%23000' stroke-width='0.5'/%3E%3Ccircle fill='%23f9a825' cx='8' cy='22' r='2' stroke='%23000' stroke-width='0.5'/%3E%3Cpath stroke='%23666' stroke-width='0.8' stroke-dasharray='2 2' d='M12 16L20 12M12 16L22 20M12 16L8 22'/%3E%3C/svg%3E",
      pos: { top: 50, left: 120 },
      size: { width: 1000, height: 700 },
      content: (
        <div style={{ height: '100%', width: '100%', padding: 0, margin: 0 }}>
          <CompFinderInline />
        </div>
      )
    },
    venuemap: {
      title: 'Chicago Venues',
      icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect fill='%23C0C0C0' width='32' height='32' rx='2'/%3E%3Crect fill='%23000080' x='3' y='3' width='26' height='26' rx='1'/%3E%3Crect fill='%23FFF' x='5' y='5' width='22' height='22'/%3E%3Ccircle fill='%23DC143C' cx='12' cy='12' r='2.5'/%3E%3Ccircle fill='%23DAA520' cx='20' cy='10' r='2.5'/%3E%3Ccircle fill='%238B00FF' cx='10' cy='20' r='2.5'/%3E%3Ccircle fill='%23FF6600' cx='22' cy='18' r='2.5'/%3E%3Ccircle fill='%2332CD32' cx='16' cy='22' r='2.5'/%3E%3Ccircle fill='%23000080' cx='16' cy='15' r='2.5'/%3E%3C/svg%3E",
      pos: { top: 50, left: 120 },
      size: { width: 1000, height: 700 },
      content: (
        <div style={{ height: '100%', width: '100%', padding: 0, margin: 0 }}>
          <VenueMapInline />
        </div>
      )
    },
    eggprices: {
      title: 'Egg Price Map',
      icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect fill='%23C0C0C0' width='32' height='32' rx='2'/%3E%3Crect fill='%23228B22' x='3' y='3' width='26' height='26' rx='1'/%3E%3Cellipse fill='%23FFFDE8' cx='11' cy='14' rx='4' ry='5'/%3E%3Cellipse fill='%23FFF5D0' cx='21' cy='14' rx='4' ry='5'/%3E%3Cellipse fill='%23FFECB0' cx='16' cy='20' rx='4' ry='5'/%3E%3Ctext x='16' y='10' text-anchor='middle' fill='%23FFF' font-size='7' font-weight='bold' font-family='Arial'%3E$%3C/text%3E%3C/svg%3E",
      pos: { top: 50, left: 120 },
      size: { width: 1000, height: 700 },
      content: (
        <div style={{ height: '100%', width: '100%', padding: 0, margin: 0 }}>
          <EggPriceMapInline />
        </div>
      )
    },
    seventeensquares: {
      title: '17 Squares',
      icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect fill='%23001a1a' width='32' height='32' rx='2'/%3E%3Crect fill='none' stroke='%23ffffff' stroke-width='1.5' x='5' y='5' width='22' height='22'/%3E%3Crect fill='%23e63946' x='7' y='7' width='5' height='5'/%3E%3Crect fill='%23f4a261' x='13' y='7' width='5' height='5'/%3E%3Crect fill='%23e9c46a' x='19' y='7' width='5' height='5'/%3E%3Crect fill='%232a9d8f' x='7' y='13' width='5' height='5'/%3E%3Crect fill='%238338ec' x='13' y='13' width='5' height='5'/%3E%3Crect fill='%233a86ff' x='19' y='13' width='5' height='5'/%3E%3Crect fill='%23ff006e' x='7' y='19' width='5' height='5'/%3E%3Crect fill='%23fb5607' x='13' y='19' width='5' height='5'/%3E%3Crect fill='%23ffbe0b' x='19' y='19' width='5' height='5'/%3E%3Crect fill='%23c0392b' x='4' y='3' width='24' height='2'/%3E%3C/svg%3E",
      pos: { top: 60, left: 180 },
      size: { width: 600, height: 800 },
      content: (
        <div style={{ height: '100%', width: '100%', padding: 0, margin: 0, position: 'relative' }}>
          <SeventeenSquaresInline />
        </div>
      )
    },
    ghostbuses: {
      title: 'Ghost Bus Map',
      icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect fill='%23C0C0C0' width='32' height='32' rx='2'/%3E%3Crect fill='%231a0a2e' x='3' y='3' width='26' height='26' rx='1'/%3E%3Cpath d='M16 6c-5 0-8 4-8 9v9h3v-3h2v3h2v-3h2v3h2v-3h2v3h3v-9c0-5-3-9-8-9z' fill='%236B21A8' opacity='0.9'/%3E%3Ccircle cx='13' cy='14' r='2' fill='%23FFF'/%3E%3Ccircle cx='19' cy='14' r='2' fill='%23FFF'/%3E%3Cellipse cx='16' cy='18' rx='2' ry='1' fill='%23FFF' opacity='0.5'/%3E%3C/svg%3E",
      pos: { top: 50, left: 140 },
      size: { width: 1000, height: 700 },
      content: (
        <div style={{ height: '100%', width: '100%', padding: 0, margin: 0 }}>
          <GhostBusMapInline />
        </div>
      )
    },
    projects: {
      title: 'Projects',
      icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cpath fill='%23FFCC00' d='M3 8h10l2 2h14v16H3z'/%3E%3Cpath fill='%23FFE066' d='M3 8h10l2 2h14v3H3z'/%3E%3Cpath fill='%23CC9900' d='M3 25h26v1H3z'/%3E%3Crect fill='%23FFF' x='8' y='14' width='16' height='2'/%3E%3Crect fill='%23FFF' x='8' y='17' width='12' height='2'/%3E%3Crect fill='%23FFF' x='8' y='20' width='14' height='2'/%3E%3C/svg%3E",
      pos: { top: 120, left: 120 },
      size: { width: 600, height: 500 },
      content: (
        <div style={{ 
          height: '100%', 
          background: '#008080',
          padding: 16,
          overflowY: 'auto'
        }}>
          <div style={{
            background: '#C0C0C0',
            border: '2px outset #DFDFDF',
            padding: 16,
            marginBottom: 12,
            boxShadow: '2px 2px 0 rgba(0,0,0,0.3)'
          }}>
            <div style={{
              background: '#000080',
              color: 'white',
              padding: '6px 8px',
              marginBottom: 12,
              fontWeight: 'bold',
              fontSize: 14
            }}>
              Projects
            </div>
            
            <div className="project-card" onClick={() => openWindow('compfinder')} style={{ cursor: 'pointer', marginBottom: 12 }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#000080' }}>NYC Comparable Property Finder</h4>
              <p style={{ margin: '0 0 8px 0', lineHeight: 1.6 }}>Interactive tool for identifying comparable properties across NYC using public sales data. Supports address search, price-range filtering by borough, and automated comp matching within +/-10% of sale price — similar to assessor workflows used in property valuation.</p>
              <div style={{ marginTop: 8 }}>
                <span className="skill-tag">Next.js</span>
                <span className="skill-tag">MapLibre GL</span>
                <span className="skill-tag">PostgreSQL</span>
                <span className="skill-tag">SQL</span>
                <span className="skill-tag">REST API</span>
                <span className="skill-tag">Geospatial Data</span>
              </div>
            </div>

            <div className="project-card" onClick={() => openWindow('rentmap')} style={{ cursor: 'pointer', marginBottom: 12 }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#000080' }}>Chicago Rent Map</h4>
              <p style={{ margin: '0 0 8px 0', lineHeight: 1.6 }}>Choropleth map visualizing median rent by community area using GeoJSON boundary data. Built reproducible data pipeline to clean, transform, and join census rent estimates with geographic boundaries for spatial analysis.</p>
              <div style={{ marginTop: 8 }}>
                <span className="skill-tag">MapLibre GL</span>
                <span className="skill-tag">GeoJSON</span>
                <span className="skill-tag">Data Visualization</span>
                <span className="skill-tag">Python</span>
                <span className="skill-tag">Pandas</span>
                <span className="skill-tag">Geospatial Analysis</span>
              </div>
            </div>

            <div className="project-card" onClick={() => openWindow('eggprices')} style={{ cursor: 'pointer', marginBottom: 12 }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#000080' }}>Grocery Price Comparison Map</h4>
              <p style={{ margin: '0 0 8px 0', lineHeight: 1.6 }}>Geospatial price comparison dashboard across 60 Jewel-Osco locations in Chicagoland. Color-coded markers by price tier, sortable store rankings, and per-store detail cards with Google Street View. Tracks eggs and milk with subtype filtering.</p>
              <div style={{ marginTop: 8 }}>
                <span className="skill-tag">MapLibre GL</span>
                <span className="skill-tag">Google Maps API</span>
                <span className="skill-tag">Data Analysis</span>
                <span className="skill-tag">React</span>
                <span className="skill-tag">Geospatial Data</span>
              </div>
            </div>

            <div className="project-card" onClick={() => openWindow('venuemap')} style={{ cursor: 'pointer', marginBottom: 12 }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#000080' }}>Chicago Music Venue Map</h4>
              <p style={{ margin: '0 0 8px 0', lineHeight: 1.6 }}>Interactive map of 70 Chicago live music venues with genre-based classification, curated event listings, and Google Street View integration. Multi-filter system with genre toggles, neighborhood dropdown, and text search across a geocoded dataset.</p>
              <div style={{ marginTop: 8 }}>
                <span className="skill-tag">MapLibre GL</span>
                <span className="skill-tag">Google Maps API</span>
                <span className="skill-tag">GeoJSON</span>
                <span className="skill-tag">Data Curation</span>
                <span className="skill-tag">React</span>
              </div>
            </div>

            <div className="project-card" onClick={() => openWindow('ctamap')} style={{ cursor: 'pointer', marginBottom: 12 }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#000080' }}>CTA Real-Time Train Tracker</h4>
              <p style={{ margin: '0 0 8px 0', lineHeight: 1.6 }}>Real-time transit visualization querying the CTA public API for live train positions and arrival predictions. Displays routes as GeoJSON polylines with animated train markers updated every 30 seconds.</p>
              <div style={{ marginTop: 8 }}>
                <span className="skill-tag">Public API</span>
                <span className="skill-tag">Leaflet</span>
                <span className="skill-tag">GeoJSON</span>
                <span className="skill-tag">Python</span>
                <span className="skill-tag">Pandas</span>
                <span className="skill-tag">Real-Time Data</span>
              </div>
            </div>

            <div className="project-card" onClick={() => openWindow('albumbattle')} style={{ cursor: 'pointer', marginBottom: 12 }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#000080' }}>Album Ranker (ELO Rating System)</h4>
              <p style={{ margin: '0 0 8px 0', lineHeight: 1.6 }}>Full-stack ranking application using the ELO algorithm with PostgreSQL persistence. Web-scraped album metadata, built reproducible data ingestion pipeline, and designed a leaderboard dashboard with statistical rankings.</p>
              <div style={{ marginTop: 8 }}>
                <span className="skill-tag">PostgreSQL</span>
                <span className="skill-tag">SQL</span>
                <span className="skill-tag">Python</span>
                <span className="skill-tag">Beautiful Soup</span>
                <span className="skill-tag">Web Scraping</span>
                <span className="skill-tag">Git</span>
              </div>
            </div>

            <div className="project-card" onClick={() => openWindow('nbashotchart')} style={{ cursor: 'pointer' }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#000080' }}>NBA Shot Chart Visualizer</h4>
              <p style={{ margin: '0 0 8px 0', lineHeight: 1.6 }}>Statistical shot chart tool querying the NBA stats API. Transforms raw shot coordinate data into spatial visualizations on a court diagram with made/missed filtering, player search, and season selection.</p>
              <div style={{ marginTop: 8 }}>
                <span className="skill-tag">Public API</span>
                <span className="skill-tag">Data Visualization</span>
                <span className="skill-tag">Canvas API</span>
                <span className="skill-tag">React</span>
                <span className="skill-tag">Statistical Analysis</span>
              </div>
            </div>
          </div>
        </div>
      )
    },
    skills: {
      title: 'Skills & Technologies',
      icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect fill='%23CC0000' x='4' y='12' width='24' height='14' rx='1'/%3E%3Crect fill='%23FF3333' x='4' y='12' width='24' height='3'/%3E%3Crect fill='%23999' x='12' y='8' width='8' height='5' rx='1'/%3E%3Crect fill='%23666' x='13' y='9' width='6' height='3'/%3E%3Ccircle fill='%23FFD700' cx='10' cy='19' r='2'/%3E%3Cpath fill='%23C0C0C0' d='M16 18h8v2h-8z'/%3E%3Cpath fill='%23C0C0C0' d='M16 21h6v2h-6z'/%3E%3C/svg%3E",
      pos: { top: 140, left: 140 },
      size: { width: 600, height: 550 },
      content: (
        <div style={{ 
          height: '100%', 
          background: '#008080',
          padding: 16,
          overflowY: 'auto'
        }}>
          <div style={{
            background: '#C0C0C0',
            border: '2px outset #DFDFDF',
            padding: 16,
            boxShadow: '2px 2px 0 rgba(0,0,0,0.3)'
          }}>
            <div style={{
              background: '#000080',
              color: 'white',
              padding: '6px 8px',
              marginBottom: 16,
              fontWeight: 'bold',
              fontSize: 14
            }}>
              Technical Skills
            </div>

            {/* Core Languages */}
            <div style={{
              background: '#DFDFDF',
              border: '2px inset #808080',
              padding: 12,
              marginBottom: 12
            }}>
              <h3 style={{ 
                margin: '0 0 12px 0', 
                color: '#000080',
                fontSize: 13,
                fontWeight: 'bold'
              }}>Core Languages</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                <span className="skill-tag" style={{ background: '#000080', color: 'white', fontWeight: 'bold' }}>Python</span>
                <span className="skill-tag" style={{ background: '#000080', color: 'white', fontWeight: 'bold' }}>JavaScript</span>
                <span className="skill-tag" style={{ background: '#000080', color: 'white', fontWeight: 'bold' }}>SQL</span>
                <span className="skill-tag">TypeScript</span>
                <span className="skill-tag">HTML5</span>
                <span className="skill-tag">CSS3</span>
              </div>
            </div>

            {/* Frontend */}
            <div style={{
              background: '#DFDFDF',
              border: '2px inset #808080',
              padding: 12,
              marginBottom: 12
            }}>
              <h3 style={{ 
                margin: '0 0 12px 0', 
                color: '#000080',
                fontSize: 13,
                fontWeight: 'bold'
              }}>Frontend</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                <span className="skill-tag">React</span>
                <span className="skill-tag">Next.js</span>
                <span className="skill-tag">Vue.js</span>
                <span className="skill-tag">Tailwind CSS</span>
                <span className="skill-tag">SASS/SCSS</span>
              </div>
            </div>

            {/* Backend & Databases */}
            <div style={{
              background: '#DFDFDF',
              border: '2px inset #808080',
              padding: 12,
              marginBottom: 12
            }}>
              <h3 style={{ 
                margin: '0 0 12px 0', 
                color: '#000080',
                fontSize: 13,
                fontWeight: 'bold'
              }}>Backend & Databases</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                <span className="skill-tag" style={{ background: '#000080', color: 'white', fontWeight: 'bold' }}>PostgreSQL</span>
                <span className="skill-tag">Node.js</span>
                <span className="skill-tag">Express</span>
                <span className="skill-tag">Django</span>
                <span className="skill-tag">MongoDB</span>
                <span className="skill-tag">MySQL</span>
                <span className="skill-tag">Firebase</span>
                <span className="skill-tag">REST APIs</span>
                <span className="skill-tag">GraphQL</span>
              </div>
            </div>

            {/* Data & Analysis */}
            <div style={{
              background: '#DFDFDF',
              border: '2px inset #808080',
              padding: 12,
              marginBottom: 12
            }}>
              <h3 style={{ 
                margin: '0 0 12px 0', 
                color: '#000080',
                fontSize: 13,
                fontWeight: 'bold'
              }}>Data & Analysis</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                <span className="skill-tag">Pandas</span>
                <span className="skill-tag">Beautiful Soup</span>
                <span className="skill-tag">NumPy</span>
                <span className="skill-tag">Data Scraping</span>
              </div>
            </div>

            {/* Tools & Others */}
            <div style={{
              background: '#DFDFDF',
              border: '2px inset #808080',
              padding: 12,
              marginBottom: 12
            }}>
              <h3 style={{ 
                margin: '0 0 12px 0', 
                color: '#000080',
                fontSize: 13,
                fontWeight: 'bold'
              }}>Tools & Others</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                <span className="skill-tag" style={{ background: '#000080', color: 'white', fontWeight: 'bold' }}>Git</span>
                <span className="skill-tag" style={{ background: '#000080', color: 'white', fontWeight: 'bold' }}>VS Code</span>
                <span className="skill-tag">Docker</span>
                <span className="skill-tag">AWS</span>
                <span className="skill-tag">Figma</span>
                <span className="skill-tag">Linux</span>
              </div>
            </div>

            {/* Currently Learning */}
            <div style={{
              background: '#DFDFDF',
              border: '2px inset #808080',
              padding: 12
            }}>
              <h3 style={{ 
                margin: '0 0 12px 0', 
                color: '#000080',
                fontSize: 13,
                fontWeight: 'bold'
              }}>Currently Learning</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                <span className="skill-tag">Three.js</span>
                <span className="skill-tag">Machine Learning</span>
              </div>
            </div>
          </div>
        </div>
      )
    },
    contact: {
      title: 'Contact Me',
      icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect fill='%23CC0000' x='6' y='4' width='20' height='24' rx='1'/%3E%3Crect fill='%23FF6666' x='6' y='4' width='20' height='3'/%3E%3Crect fill='%23990000' x='28' y='10' width='2' height='4'/%3E%3Crect fill='%23990000' x='28' y='16' width='2' height='4'/%3E%3Crect fill='%23990000' x='28' y='22' width='2' height='4'/%3E%3Ctext x='16' y='18' text-anchor='middle' fill='%23FFF' font-size='12' font-family='Arial' font-weight='bold'>@%3C/text%3E%3C/svg%3E",
      pos: { top: 160, left: 160 },
      size: { width: 500, height: 400 },
      content: (
        <div style={{ 
          height: '100%', 
          background: '#008080',
          padding: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            background: '#C0C0C0',
            border: '2px outset #DFDFDF',
            padding: 32,
            boxShadow: '2px 2px 0 rgba(0,0,0,0.3)',
            width: '100%',
            maxWidth: 400
          }}>
            <div style={{
              background: '#000080',
              color: 'white',
              padding: '10px 12px',
              marginBottom: 24,
              fontWeight: 'bold',
              fontSize: 16,
              textAlign: 'center'
            }}>
              Get In Touch
            </div>

            {/* Email */}
            <div style={{
              marginBottom: 24
            }}>
              <div style={{
                color: '#000',
                fontSize: 11,
                fontWeight: 'bold',
                marginBottom: 6,
                textTransform: 'uppercase'
              }}>
                Email:
              </div>
              <div style={{
                color: '#000080',
                fontSize: 14,
                fontWeight: 'bold',
                fontFamily: 'MS Sans Serif, Arial, sans-serif'
              }}>
                waleed.1.hasan@gmail.com
              </div>
            </div>


            {/* Location */}
            <div>
              <div style={{
                color: '#000',
                fontSize: 11,
                fontWeight: 'bold',
                marginBottom: 6,
                textTransform: 'uppercase'
              }}>
                Location:
              </div>
              <div style={{
                color: '#000',
                fontSize: 14,
                fontWeight: 'bold',
                fontFamily: 'MS Sans Serif, Arial, sans-serif'
              }}>
                Chicago, Illinois
              </div>
            </div>
          </div>
        </div>
      )
    }
  }

  const desktopIcons = [
    { id: 'about', label: 'About Me', icon: windows.about.icon },
    { id: 'rentmap', label: 'Rent Map', icon: windows.rentmap.icon },
    { id: 'compfinder', label: 'NYC Comps', icon: windows.compfinder.icon },
    { id: 'venuemap', label: 'Venues', icon: windows.venuemap.icon },
    { id: 'eggprices', label: 'Egg Prices', icon: windows.eggprices.icon },
    { id: 'ghostbuses', label: 'Ghost Buses', icon: windows.ghostbuses.icon },
    { id: 'bikegame', label: 'Bike Game', icon: windows.bikegame.icon },
    { id: 'nbashotchart', label: 'NBA Shots', icon: windows.nbashotchart.icon },
    { id: 'albumbattle', label: 'Album Ranker', icon: windows.albumbattle.icon },
    { id: 'radar', label: 'Weather Radar', icon: windows.radar.icon },
    { id: 'ctamap', label: 'CTA Map', icon: windows.ctamap.icon },
    { id: 'snake', label: 'Snake Game', icon: windows.snake.icon },
    { id: 'strudel', label: 'Strudel', icon: windows.strudel.icon },
    { id: 'seventeensquares', label: '17 Squares', icon: windows.seventeensquares.icon },
    { id: 'projects', label: 'Projects', icon: windows.projects.icon },
    { id: 'skills', label: 'Skills', icon: windows.skills.icon },
    { id: 'contact', label: 'Contact', icon: windows.contact.icon },
  ]

  return (
    <>
      <div className="loading-screen" style={{
        background: '#008080',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        width: '100vw',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 9999
      }}>
        <div className="loading-logo" style={{
          fontFamily: 'MS Sans Serif, Arial, sans-serif',
          fontSize: 32,
          fontWeight: 'bold',
          color: '#FFFFFF',
          marginBottom: 32,
          textShadow: '2px 2px 0 #000000'
        }}>
          WALEED HASAN OS
        </div>
        <div className="loading-bar-container" style={{
          height: 30,
          background: '#C0C0C0',
          border: '2px inset #DFDFDF',
          padding: 4,
          boxShadow: '2px 2px 0 rgba(0,0,0,0.3)'
        }}>
          <div className="loading-bar" style={{
            height: '100%',
            background: '#000080',
            animation: 'load 2s ease-in-out'
          }}></div>
        </div>
      </div>

      <div className={`desktop ${isMobile ? 'desktop-mobile' : ''}`}>
        {desktopIcons.map((icon, index) => (
          <div
            key={icon.id}
            id={`icon-${icon.id}`}
            className="desktop-icon"
            onDoubleClick={() => !isMobile && openWindow(icon.id)}
            onClick={() => isMobile && openWindow(icon.id)}
            onMouseDown={(e) => !isMobile && startIconDrag(e, icon.id)}
            style={!isMobile ? {
              position: 'absolute',
              left: iconPositions[icon.id]?.x ?? (20 + (index % 2) * 100),
              top: iconPositions[icon.id]?.y ?? (20 + Math.floor(index / 2) * 100),
              cursor: dragging === `icon-${icon.id}` ? 'grabbing' : 'pointer'
            } : undefined}
          >
            <img src={icon.icon} alt={icon.label} />
            <span>{icon.label}</span>
          </div>
        ))}
      </div>

      {Object.entries(windows)
        .filter(([id]) => openWindows.includes(id))
        .map(([id, win]) => (
        <div
          key={id}
          id={`window-${id}`}
          className={`window ${openWindows.includes(id) ? 'active' : ''}`}
          style={{
            top: win.pos.top,
            left: win.pos.left,
            width: win.size.width,
            height: win.size.height,
            display: minimizedWindows.includes(id) ? 'none' : 'block',
            zIndex: windowZIndex[id] || 100
          }}
          onMouseDown={() => bringToFront(id)}
        >
          <div className="window-title-bar" onMouseDown={(e) => !isMobile && startDrag(e, id)}>
            <div className="window-title">
              <img src={win.icon} alt="" />
              {win.title}
            </div>
            <div className="window-controls">
              <button className="window-button minimize" onClick={() => minimizeWindow(id)}>_</button>
              <button className="window-button maximize">□</button>
              <button className="window-button close" onClick={() => closeWindow(id)}>×</button>
            </div>
          </div>
          <div className="window-content" style={{ padding: (id === 'ctamap' || id === 'albumbattle' || id === 'leaderboard' || id === 'paint' || id === 'chat' || id === 'ipod' || id === 'snake' || id === 'radar' || id === 'bikegame' || id === 'nbashotchart' || id === 'strudel' || id === 'rentmap' || id === 'compfinder' || id === 'venuemap' || id === 'eggprices' || id === 'ghostbuses') ? 0 : 16 }}>
            {win.content}
          </div>
        </div>
      ))}

      <div
        className="taskbar"
        onDragOver={(e) => { if (taskbarDrag) { e.preventDefault(); e.dataTransfer.dropEffect = 'move' } }}
        onDrop={(e) => {
          if (taskbarDrag) {
            e.preventDefault()
            setTaskbarOrder(prev => {
              const next = prev.filter(x => x !== taskbarDrag)
              next.push(taskbarDrag)
              return next
            })
            setTaskbarDrag(null)
            setTaskbarDragOver(null)
          }
        }}
      >
        {/* Start Menu */}
        {startMenuOpen && (
          <div ref={startMenuRef} className="start-menu">
            <div className="start-menu-sidebar">
              <span className="start-menu-sidebar-text">Waleed<b>95</b></span>
            </div>
            <div className="start-menu-content">
              {startMenuItems.map((section, si) => (
                <div key={section.section}>
                  {si > 0 && <div className="start-menu-divider" />}
                  <div className="start-menu-section-label">{section.section}</div>
                  {section.items.map(item => (
                    <div
                      key={item.id}
                      className="start-menu-item"
                      onClick={() => openFromStartMenu(item.id)}
                    >
                      <img src={windows[item.id]?.icon || ''} alt="" className="start-menu-item-icon" />
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
              ))}
              <div className="start-menu-divider" />
              <div
                className="start-menu-item"
                onClick={() => openFromStartMenu('about')}
              >
                <img src={windows.about.icon} alt="" className="start-menu-item-icon" />
                <span>About Me</span>
              </div>
              <div
                className="start-menu-item"
                onClick={() => openFromStartMenu('skills')}
              >
                <img src={windows.skills.icon} alt="" className="start-menu-item-icon" />
                <span>Skills</span>
              </div>
              <div
                className="start-menu-item"
                onClick={() => openFromStartMenu('projects')}
              >
                <img src={windows.projects.icon} alt="" className="start-menu-item-icon" />
                <span>Projects</span>
              </div>
              <div
                className="start-menu-item"
                onClick={() => openFromStartMenu('contact')}
              >
                <img src={windows.contact.icon} alt="" className="start-menu-item-icon" />
                <span>Contact</span>
              </div>
            </div>
          </div>
        )}

        <button
          ref={startBtnRef}
          className={`start-button ${startMenuOpen ? 'start-button-active' : ''}`}
          onClick={() => setStartMenuOpen(!startMenuOpen)}
        >
          <img className="start-icon" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Crect fill='%23FF0000' x='2' y='2' width='9' height='9'/%3E%3Crect fill='%2300FF00' x='13' y='2' width='9' height='9'/%3E%3Crect fill='%230000FF' x='2' y='13' width='9' height='9'/%3E%3Crect fill='%23FFFF00' x='13' y='13' width='9' height='9'/%3E%3C/svg%3E" alt="Start" />
          <span>Start</span>
        </button>
        <div
          className="taskbar-items"
          onDragOver={(e) => {
            e.preventDefault()
            e.dataTransfer.dropEffect = 'move'
          }}
          onDrop={(e) => {
            e.preventDefault()
            if (taskbarDrag) {
              setTaskbarOrder(prev => {
                const next = prev.filter(x => x !== taskbarDrag)
                next.push(taskbarDrag)
                return next
              })
              setTaskbarDrag(null)
              setTaskbarDragOver(null)
            }
          }}
        >
          {taskbarOrder.filter(id => openWindows.includes(id)).map(id => (
            <div
              key={id}
              className={`taskbar-item ${minimizedWindows.includes(id) ? '' : 'active'}`}
              draggable
              onDragStart={(e) => {
                setTaskbarDrag(id)
                e.dataTransfer.effectAllowed = 'move'
                if (e.currentTarget instanceof HTMLElement) {
                  e.currentTarget.style.opacity = '0.5'
                }
              }}
              onDragEnd={(e) => {
                setTaskbarDrag(null)
                setTaskbarDragOver(null)
                if (e.currentTarget instanceof HTMLElement) {
                  e.currentTarget.style.opacity = '1'
                }
              }}
              onDragOver={(e) => {
                e.preventDefault()
                e.dataTransfer.dropEffect = 'move'
                if (taskbarDrag && taskbarDrag !== id) {
                  setTaskbarDragOver(id)
                }
              }}
              onDragLeave={() => {
                if (taskbarDragOver === id) setTaskbarDragOver(null)
              }}
              onDrop={(e) => {
                e.preventDefault()
                if (taskbarDrag && taskbarDrag !== id) {
                  setTaskbarOrder(prev => {
                    const next = prev.filter(x => x !== taskbarDrag)
                    const dropIdx = next.indexOf(id)
                    next.splice(dropIdx, 0, taskbarDrag)
                    return next
                  })
                }
                setTaskbarDrag(null)
                setTaskbarDragOver(null)
              }}
              onClick={() => {
                if (minimizedWindows.includes(id)) {
                  restoreWindow(id)
                  bringToFront(id)
                } else {
                  minimizeWindow(id)
                }
              }}
              style={{
                borderLeft: taskbarDragOver === id ? '3px solid #000080' : undefined,
                cursor: 'grab',
              }}
            >
              <img src={windows[id].icon} alt="" />
              <span>{windows[id].title}</span>
            </div>
          ))}
        </div>
        <div className="system-tray">
          <span>{time}</span>
        </div>
      </div>
    </>
  )
}