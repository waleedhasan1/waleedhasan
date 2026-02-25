'use client'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
const AlbumLeaderboardInline = dynamic(() => import('../components/AlbumLeaderboardInline'), { ssr: false })
export default function AlbumLeaderboardPage() {
  const router = useRouter()
  return <div style={{ width: '100vw', height: '100vh' }}><AlbumLeaderboardInline openBattle={() => router.push('/album_battle')} /></div>
}
