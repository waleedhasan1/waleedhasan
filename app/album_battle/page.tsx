'use client'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
const AlbumBattleInline = dynamic(() => import('../components/AlbumBattleInline'), { ssr: false })
export default function AlbumBattlePage() {
  const router = useRouter()
  return <div style={{ width: '100vw', height: '100vh' }}><AlbumBattleInline openLeaderboard={() => router.push('/album_leaderboard')} /></div>
}
