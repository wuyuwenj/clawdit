import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import './globals.css'

export const metadata: Metadata = {
  title: 'Clawdit | Autonomous Security Scanner for OpenClaw',
  description:
    'A premium dark landing page for Clawdit, the local-first autonomous security scanner for OpenClaw agents.'
}

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
