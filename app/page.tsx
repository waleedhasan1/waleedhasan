'use client'

import { useState, useEffect } from 'react'
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
      setMinimizedWindows(minimizedWindows.filter(id => id !== windowId))
    }
  }

  const closeWindow = (windowId: string) => {
    setOpenWindows(openWindows.filter(id => id !== windowId))
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

  const windows: Record<string, Window> = {
    about: {
      title: 'About Me',
      icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cpath fill='%23C0C0C0' d='M2 2h28v28H2z'/%3E%3Cpath fill='%23000080' d='M4 4h24v24H4z'/%3E%3Ccircle fill='%23FFCC99' cx='16' cy='12' r='4'/%3E%3Cpath fill='%23FFCC99' d='M10 20h12v6H10z'/%3E%3Cpath fill='%23FFF' d='M5 5h22v1H5zm0 21h22v1H5zM5 5h1v22H5zm21 0h1v22h-1z'/%3E%3C/svg%3E",
      pos: { top: 100, left: 100 },
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
      icon: "/icons/ctamap.png",
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
      icon: "/icons/paint.png",
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
      icon: "/icons/mp3.png",
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
            
            <div className="project-card" onClick={() => openWindow('ctamap')} style={{ cursor: 'pointer', marginBottom: 12 }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#000080' }}>CTA Train Tracker</h4>
              <p style={{ margin: '0 0 8px 0', lineHeight: 1.6 }}>Real-time Chicago transit system tracker showing train arrivals and departures!</p>
              <div style={{ marginTop: 8 }}>
                <span className="skill-tag">Next.js</span>
                <span className="skill-tag">React</span>
                <span className="skill-tag">Leaflet</span>
                <span className="skill-tag">CTA API</span>
                <span className="skill-tag">Python</span>
                <span className="skill-tag">Pandas</span>
              </div>
            </div>
            
            <div className="project-card" onClick={() => openWindow('albumbattle')} style={{ cursor: 'pointer', marginBottom: 12 }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#000080' }}>Album Ranker</h4>
              <p style={{ margin: '0 0 8px 0', lineHeight: 1.6 }}>Battle your favorite albums and see which ones rank highest using ELO ratings!</p>
              <div style={{ marginTop: 8 }}>
                <span className="skill-tag">Next.js</span>
                <span className="skill-tag">React</span>
                <span className="skill-tag">ELO Algorithm</span>
                <span className="skill-tag">PostgreSQL</span>
                <span className="skill-tag">Python</span>
                <span className="skill-tag">Pandas</span>
                <span className="skill-tag">Beautiful Soup</span>
              </div>
            </div>
            
            <div className="project-card" onClick={() => openWindow('ipod')} style={{ cursor: 'pointer' }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#000080' }}>Digital MP3 Player</h4>
              <p style={{ margin: '0 0 8px 0', lineHeight: 1.6 }}>A retro MP3 player that lets you upload and play your own music files!</p>
              <div style={{ marginTop: 8 }}>
                <span className="skill-tag">React</span>
                <span className="skill-tag">Web Audio API</span>
                <span className="skill-tag">File Upload</span>
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
                your.email@example.com
              </div>
            </div>

            {/* Phone */}
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
                Phone:
              </div>
              <div style={{
                color: '#000080',
                fontSize: 14,
                fontWeight: 'bold',
                fontFamily: 'MS Sans Serif, Arial, sans-serif'
              }}>
                (123) 456-7890
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
    { id: 'ctamap', label: 'CTA Map', icon: windows.ctamap.icon },
    { id: 'radar', label: 'Weather Radar', icon: windows.radar.icon },
    { id: 'albumbattle', label: 'Album Ranker', icon: windows.albumbattle.icon },
    { id: 'paint', label: 'Paint', icon: windows.paint.icon },
    { id: 'chat', label: 'Chat Room', icon: windows.chat.icon },
    { id: 'snake', label: 'Snake Game', icon: windows.snake.icon },
    { id: 'ipod', label: 'MP3 Player', icon: windows.ipod.icon },
    { id: 'projects', label: 'Projects', icon: windows.projects.icon },
    { id: 'skills', label: 'Skills', icon: windows.skills.icon },
    { id: 'contact', label: 'Contact', icon: windows.contact.icon }
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
          width: 300,
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

      <div className="desktop">
        {desktopIcons.map((icon, index) => (
          <div 
            key={icon.id}
            id={`icon-${icon.id}`}
            className="desktop-icon" 
            onDoubleClick={() => openWindow(icon.id)}
            onMouseDown={(e) => startIconDrag(e, icon.id)}
            style={{
              position: 'absolute',
              left: iconPositions[icon.id]?.x ?? (20 + (index % 2) * 100),
              top: iconPositions[icon.id]?.y ?? (20 + Math.floor(index / 2) * 100),
              cursor: dragging === `icon-${icon.id}` ? 'grabbing' : 'pointer'
            }}
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
          <div className="window-title-bar" onMouseDown={(e) => startDrag(e, id)}>
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
          <div className="window-content" style={{ padding: (id === 'ctamap' || id === 'albumbattle' || id === 'leaderboard' || id === 'paint' || id === 'chat' || id === 'ipod' || id === 'snake' || id === 'radar') ? 0 : 16 }}>
            {win.content}
          </div>
        </div>
      ))}

      <div className="taskbar" style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 40,
        background: '#C0C0C0',
        borderTop: '2px solid #FFFFFF',
        display: 'flex',
        alignItems: 'center',
        padding: '0 4px',
        gap: 4,
        fontFamily: 'MS Sans Serif, Arial, sans-serif',
        fontSize: 11,
        zIndex: 1000
      }}>
        <button className="start-button" style={{
          background: '#C0C0C0',
          border: '2px outset #DFDFDF',
          padding: '4px 8px',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          cursor: 'pointer',
          fontWeight: 'bold',
          fontSize: 11
        }}
        onMouseDown={(e) => e.currentTarget.style.border = '2px inset #DFDFDF'}
        onMouseUp={(e) => e.currentTarget.style.border = '2px outset #DFDFDF'}
        onMouseLeave={(e) => e.currentTarget.style.border = '2px outset #DFDFDF'}
        >
          <img className="start-icon" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23000' d='M3 3h8v8H3zm0 10h8v8H3zm10-10h8v8h-8zm0 10h8v8h-8z'/%3E%3C/svg%3E" alt="Start" style={{ width: 16, height: 16 }} />
          <span>Start</span>
        </button>
        <div className="taskbar-items" style={{
          flex: 1,
          display: 'flex',
          gap: 2,
          overflowX: 'auto'
        }}>
          {openWindows.map(id => (
            <div 
              key={id} 
              className={`taskbar-item ${minimizedWindows.includes(id) ? '' : 'active'}`}
              style={{
                background: minimizedWindows.includes(id) ? '#C0C0C0' : '#FFFFFF',
                border: minimizedWindows.includes(id) ? '2px outset #DFDFDF' : '2px inset #DFDFDF',
                padding: '4px 8px',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                cursor: 'pointer',
                minWidth: 120,
                maxWidth: 160
              }}
              onClick={() => {
                if (minimizedWindows.includes(id)) {
                  restoreWindow(id)
                } else {
                  minimizeWindow(id)
                }
              }}
            >
              <img src={windows[id].icon} alt="" style={{ width: 16, height: 16 }} />
              <span style={{ 
                overflow: 'hidden', 
                textOverflow: 'ellipsis', 
                whiteSpace: 'nowrap',
                color: '#000'
              }}>{windows[id].title}</span>
            </div>
          ))}
        </div>
        <div className="system-tray" style={{
          background: '#C0C0C0',
          border: '2px inset #DFDFDF',
          padding: '4px 8px',
          minWidth: 80,
          textAlign: 'center',
          fontWeight: 'bold',
          color: '#000'
        }}>
          <span>{time}</span>
        </div>
      </div>
    </>
  )
}