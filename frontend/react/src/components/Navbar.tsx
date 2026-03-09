'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './Navbar.module.css'

const links = [
  { href: '/',        label: 'Dashboard' },
  { href: '/players', label: 'Players'   },
  { href: '/tactics', label: 'Tactics'   },
]

export default function Navbar() {
  const path = usePathname()
  return (
    <nav className={styles.nav}>
      <Link href="/" className={styles.logo}>
        <span className={styles.logoDot} />
        GAFFEROS
      </Link>
      <div className={styles.links}>
        {links.map(l => (
          <Link
            key={l.href}
            href={l.href}
            className={`${styles.link} ${path === l.href ? styles.active : ''}`}
          >
            {l.label}
          </Link>
        ))}
      </div>
      <div className={styles.right}>
        <span className={styles.badge}>Beta</span>
      </div>
    </nav>
  )
}
