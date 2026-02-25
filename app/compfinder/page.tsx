'use client'
import dynamic from 'next/dynamic'
const CompFinderInline = dynamic(() => import('../components/CompFinderInline'), { ssr: false })
export default function CompFinderPage() {
  return <div style={{ width: '100vw', height: '100vh' }}><CompFinderInline /></div>
}
