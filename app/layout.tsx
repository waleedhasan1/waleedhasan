import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Waleed Hasan - Portfolio OS',
  description: 'Developer portfolio styled as a retro OS',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}