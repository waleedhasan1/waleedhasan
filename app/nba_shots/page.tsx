'use client'
import dynamic from 'next/dynamic'
const NBAShortChartInline = dynamic(() => import('../components/NBAShortChartInline'), { ssr: false })
export default function NBAShortChartPage() {
  return <div style={{ width: '100vw', height: '100vh' }}><NBAShortChartInline /></div>
}
