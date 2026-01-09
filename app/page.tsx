'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'

// Dynamically import the map component (Leaflet needs window)
const MapComponentInline = dynamic(() => import('./components/MapComponentInline'), {
  ssr: false,
  loading: () => <div style={{ padding: 20, textAlign: 'center' }}>Loading map...</div>
})

const AlbumRankerInline = dynamic(() => import('./components/AlbumRankerInline'), {
  ssr: false,
  loading: () => <div style={{ padding: 20, textAlign: 'center' }}>Loading album ranker...</div>
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
      icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Crect fill='%234A90E2' width='48' height='48'/%3E%3Cpath fill='%23FFF' d='M24 8c-8.8 0-16 7.2-16 16s7.2 16 16 16 16-7.2 16-16-7.2-16-16-16zm0 28c-6.6 0-12-5.4-12-12s5.4-12 12-12 12 5.4 12 12-5.4 12-12 12zm-2-18h4v2h-4zm0 4h4v10h-4z'/%3E%3C/svg%3E",
      pos: { top: 100, left: 100 },
      size: { width: 500 },
      content: (
        <>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <img src="/profilepic.png" alt="Waleed Hasan" style={{ width: 150, height: 150, objectFit: 'cover', border: '3px solid #4A90E2', boxShadow: '0 4px 8px rgba(0,0,0,0.3)' }} />
          </div>
          <h2>👋 Hi! My name is Waleed Hasan, Thank you for visiting my Page!</h2>
          <p>I am a Developer based out of Chicago. I really like cities and transit, and like making projects that show off how transit works in cities and how transit affects cities through different metrics, I also like making music!</p>
          <h3>Background</h3>
          <p>I recently graduated from the University of Illinois at Chicago, there I have found a love for statistics and data, as well as helping out with the newspaper and radio from time to time. Math is Music!</p>
          <h3>Things I Have Done</h3>
          <ul>
            <li>Helped my friends at Kaleida health automate a pump report system, allowing a weekly meeting to be removed, saving over 50 staff members hours of time</li>
            <li>Helped my friends at the Electronic Visualization Facility create automated data collection, sorting, cleaning system, that scraped google scholar pages of researchers, allowing for automatic bias detection</li>
            <li>Helped my friends at the Bonfire Newspaper create an online polling and data tracking system</li>
            <li>Helped my friends at Charred Fork set up their initial website for their lovely bbq restaurant</li>
          </ul>
          <h3>Fun Facts</h3>
          <p>I really enjoy music, music software, and music tech! Late on a saturday night you can find me haggling for microphones on facebook marketplace.</p>
        </>
      )
    },
    ctamap: {
      title: 'CTA Train Map',
      icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Crect fill='%230053EE' width='48' height='48'/%3E%3Cpath fill='%23FFF' d='M24 8c-8.8 0-16 7.2-16 16s7.2 16 16 16 16-7.2 16-16-7.2-16-16-16zm0 28c-6.6 0-12-5.4-12-12s5.4-12 12-12 12 5.4 12 12-5.4 12-12 12z'/%3E%3Cpath fill='%23FFF' d='M24 14l-6 10h4v6l6-10h-4z'/%3E%3C/svg%3E",
      pos: { top: 50, left: 100 },
      size: { width: 1000, height: 700 },
      content: (
        <div style={{ height: '100%', width: '100%', padding: 0, margin: 0 }}>
          <MapComponentInline />
        </div>
      )
    },
    albumranker: {
      title: 'Album Ranker',
      icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Crect fill='%239333EA' width='48' height='48'/%3E%3Cpath fill='%23FFF' d='M24 8c-8.8 0-16 7.2-16 16s7.2 16 16 16 16-7.2 16-16-7.2-16-16-16zm0 28c-6.6 0-12-5.4-12-12s5.4-12 12-12 12 5.4 12 12-5.4 12-12 12z'/%3E%3Cpath fill='%23FFF' d='M24 18l-4 8h3v4l5-8h-3z'/%3E%3C/svg%3E",
      pos: { top: 80, left: 150 },
      size: { width: 900, height: 650 },
      content: (
        <div style={{ height: '100%', width: '100%', padding: 0, margin: 0 }}>
          <AlbumRankerInline />
        </div>
      )
    },
    projects: {
      title: 'My Projects',
      icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Crect fill='%23F39C12' width='48' height='48'/%3E%3Cpath fill='%23FFF' d='M8 8h32v6H8zm0 10h32v22H8z'/%3E%3Cpath fill='%23F39C12' d='M12 22h24v2H12zm0 4h24v2H12zm0 4h18v2H12z'/%3E%3C/svg%3E",
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
          <div className="project-card">
            <h4>Project Name 2</h4>
            <p>An innovative solution for [problem]. Features include [key features].</p>
            <div style={{ marginTop: 8 }}>
              <span className="skill-tag">Python</span>
              <span className="skill-tag">Django</span>
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
      icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Crect fill='%2327AE60' width='48' height='48'/%3E%3Cpath fill='%23FFF' d='M12 12h24v4H12zm0 8h24v4H12zm0 8h16v4H12z'/%3E%3Cpath fill='%2327AE60' d='M34 30l6-6-6-6z'/%3E%3C/svg%3E",
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
      icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Crect fill='%23E74C3C' width='48' height='48'/%3E%3Cpath fill='%23FFF' d='M8 12h32v24H8zm4 4l12 8 12-8v-2l-12 8-12-8z'/%3E%3C/svg%3E",
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
    { id: 'albumranker', label: 'Album Ranker', icon: windows.albumranker.icon },
    { id: 'projects', label: 'Projects', icon: windows.projects.icon },
    { id: 'skills', label: 'Skills', icon: windows.skills.icon },
    { id: 'contact', label: 'Contact', icon: windows.contact.icon }
  ]

  return (
    <>
      <div className="loading-screen">
        <div className="loading-logo">PORTFOLIO OS</div>
        <div className="loading-bar-container">
          <div className="loading-bar"></div>
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
          <div className="window-content" style={{ padding: id === 'ctamap' ? 0 : 16 }}>
            {win.content}
          </div>
        </div>
      ))}

      <div className="taskbar">
        <button className="start-button">
          <img className="start-icon" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23FFF' d='M3 3h8v8H3zm0 10h8v8H3zm10-10h8v8h-8zm0 10h8v8h-8z'/%3E%3C/svg%3E" alt="Start" />
          <span>Start</span>
        </button>
        <div className="taskbar-items">
          {openWindows.map(id => (
            <div 
              key={id} 
              className={`taskbar-item ${minimizedWindows.includes(id) ? '' : 'active'}`}
              onClick={() => {
                if (minimizedWindows.includes(id)) {
                  restoreWindow(id)
                } else {
                  // If already visible, could minimize it
                  minimizeWindow(id)
                }
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