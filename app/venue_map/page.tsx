'use client'
import dynamic from 'next/dynamic'
const VenueMapInline = dynamic(() => import('../components/VenueMapInline'), { ssr: false })
export default function VenueMapPage() {
  return <div style={{ width: '100vw', height: '100vh' }}><VenueMapInline /></div>
}
