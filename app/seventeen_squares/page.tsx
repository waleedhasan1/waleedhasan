'use client'
import dynamic from 'next/dynamic'
const SeventeenSquaresInline = dynamic(() => import('../components/SeventeenSquaresInline'), { ssr: false })
export default function SeventeenSquaresPage() {
  return <div style={{ width: '100vw', height: '100vh' }}><SeventeenSquaresInline /></div>
}
