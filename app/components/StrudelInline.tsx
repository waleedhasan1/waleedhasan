'use client'

import { useEffect, useRef, useState } from 'react'

const PRESETS: { name: string; code: string }[] = [
  {
    name: 'AMBIENT',
    code: `setcps(0.5)
note("<c3 eb3 g3 bb3>/4")
  .s("gm_pad_2_warm")
  .room(2)
  .lpf(sine.range(400, 3000).slow(8))
  .gain(0.6)`,
  },
  {
    name: 'DRUMS',
    code: `setcps(1)
stack(
  s("bd(3,8)").gain(1.2),
  s("~ sd").gain(0.9),
  s("hh*8").gain(0.5).pan(sine),
  s("~ ~ ~ cp").gain(0.7)
).room(0.5)`,
  },
  {
    name: 'MELODY',
    code: `setcps(0.8)
n("<0 2 4 7 9>*4")
  .scale("C4 minor pentatonic")
  .s("gm_lead_6_voice")
  .clip(sine.range(0.2, 0.8).slow(4))
  .jux(rev)
  .room(1.5)
  .lpf(perlin.range(500, 8000).slow(6))`,
  },
  {
    name: 'LOFI',
    code: `setcps(0.7)
stack(
  s("bd(3,8), ~ sd, hh*4")
    .gain("1 0.8 0.6 0.9")
    .room(0.3),
  note("<c3 eb3 ab2 g2>/2")
    .s("gm_electric_piano_1")
    .lpf(1200)
    .gain(0.5)
    .room(1)
)`,
  },
  {
    name: 'ACID',
    code: `setcps(1.2)
note("<c2 c2 eb2 f2>(3,8)")
  .s("sawtooth")
  .lpf(sine.range(200, 4000).slow(2))
  .resonance(15)
  .decay(0.15)
  .sustain(0)
  .gain(0.7)
  .room(0.4)
  .distort(0.3)`,
  },
]

export default function StrudelInline() {
  const containerRef = useRef<HTMLDivElement>(null)
  const editorElRef = useRef<any>(null)
  const [loaded, setLoaded] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [activePreset, setActivePreset] = useState(0)
  const [blink, setBlink] = useState(true)

  useEffect(() => {
    const iv = setInterval(() => setBlink(b => !b), 530)
    return () => clearInterval(iv)
  }, [])

  useEffect(() => {
    const existing = document.querySelector('script[data-strudel-repl]')
    if (existing) {
      setLoaded(true)
      return
    }

    const script = document.createElement('script')
    script.src = 'https://unpkg.com/@strudel/repl@latest'
    script.setAttribute('data-strudel-repl', 'true')
    script.onload = () => setLoaded(true)
    document.head.appendChild(script)
  }, [])

  useEffect(() => {
    if (!loaded || !containerRef.current) return

    if (containerRef.current.querySelector('strudel-editor')) {
      containerRef.current.innerHTML = ''
    }

    const el = document.createElement('strudel-editor')
    el.setAttribute('code', PRESETS[activePreset].code)
    containerRef.current.appendChild(el)
    editorElRef.current = el
    setPlaying(false)
  }, [loaded, activePreset])

  useEffect(() => {
    return () => {
      try { editorElRef.current?.editor?.stop() } catch {}
    }
  }, [])

  const handlePlay = () => {
    try {
      editorElRef.current?.editor?.evaluate()
      setPlaying(true)
    } catch {}
  }

  const handleStop = () => {
    try {
      editorElRef.current?.editor?.stop()
      setPlaying(false)
    } catch {}
  }

  const g = '#00FF41'
  const dg = '#00AA2A'
  const dk = '#003B00'
  const bg = '#0a0a0a'

  const termBtn = (active: boolean, accent?: string): React.CSSProperties => ({
    fontFamily: "'VT323', monospace",
    fontSize: 13,
    padding: '1px 10px',
    cursor: 'pointer',
    background: active ? (accent || g) : 'transparent',
    color: active ? bg : (accent || dg),
    border: `1px solid ${active ? (accent || g) : dk}`,
    letterSpacing: 1,
    lineHeight: '18px',
  })

  return (
    <div style={{
      height: '100%',
      width: '100%',
      background: bg,
      fontFamily: "'VT323', 'Courier New', monospace",
      fontSize: 14,
      color: g,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Scanlines */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.12) 0px, rgba(0,0,0,0.12) 1px, transparent 1px, transparent 3px)',
        pointerEvents: 'none', zIndex: 10,
      }} />

      {/* Top bar: title + status + controls — all in one compact row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '4px 10px',
        gap: 8,
        borderBottom: `1px solid ${dk}`,
        flexShrink: 0,
        flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: 14, letterSpacing: 2, marginRight: 4 }}>
          STRUDEL
        </span>

        <span style={{
          fontSize: 12,
          color: playing ? g : dg,
          marginRight: 4,
        }}>
          {playing ? (
            <><span style={{ color: '#FF3333' }}>&#9679;</span> LIVE</>
          ) : (
            <><span style={{ opacity: 0.3 }}>&#9632;</span> IDLE</>
          )}
        </span>

        <button onClick={handlePlay} style={termBtn(playing, g)}>
          {playing ? '>>' : '>'} PLAY
        </button>
        <button onClick={handleStop} style={termBtn(false, playing ? '#FF3333' : undefined)}>
          [] STOP
        </button>

        <span style={{ color: dk }}>|</span>

        {PRESETS.map((p, i) => (
          <button
            key={p.name}
            onClick={() => { if (playing) handleStop(); setActivePreset(i) }}
            style={termBtn(i === activePreset)}
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* Prompt + Editor — fills everything else */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        overflow: 'hidden',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Thin prompt */}
        <div style={{
          padding: '3px 10px',
          fontSize: 12,
          color: dg,
          flexShrink: 0,
          letterSpacing: 1,
        }}>
          <span style={{ color: g }}>strudel</span>
          <span style={{ color: dk }}>@</span>
          <span style={{ color: g }}>waleed95</span>
          <span style={{ color: dk }}>:</span>
          <span style={{ color: '#4488FF' }}>~</span>
          <span style={{ color: dk }}>$ </span>
          <span style={{ fontSize: 11, color: dg }}>edit &amp; play</span>
          <span style={{ opacity: blink ? 1 : 0, color: g }}>_</span>
        </div>

        {/* Editor fills rest */}
        {!loaded ? (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 12,
          }}>
            <div style={{ fontSize: 16, letterSpacing: 2 }}>LOADING STRUDEL...</div>
            <div style={{ fontSize: 11, color: dg }}>initializing audio engine</div>
          </div>
        ) : (
          <div
            ref={containerRef}
            className="strudel-terminal-editor"
            style={{
              flex: 1,
              minHeight: 0,
              position: 'relative',
            }}
          />
        )}
      </div>

      {/* Minimal status */}
      <div style={{
        padding: '2px 10px',
        borderTop: `1px solid ${dk}`,
        fontSize: 11,
        color: dk,
        flexShrink: 0,
        letterSpacing: 1,
        display: 'flex',
        justifyContent: 'space-between',
      }}>
        <span>{PRESETS[activePreset].name}</span>
        <span>WALEED95</span>
      </div>
    </div>
  )
}
