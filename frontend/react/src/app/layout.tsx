import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'GafferOS — Tactical Intelligence',
  description: 'AI-assisted tactical decision support for grassroots football clubs.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}