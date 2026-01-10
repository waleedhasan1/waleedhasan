'use client'

import { useEffect, useRef, useState } from 'react'

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'
type Position = { x: number; y: number }

export default function SnakeGameInline() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gameStarted, setGameStarted] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  // Game state refs
  const snake = useRef<Position[]>([{ x: 10, y: 10 }])
  const direction = useRef<Direction>('RIGHT')
  const nextDirection = useRef<Direction>('RIGHT')
  const food = useRef<Position>({ x: 15, y: 15 })
  const gameLoop = useRef<NodeJS.Timeout | null>(null)

  const GRID_SIZE = 20
  const CELL_SIZE = 20
  const GAME_SPEED = 100 // ms

  useEffect(() => {
    // Load high score from localStorage
    const saved = localStorage.getItem('snakeHighScore')
    if (saved) setHighScore(parseInt(saved))
  }, [])

  useEffect(() => {
    if (!gameStarted || gameOver) return

    const handleKeyPress = (e: KeyboardEvent) => {
      // Handle pause/resume separately - always available
      if (e.key === ' ') {
        e.preventDefault()
        setIsPaused(prev => !prev)
        return
      }

      // Only handle movement keys when not paused
      if (isPaused) return
      
      e.preventDefault()
      
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
          if (direction.current !== 'DOWN') nextDirection.current = 'UP'
          break
        case 'ArrowDown':
        case 's':
          if (direction.current !== 'UP') nextDirection.current = 'DOWN'
          break
        case 'ArrowLeft':
        case 'a':
          if (direction.current !== 'RIGHT') nextDirection.current = 'LEFT'
          break
        case 'ArrowRight':
        case 'd':
          if (direction.current !== 'LEFT') nextDirection.current = 'RIGHT'
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [gameStarted, gameOver, isPaused])

  const spawnFood = () => {
    let newFood: Position
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      }
    } while (snake.current.some(seg => seg.x === newFood.x && seg.y === newFood.y))
    
    food.current = newFood
  }

  const startGame = () => {
    snake.current = [{ x: 10, y: 10 }]
    direction.current = 'RIGHT'
    nextDirection.current = 'RIGHT'
    spawnFood()
    setScore(0)
    setGameOver(false)
    setGameStarted(true)
    setIsPaused(false)
  }

  const endGame = () => {
    setGameOver(true)
    if (gameLoop.current) clearInterval(gameLoop.current)
    
    if (score > highScore) {
      setHighScore(score)
      localStorage.setItem('snakeHighScore', score.toString())
    }
  }

  useEffect(() => {
    if (!gameStarted || gameOver || isPaused) return

    gameLoop.current = setInterval(() => {
      direction.current = nextDirection.current

      const head = snake.current[0]
      let newHead: Position

      switch (direction.current) {
        case 'UP':
          newHead = { x: head.x, y: head.y - 1 }
          break
        case 'DOWN':
          newHead = { x: head.x, y: head.y + 1 }
          break
        case 'LEFT':
          newHead = { x: head.x - 1, y: head.y }
          break
        case 'RIGHT':
          newHead = { x: head.x + 1, y: head.y }
          break
      }

      // Check wall collision
      if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
        endGame()
        return
      }

      // Check self collision
      if (snake.current.some(seg => seg.x === newHead.x && seg.y === newHead.y)) {
        endGame()
        return
      }

      const newSnake = [newHead, ...snake.current]

      // Check food collision
      if (newHead.x === food.current.x && newHead.y === food.current.y) {
        setScore(prev => prev + 10)
        spawnFood()
      } else {
        newSnake.pop()
      }

      snake.current = newSnake
      drawGame()
    }, GAME_SPEED)

    return () => {
      if (gameLoop.current) clearInterval(gameLoop.current)
    }
  }, [gameStarted, gameOver, isPaused])

  const drawGame = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas - teal background
    ctx.fillStyle = '#008080'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw snake with beveled shading
    snake.current.forEach((segment, index) => {
      const x = segment.x * CELL_SIZE + 1
      const y = segment.y * CELL_SIZE + 1
      const size = CELL_SIZE - 2
      
      // All segments are gray with bevel
      ctx.fillStyle = '#C0C0C0'
      ctx.fillRect(x, y, size, size)
      // White top-left edge (bevel highlight)
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(x, y, size, 2)
      ctx.fillRect(x, y, 2, size)
      // Dark gray bottom-right edge (bevel shadow)
      ctx.fillStyle = '#808080'
      ctx.fillRect(x, y + size - 2, size, 2)
      ctx.fillRect(x + size - 2, y, 2, size)
    })

    // Draw food with bevel
    const fx = food.current.x * CELL_SIZE + 1
    const fy = food.current.y * CELL_SIZE + 1
    const fsize = CELL_SIZE - 2
    
    ctx.fillStyle = '#000080'
    ctx.fillRect(fx, fy, fsize, fsize)
    // Lighter top-left edge
    ctx.fillStyle = '#0000FF'
    ctx.fillRect(fx, fy, fsize, 2)
    ctx.fillRect(fx, fy, 2, fsize)
    // Darker bottom-right edge
    ctx.fillStyle = '#000040'
    ctx.fillRect(fx, fy + fsize - 2, fsize, 2)
    ctx.fillRect(fx + fsize - 2, fy, 2, fsize)
  }

  useEffect(() => {
    if (gameStarted && !gameOver && !isPaused) {
      drawGame()
    }
  }, [gameStarted, gameOver, isPaused])

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
          🐍 SNAKE GAME
        </div>

        {/* Score Display */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-around',
          background: '#C0C0C0',
          padding: 8,
          border: '2px inset #DFDFDF',
          marginBottom: 8
        }}>
          <div style={{
            color: '#000080',
            fontFamily: 'Courier New, monospace',
            fontSize: 14,
            fontWeight: 'bold'
          }}>
            SCORE: {score}
          </div>
          <div style={{
            color: '#000080',
            fontFamily: 'Courier New, monospace',
            fontSize: 14,
            fontWeight: 'bold'
          }}>
            HIGH: {highScore}
          </div>
        </div>

        {/* Controls */}
        <div style={{
          background: '#C0C0C0',
          padding: 8,
          border: '2px inset #DFDFDF',
          color: '#000',
          fontSize: 9,
          textAlign: 'center'
        }}>
          {!gameStarted ? (
            <div>Press START to begin!</div>
          ) : isPaused ? (
            <div>PAUSED - Press SPACE to resume</div>
          ) : (
            <div>Arrow Keys / WASD to move • SPACE to pause</div>
          )}
        </div>
      </div>

      {/* Game Canvas */}
      <div style={{
        flex: 1,
        background: '#C0C0C0',
        border: '2px inset #DFDFDF',
        padding: 4,
        boxShadow: '2px 2px 0 rgba(0,0,0,0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
      }}>
        <canvas
          ref={canvasRef}
          width={GRID_SIZE * CELL_SIZE}
          height={GRID_SIZE * CELL_SIZE}
          style={{
            border: '2px solid #000080',
            background: '#008080'
          }}
        />

        {/* Game Over Overlay */}
        {gameOver && (
          <div style={{
            position: 'absolute',
            background: '#C0C0C0',
            padding: 20,
            border: '3px outset #DFDFDF',
            textAlign: 'center',
            boxShadow: '4px 4px 0 rgba(0,0,0,0.5)'
          }}>
            <div style={{
              color: '#000080',
              fontSize: 24,
              fontWeight: 'bold',
              marginBottom: 16,
              fontFamily: 'Courier New, monospace'
            }}>
              GAME OVER!
            </div>
            <div style={{
              color: '#000',
              fontSize: 16,
              marginBottom: 16,
              fontFamily: 'Courier New, monospace'
            }}>
              Final Score: {score}
            </div>
            {score === highScore && score > 0 && (
              <div style={{
                color: '#000080',
                fontSize: 14,
                marginBottom: 16,
                fontFamily: 'Courier New, monospace'
              }}>
                🏆 NEW HIGH SCORE! 🏆
              </div>
            )}
            <button
              onClick={startGame}
              style={{
                background: '#C0C0C0',
                color: '#000',
                border: '2px outset #DFDFDF',
                padding: '8px 24px',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 'bold'
              }}
              onMouseDown={(e) => e.currentTarget.style.border = '2px inset #DFDFDF'}
              onMouseUp={(e) => e.currentTarget.style.border = '2px outset #DFDFDF'}
            >
              PLAY AGAIN
            </button>
          </div>
        )}

        {/* Start Screen */}
        {!gameStarted && (
          <div style={{
            position: 'absolute',
            background: '#C0C0C0',
            padding: 20,
            border: '3px outset #DFDFDF',
            textAlign: 'center',
            boxShadow: '4px 4px 0 rgba(0,0,0,0.5)'
          }}>
            <div style={{
              color: '#000080',
              fontSize: 24,
              fontWeight: 'bold',
              marginBottom: 16,
              fontFamily: 'Courier New, monospace'
            }}>
              SNAKE
            </div>
            <div style={{
              color: '#000',
              fontSize: 12,
              marginBottom: 16,
              lineHeight: 1.8
            }}>
              • Eat dark blue food to grow<br/>
              • Don't hit walls or yourself<br/>
              • Arrow keys or WASD to move
            </div>
            <button
              onClick={startGame}
              style={{
                background: '#C0C0C0',
                color: '#000',
                border: '2px outset #DFDFDF',
                padding: '8px 24px',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 'bold'
              }}
              onMouseDown={(e) => e.currentTarget.style.border = '2px inset #DFDFDF'}
              onMouseUp={(e) => e.currentTarget.style.border = '2px outset #DFDFDF'}
            >
              START GAME
            </button>
          </div>
        )}
      </div>
    </div>
  )
}