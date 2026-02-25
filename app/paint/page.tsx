'use client'
import dynamic from 'next/dynamic'
const SharedPaintAppInline = dynamic(() => import('../components/SharedPaintAppInline'), { ssr: false })
export default function PaintPage() {
  return <div style={{ width: '100vw', height: '100vh' }}><SharedPaintAppInline /></div>
}
