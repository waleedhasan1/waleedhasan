'use client'
import dynamic from 'next/dynamic'
const RentMapInline = dynamic(() => import('../components/RentMapInline'), { ssr: false })
export default function RentMapPage() {
  return <div style={{ width: '100vw', height: '100vh' }}><RentMapInline /></div>
}
