'use client'

import { useEffect, useRef, useState } from 'react'
import Matter from 'matter-js'

const BEST_KNOWN_S17 = 4.6756
const NUM_SQUARES = 17
const UNIT_PX = 40
const CANVAS_PX = 520

export default function SeventeenSquaresInline() {
  const containerRef = useRef<HTMLDivElement>(null)
  const engineRef = useRef<Matter.Engine | null>(null)
  const renderRef = useRef<Matter.Render | null>(null)
  const runnerRef = useRef<Matter.Runner | null>(null)
  const wallsRef = useRef<Matter.Body[]>([])
  const squaresRef = useRef<Matter.Body[]>([])
  const lidRef = useRef<Matter.Body | null>(null)

  const [boxSide, setBoxSide] = useState(5)
  const [showOptimal, setShowOptimal] = useState(false)
  const [gameOver, setGameOver] = useState<{ score: number } | null>(null)
  const [resetTick, setResetTick] = useState(0)
  const boxSideRef = useRef(boxSide)
  useEffect(() => {
    boxSideRef.current = boxSide
  }, [boxSide])

  useEffect(() => {
    if (!containerRef.current) return

    const engine = Matter.Engine.create()
    engine.gravity.y = 1
    engine.positionIterations = 20
    engine.velocityIterations = 16
    engine.constraintIterations = 8
    engineRef.current = engine

    const render = Matter.Render.create({
      element: containerRef.current,
      engine,
      options: {
        width: CANVAS_PX,
        height: CANVAS_PX,
        wireframes: false,
        background: '#001a1a',
      },
    })
    renderRef.current = render
    Matter.Render.run(render)

    const runner = Matter.Runner.create()
    runnerRef.current = runner
    Matter.Runner.run(runner, engine)

    const mouse = Matter.Mouse.create(render.canvas)
    const mouseConstraint = Matter.MouseConstraint.create(engine, {
      mouse,
      constraint: { stiffness: 0.05, damping: 0.1, render: { visible: false } },
    })
    Matter.Composite.add(engine.world, mouseConstraint)
    render.mouse = mouse

    const t = 40
    const groundStyle = { fillStyle: '#bbb' }
    const canvasBounds = [
      Matter.Bodies.rectangle(CANVAS_PX / 2, CANVAS_PX + t / 2 - 2, CANVAS_PX + 2 * t, t, {
        isStatic: true,
        render: groundStyle,
      }),
      Matter.Bodies.rectangle(-t / 2, CANVAS_PX / 2, t, CANVAS_PX * 2, {
        isStatic: true,
        render: groundStyle,
      }),
      Matter.Bodies.rectangle(CANVAS_PX + t / 2, CANVAS_PX / 2, t, CANVAS_PX * 2, {
        isStatic: true,
        render: groundStyle,
      }),
    ]
    Matter.Composite.add(engine.world, canvasBounds)

    return () => {
      Matter.Render.stop(render)
      Matter.Runner.stop(runner)
      Matter.Engine.clear(engine)
      render.canvas.remove()
      render.textures = {}
    }
  }, [])

  useEffect(() => {
    const engine = engineRef.current
    if (!engine) return

    if (wallsRef.current.length) {
      Matter.Composite.remove(engine.world, wallsRef.current)
    }
    if (lidRef.current) {
      Matter.Composite.remove(engine.world, lidRef.current)
      lidRef.current = null
    }

    const sidePx = boxSide * UNIT_PX
    const cx = CANVAS_PX / 2
    const cy = CANVAS_PX / 2
    const left = cx - sidePx / 2
    const top = cy - sidePx / 2
    const right = cx + sidePx / 2
    const bottom = cy + sidePx / 2
    const t = 20

    const wallStyle = { fillStyle: '#ffffff' }
    const walls = [
      Matter.Bodies.rectangle(cx, bottom + t / 2, sidePx + 2 * t, t, {
        isStatic: true,
        slop: 0.005,
        render: wallStyle,
      }),
      Matter.Bodies.rectangle(left - t / 2, cy, t, sidePx, {
        isStatic: true,
        slop: 0.005,
        render: wallStyle,
      }),
      Matter.Bodies.rectangle(right + t / 2, cy, t, sidePx, {
        isStatic: true,
        slop: 0.005,
        render: wallStyle,
      }),
    ]
    wallsRef.current = walls
    Matter.Composite.add(engine.world, walls)

    const lidWidth = sidePx + 2 * t
    const lidThickness = 14
    const knobRadius = 12
    const lidStartX = Math.min(right + t + lidWidth / 2 + 30, CANVAS_PX - lidWidth / 2 - 4)
    const lidStartY = CANVAS_PX - lidThickness / 2 - 4

    const plank = Matter.Bodies.rectangle(lidStartX, lidStartY, lidWidth, lidThickness, {
      render: { fillStyle: '#c0392b' },
    })
    const knob = Matter.Bodies.circle(
      lidStartX,
      lidStartY - lidThickness / 2 - knobRadius + 2,
      knobRadius,
      { render: { fillStyle: '#922b21' } }
    )
    const lid = Matter.Body.create({
      parts: [plank, knob],
      friction: 0.6,
      density: 0.004,
    })
    lidRef.current = lid
    Matter.Composite.add(engine.world, lid)
    void top
  }, [boxSide, resetTick])

  const spawnSquares = () => {
    const engine = engineRef.current
    if (!engine) return

    if (squaresRef.current.length) {
      Matter.Composite.remove(engine.world, squaresRef.current)
      squaresRef.current = []
    }

    const colors = [
      '#e63946', '#f4a261', '#e9c46a', '#2a9d8f', '#264653',
      '#8338ec', '#3a86ff', '#ff006e', '#fb5607', '#ffbe0b',
      '#06d6a0', '#118ab2', '#073b4c', '#ef476f', '#7209b7',
      '#4361ee', '#4cc9f0',
    ]

    const squares: Matter.Body[] = []
    for (let i = 0; i < NUM_SQUARES; i++) {
      const x = 60 + (i % 6) * (UNIT_PX + 6)
      const y = 30 + Math.floor(i / 6) * (UNIT_PX + 6)
      const sq = Matter.Bodies.rectangle(x, y, UNIT_PX, UNIT_PX, {
        restitution: 0,
        friction: 0.4,
        frictionStatic: 1,
        density: 0.002,
        slop: 0.005,
        render: { fillStyle: colors[i % colors.length] },
      })
      squares.push(sq)
    }
    squaresRef.current = squares
    Matter.Composite.add(engine.world, squares)
  }

  const polyOverlapDepth = (
    a: { x: number; y: number }[],
    b: { x: number; y: number }[],
  ): number => {
    let minOverlap = Infinity
    for (const poly of [a, b]) {
      for (let i = 0; i < poly.length; i++) {
        const p1 = poly[i]
        const p2 = poly[(i + 1) % poly.length]
        const nx = -(p2.y - p1.y)
        const ny = p2.x - p1.x
        const len = Math.hypot(nx, ny)
        if (len === 0) continue
        const ax = nx / len
        const ay = ny / len
        let minA = Infinity, maxA = -Infinity, minB = Infinity, maxB = -Infinity
        for (const v of a) {
          const proj = v.x * ax + v.y * ay
          if (proj < minA) minA = proj
          if (proj > maxA) maxA = proj
        }
        for (const v of b) {
          const proj = v.x * ax + v.y * ay
          if (proj < minB) minB = proj
          if (proj > maxB) maxB = proj
        }
        const overlap = Math.min(maxA, maxB) - Math.max(minA, minB)
        if (overlap <= 0) return 0
        if (overlap < minOverlap) minOverlap = overlap
      }
    }
    return minOverlap
  }

  useEffect(() => {
    const id = setInterval(() => {
      if (gameOver) return
      const squares = squaresRef.current
      const lid = lidRef.current
      if (!lid || squares.length !== NUM_SQUARES) return

      const sidePx = boxSideRef.current * UNIT_PX
      const cx = CANVAS_PX / 2
      const cy = CANVAS_PX / 2
      const left = cx - sidePx / 2
      const right = cx + sidePx / 2
      const top = cy - sidePx / 2
      const bottom = cy + sidePx / 2

      const angleMod = Math.abs(((lid.angle % Math.PI) + Math.PI) % Math.PI)
      const lidLevel = Math.min(angleMod, Math.PI - angleMod) < 0.15
      const lidCentered = Math.abs(lid.position.x - cx) < sidePx * 0.25
      const lidOnTop = Math.abs(lid.position.y - top) < 20
      if (!(lidLevel && lidCentered && lidOnTop)) return

      const wallTol = 0.5
      const allInside = squares.every((s) =>
        s.vertices.every(
          (v) =>
            v.x >= left - wallTol &&
            v.x <= right + wallTol &&
            v.y >= top - wallTol &&
            v.y <= bottom + wallTol,
        ),
      )
      if (!allInside) return

      const overlapTol = 0.5
      for (let i = 0; i < squares.length; i++) {
        for (let j = i + 1; j < squares.length; j++) {
          const depth = polyOverlapDepth(
            squares[i].vertices as unknown as { x: number; y: number }[],
            squares[j].vertices as unknown as { x: number; y: number }[],
          )
          if (depth > overlapTol) return
        }
      }

      setGameOver({ score: boxSideRef.current })
    }, 200)
    return () => clearInterval(id)
  }, [gameOver])

  const reset = () => {
    const engine = engineRef.current
    if (!engine || !squaresRef.current.length) return
    Matter.Composite.remove(engine.world, squaresRef.current)
    squaresRef.current = []
  }

  const playAgain = () => {
    setGameOver(null)
    reset()
    setResetTick((t) => t + 1)
  }

  const btnStyle: React.CSSProperties = {
    background: '#C0C0C0',
    border: '2px outset #DFDFDF',
    padding: '4px 10px',
    fontFamily: 'inherit',
    fontSize: 12,
    cursor: 'pointer',
  }

  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        background: '#008080',
        padding: 12,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          background: '#C0C0C0',
          border: '2px outset #DFDFDF',
          padding: 10,
          width: CANVAS_PX + 24,
          maxWidth: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5 }}>
          Pack <b>{NUM_SQUARES}</b> unit squares into the box. Best known minimum side length:{' '}
          <b>s(17) ≈ {BEST_KNOWN_S17}</b> (Bidwell, 1998). Drag squares with your mouse, then drop
          the lid on top to seal the box.
        </p>

        <div
          style={{
            border: '2px inset #DFDFDF',
            padding: 4,
            alignSelf: 'center',
            background: '#000',
          }}
        >
          <div
            ref={containerRef}
            style={{ width: CANVAS_PX, height: CANVAS_PX, overflow: 'hidden' }}
          />
        </div>

        <div
          style={{
            border: '2px inset #DFDFDF',
            padding: 8,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            background: '#C0C0C0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 'bold', fontSize: 12 }}>BOX SIDE:</span>
            <span
              style={{
                minWidth: 70,
                textAlign: 'right',
                fontFamily: 'monospace',
                fontSize: 14,
                background: '#000',
                color: '#0f0',
                padding: '2px 6px',
                border: '1px inset #888',
              }}
            >
              {boxSide.toFixed(4)}
            </span>
            <input
              type="range"
              min={1}
              max={10}
              step={0.0001}
              value={boxSide}
              onChange={(e) => setBoxSide(parseFloat(e.target.value))}
              style={{ flex: 1, minWidth: 120 }}
            />
            <button style={btnStyle} onClick={() => setBoxSide(BEST_KNOWN_S17)}>
              Set s(17)
            </button>
          </div>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button style={btnStyle} onClick={spawnSquares}>
              ▼ Drop 17 squares
            </button>
            <button style={btnStyle} onClick={reset}>
              Clear
            </button>
            <button style={btnStyle} onClick={() => setShowOptimal(true)}>
              Show optimal packing
            </button>
          </div>
        </div>
      </div>

      {gameOver && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
          }}
        >
          <div
            style={{
              width: 380,
              background: '#C0C0C0',
              border: '2px outset #DFDFDF',
              padding: 16,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 20, color: '#6a0dad', marginBottom: 10, fontWeight: 'bold' }}>
              GAME OVER
            </div>
            <p style={{ margin: '4px 0 12px', fontSize: 12 }}>
              You sealed all 17 squares inside!
            </p>
            <div style={{ fontSize: 11, marginBottom: 4 }}>YOUR SCORE (box side):</div>
            <div
              style={{
                fontFamily: 'monospace',
                fontSize: 32,
                background: '#000',
                color: '#0f0',
                padding: '10px 6px',
                marginBottom: 10,
                border: '1px inset #888',
              }}
            >
              {gameOver.score.toFixed(4)}
            </div>
            <div style={{ fontSize: 11, color: '#444' }}>
              Best known: s(17) ≈ {BEST_KNOWN_S17}
            </div>
            {gameOver.score <= BEST_KNOWN_S17 + 0.0001 && (
              <div
                style={{ fontSize: 12, color: '#c10070', fontWeight: 'bold', marginTop: 6 }}
              >
                ★ YOU MATCHED THE RECORD! ★
              </div>
            )}
            <button
              style={{ ...btnStyle, marginTop: 14, padding: '6px 20px' }}
              onClick={playAgain}
            >
              Play again
            </button>
          </div>
        </div>
      )}

      {showOptimal && (
        <div
          onClick={() => setShowOptimal(false)}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            cursor: 'pointer',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: 480,
              background: '#C0C0C0',
              border: '2px outset #DFDFDF',
              padding: 12,
              cursor: 'default',
              textAlign: 'center',
            }}
          >
            <p style={{ fontSize: 12, margin: '0 0 12px' }}>
              Best known: <b>s(17) ≈ {BEST_KNOWN_S17}</b> (Bidwell, 1998). The smallest example
              where the optimal packing uses squares at three different angles.
            </p>
            <div style={{ border: '2px inset #DFDFDF', padding: 4, display: 'inline-block' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/optimal-17.jpeg"
                alt="Optimal packing of 17 unit squares"
                style={{ maxWidth: '100%', height: 'auto', display: 'block' }}
              />
            </div>
            <div style={{ marginTop: 12 }}>
              <button style={btnStyle} onClick={() => setShowOptimal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
