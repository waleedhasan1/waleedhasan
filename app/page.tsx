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

const PaintAppInline = dynamic(() => import('./components/PaintAppInline'), {
  ssr: false,
  loading: () => <div style={{ padding: 20, textAlign: 'center' }}>Loading paint...</div>
})

const ChatAppInline = dynamic(() => import('./components/ChatAppInline'), {
  ssr: false,
  loading: () => <div style={{ padding: 20, textAlign: 'center' }}>Loading chat...</div>
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
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (dragging) {
      const windowEl = document.getElementById(`window-${dragging}`)
      if (windowEl) {
        windowEl.style.left = (e.clientX - offset.x) + 'px'
        windowEl.style.top = (e.clientY - offset.y) + 'px'
      }
    }
  }

  const handleMouseUp = () => {
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
      icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect fill='%230000AA' width='32' height='32'/%3E%3Crect fill='%23FFF' x='8' y='8' width='16' height='16'/%3E%3Crect fill='%230000AA' x='12' y='10' width='8' height='2'/%3E%3Crect fill='%230000AA' x='12' y='14' width='8' height='2'/%3E%3Crect fill='%230000AA' x='12' y='18' width='8' height='4'/%3E%3C/svg%3E",
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
      icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect fill='%230000AA' width='32' height='32'/%3E%3Crect fill='%23FFF' x='6' y='10' width='20' height='12'/%3E%3Crect fill='%230000AA' x='10' y='14' width='4' height='4'/%3E%3Crect fill='%230000AA' x='18' y='14' width='4' height='4'/%3E%3Crect fill='%230000AA' x='8' y='24' width='2' height='2'/%3E%3Crect fill='%230000AA' x='22' y='24' width='2' height='2'/%3E%3C/svg%3E",
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
      icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect fill='%23800080' width='32' height='32'/%3E%3Crect fill='%23FFF' x='8' y='8' width='16' height='16'/%3E%3Ccircle fill='%23800080' cx='16' cy='16' r='5'/%3E%3Ccircle fill='%23FFF' cx='16' cy='16' r='2'/%3E%3C/svg%3E",
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
      icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect fill='%23FF1493' width='32' height='32'/%3E%3Crect fill='%23FFF' x='8' y='4' width='4' height='16'/%3E%3Crect fill='%23FFF' x='12' y='6' width='2' height='12'/%3E%3Crect fill='%23FFF' x='6' y='20' width='20' height='8'/%3E%3Crect fill='%23FF1493' x='10' y='22' width='12' height='4'/%3E%3C/svg%3E",
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
      icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect fill='%2300AAAA' width='32' height='32'/%3E%3Crect fill='%23FFF' x='4' y='6' width='24' height='16'/%3E%3Cpath fill='%23FFF' d='M12 22 L16 26 L20 22 Z'/%3E%3Crect fill='%2300AAAA' x='8' y='10' width='16' height='2'/%3E%3Crect fill='%2300AAAA' x='8' y='14' width='12' height='2'/%3E%3C/svg%3E",
      pos: { top: 80, left: 300 },
      size: { width: 600, height: 650 },
      content: (
        <div style={{ height: '100%', width: '100%', padding: 0, margin: 0 }}>
          <ChatAppInline />
        </div>
      )
    },
    projects: {
      title: 'My Projects',
      icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect fill='%23FF8800' width='32' height='32'/%3E%3Crect fill='%23FFDD00' x='6' y='6' width='20' height='4'/%3E%3Crect fill='%23FFF' x='6' y='12' width='20' height='14'/%3E%3Crect fill='%23FF8800' x='10' y='16' width='12' height='2'/%3E%3Crect fill='%23FF8800' x='10' y='20' width='12' height='2'/%3E%3C/svg%3E",
      pos: { top: 120, left: 120 },
      size: { width: 600, height: 500 },
      content: (
        <>
          <h2>💼 Portfolio Projects</h2>
          <div className="project-card" onClick={() => openWindow('ctamap')} style={{ cursor: 'pointer' }}>
            <h4>CTA Train Tracker</h4>
            <p>Real-time Chicago transit system tracker showing train arrivals and departures!</p>
            <div style={{ marginTop: 8 }}>
              <span className="skill-tag">Next.js</span>
              <span className="skill-tag">React</span>
              <span className="skill-tag">Leaflet</span>
              <span className="skill-tag">CTA API</span>
            </div>
          </div>
          <div className="project-card" onClick={() => openWindow('albumbattle')} style={{ cursor: 'pointer' }}>
            <h4>Album Ranker</h4>
            <p>Battle your favorite albums and see which ones rank highest using ELO ratings!</p>
            <div style={{ marginTop: 8 }}>
              <span className="skill-tag">Next.js</span>
              <span className="skill-tag">React</span>
              <span className="skill-tag">ELO Algorithm</span>
              <span className="skill-tag">PostgreSQL</span>
            </div>
          </div>
          <div className="project-card">
            <h4>Project Name 3</h4>
            <p>A retro-inspired [type of project] that demonstrates [skills/concepts].</p>
            <div style={{ marginTop: 8 }}>
              <span className="skill-tag">HTML/CSS</span>
              <span className="skill-tag">JavaScript</span>
              <span className="skill-tag">Canvas API</span>
            </div>
          </div>
        </>
      )
    },
    skills: {
      title: 'Skills & Technologies',
      icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect fill='%2300AA00' width='32' height='32'/%3E%3Crect fill='%23FFF' x='6' y='8' width='20' height='3'/%3E%3Crect fill='%23FFF' x='6' y='13' width='16' height='3'/%3E%3Crect fill='%23FFF' x='6' y='18' width='18' height='3'/%3E%3Cpath fill='%2300AA00' d='M22 18 L26 22 L22 26 Z'/%3E%3C/svg%3E",
      pos: { top: 140, left: 140 },
      size: { width: 500 },
      content: (
        <>
          <h2>🛠️ Technical Skills</h2>
          <h3>Frontend</h3>
          <p>HTML5, CSS3, JavaScript (ES6+), React, Vue.js, Tailwind CSS, SASS/SCSS</p>
          <h3>Backend</h3>
          <p>Node.js, Python, Django, Express, REST APIs, GraphQL</p>
          <h3>Database</h3>
          <p>MongoDB, PostgreSQL, MySQL, Firebase, Redis</p>
          <h3>Tools & Others</h3>
          <p>Git, Docker, AWS, Figma, Photoshop, VS Code, Linux</p>
          <h3>Currently Learning</h3>
          <p>TypeScript, Next.js, Three.js, Web3</p>
        </>
      )
    },
    contact: {
      title: 'Contact Me',
      icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect fill='%23CC0000' width='32' height='32'/%3E%3Crect fill='%23FFF' x='4' y='8' width='24' height='16'/%3E%3Cpath fill='%23CC0000' d='M4 8 L16 18 L28 8'/%3E%3Crect fill='%23CC0000' x='4' y='8' width='2' height='16'/%3E%3Crect fill='%23CC0000' x='26' y='8' width='2' height='16'/%3E%3Crect fill='%23CC0000' x='4' y='22' width='24' height='2'/%3E%3C/svg%3E",
      pos: { top: 160, left: 160 },
      size: { width: 500 },
      content: (
        <>
          <h2>📬 Get In Touch</h2>
          <p>I&apos;m always open to new opportunities and interesting projects. Feel free to reach out!</p>
          <h3>Email</h3>
          <p><a href="mailto:your.email@example.com">your.email@example.com</a></p>
          <h3>Social Links</h3>
          <ul>
            <li><a href="#" target="_blank">GitHub</a></li>
            <li><a href="#" target="_blank">LinkedIn</a></li>
            <li><a href="#" target="_blank">Twitter/X</a></li>
            <li><a href="#" target="_blank">Instagram</a></li>
          </ul>
          <h3>Location</h3>
          <p>Chicago, Illinois</p>
          <p style={{ marginTop: 20, padding: 12, background: '#FFFFCC', borderLeft: '3px solid #F39C12' }}>
            <strong>Quick Response Time:</strong> I typically respond within 24-48 hours!
          </p>
        </>
      )
    }
  }

  const desktopIcons = [
    { id: 'about', label: 'About Me', icon: windows.about.icon },
    { id: 'ctamap', label: 'CTA Map', icon: windows.ctamap.icon },
    { id: 'albumbattle', label: 'Album Ranker', icon: windows.albumbattle.icon },
    { id: 'paint', label: 'Paint', icon: windows.paint.icon },
    { id: 'chat', label: 'Chat Room', icon: windows.chat.icon },
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
        {desktopIcons.map(icon => (
          <div key={icon.id} className="desktop-icon" onClick={() => openWindow(icon.id)}>
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
            display: minimizedWindows.includes(id) ? 'none' : 'block'
          }}
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
          <div className="window-content" style={{ padding: (id === 'ctamap' || id === 'albumbattle' || id === 'leaderboard' || id === 'paint' || id === 'chat') ? 0 : 16 }}>
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