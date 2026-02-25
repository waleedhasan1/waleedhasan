'use client'
import dynamic from 'next/dynamic'
const ChatAppInline = dynamic(() => import('../components/ChatAppInline'), { ssr: false })
export default function ChatPage() {
  return <div style={{ width: '100vw', height: '100vh' }}><ChatAppInline /></div>
}
