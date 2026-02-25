'use client'
import dynamic from 'next/dynamic'
const IPodInline = dynamic(() => import('../components/IPodInline'), { ssr: false })
export default function IPodPage() {
  return <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}><IPodInline /></div>
}
