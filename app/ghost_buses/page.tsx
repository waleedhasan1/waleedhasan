'use client'
import dynamic from 'next/dynamic'
const GhostBusMapInline = dynamic(() => import('../components/GhostBusMapInline'), { ssr: false })
export default function GhostBusesPage() {
  return <div style={{ width: '100vw', height: '100vh' }}><GhostBusMapInline /></div>
}
