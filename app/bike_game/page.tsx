'use client'
import dynamic from 'next/dynamic'
const BikeGameInline = dynamic(() => import('../components/BikeGameInline'), { ssr: false })
export default function BikeGamePage() {
  return <div style={{ width: '100vw', height: '100vh' }}><BikeGameInline /></div>
}
