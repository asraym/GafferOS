'use client'
import styles from './Navbar.module.css'

export default function Navbar() {
  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <span className={styles.logo}>⚽</span>
          <span className={styles.name}>GAFFER<span className={styles.os}>OS</span></span>
          <span className={styles.version}>v1.0</span>
        </div>
        <div className={styles.status}>
          <span className={styles.dot} />
          <span className={styles.statusText}>ENGINE READY</span>
        </div>
      </div>
    </nav>
  )
}