'use client'
import dynamic from 'next/dynamic'
const WeatherRadarInline = dynamic(() => import('../components/WeatherRadarInline'), { ssr: false })
export default function WeatherRadarPage() {
  return <div style={{ width: '100vw', height: '100vh' }}><WeatherRadarInline /></div>
}
