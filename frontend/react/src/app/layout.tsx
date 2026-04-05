import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'

export const metadata: Metadata = {
  title: 'GafferOS',
  description: 'Tactical intelligence for every club.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main style={{ paddingTop: 'var(--nav-h)' }}>
          {children}
        </main>
      </body>
    </html>
  )
}
