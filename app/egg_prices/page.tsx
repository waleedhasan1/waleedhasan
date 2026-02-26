'use client'
import dynamic from 'next/dynamic'
const EggPriceMapInline = dynamic(() => import('../components/EggPriceMapInline'), { ssr: false })
export default function EggPricesPage() {
  return <div style={{ width: '100vw', height: '100vh' }}><EggPriceMapInline /></div>
}
