'use client'
import dynamic from 'next/dynamic'
const SnakeGameInline = dynamic(() => import('../components/SnakeGameInline'), { ssr: false })
export default function SnakePage() {
  return <div style={{ width: '100vw', height: '100vh' }}><SnakeGameInline /></div>
}
