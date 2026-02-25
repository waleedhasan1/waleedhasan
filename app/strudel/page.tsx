'use client'
import dynamic from 'next/dynamic'
const StrudelInline = dynamic(() => import('../components/StrudelInline'), { ssr: false })
export default function StrudelPage() {
  return <div style={{ width: '100vw', height: '100vh' }}><StrudelInline /></div>
}
