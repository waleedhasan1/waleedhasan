import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Waleed Hasan - Portfolio OS',
  description: 'Developer portfolio styled as a retro OS',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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