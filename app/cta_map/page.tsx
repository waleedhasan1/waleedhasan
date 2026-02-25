'use client'
import dynamic from 'next/dynamic'
const MapComponentInline = dynamic(() => import('../components/MapComponentInline'), { ssr: false })
export default function CTAMapPage() {
  return <div style={{ width: '100vw', height: '100vh' }}><MapComponentInline /></div>
}
