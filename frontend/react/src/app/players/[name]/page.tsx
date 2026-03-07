'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams} from 'next/navigation'
import { getProfile, upsertProfile, loadProfiles, saveProfiles } from '@/lib/storage'
import type { PlayerProfile } from '@/lib/storage'
import { calculatePIS, getStatFields } from '@/lib/pis'
import styles from './PlayerPage.module.css'

export default function PlayerPage() {
  const params = useParams()
  const router = useRouter()
  const name = decodeURIComponent(params.name as string)
  const searchParams = useSearchParams()

  const [profile, setProfile] = useState<PlayerProfile | null>(null)
  const [saved, setSaved] = useState(false)

useEffect(() => {
  const p = getProfile(name)
  if (p) {
    setProfile(p)
  } else {
    // Player exists in squad but hasn't been saved yet
    // Create a minimal profile so the page still loads
    const pos = searchParams.get('pos') ?? 'MID'
    const spec = searchParams.get('spec') ?? 'CM'
    setProfile({
      name,
      position: pos as any,
      specific_position: spec as any,
      secondary_position: null,
      available: true,
      fitness_score: 0.85,
      stats: { matches_played: 0 }
    })
  }
}, [name])

  if (!profile) {
    return (
      <div className={styles.notFound}>
        <p>Player <strong>{name}</strong> not found.</p>
        <button className="btn btn-ghost" onClick={() => router.back()}>← Back</button>
      </div>
    )
  }

  const pis = calculatePIS(profile)
  const pisDisplay = pis !== null ? Math.round(pis * 100) : null
  const statFields = getStatFields(profile.specific_position)

  function updateStat(key: string, val: number) {
    setProfile(prev => {
      if (!prev) return prev
        const updated = {
          ...prev,
          stats: {
            ...prev.stats,
            [key]: val
       }
      }
     return updated
    })
   setSaved(false)
  }

  function updateFitness(val: number) {
    setProfile(prev => prev ? { ...prev, fitness_score: val } : prev)
    setSaved(false)
  }

  function toggleAvailable() {
    setProfile(prev => prev ? { ...prev, available: !prev.available } : prev)
    setSaved(false)
  }

  function handleSave() {
  if (!profile) return
  const all = loadProfiles()
  const idx = all.findIndex(p => p.name === profile.name)
  if (idx >= 0) {
    all[idx] = JSON.parse(JSON.stringify(profile)) // deep copy
  } else {
    all.push(JSON.parse(JSON.stringify(profile)))
  }
  localStorage.setItem('gafferos_players', JSON.stringify(all))
  setSaved(true)
}
  function pisColour(p: number): string {
    if (p >= 70) return 'var(--green)'
    if (p >= 45) return 'var(--amber)'
    return 'var(--red)'
  }

  function fitnessColour(f: number): string {
    if (f >= 0.8) return 'var(--green)'
    if (f >= 0.65) return 'var(--amber)'
    return 'var(--red)'
  }

  return (
    <div className={styles.root}>
      <div className={styles.inner}>

        {/* Back */}
        <button className={`btn btn-ghost ${styles.back}`} onClick={() => router.back()}>
          ← Back to Squad
        </button>

        {/* Header */}
        <div className={styles.header}>
          {/* Photo placeholder */}
          <div className={styles.photo}>
            <span className={styles.photoIcon}>👤</span>
          </div>

          <div className={styles.headerInfo}>
            <div className={styles.badges}>
              <span className="tag tag-amber">{profile.specific_position}</span>
              <span className="tag tag-blue">{profile.position}</span>
              <span
                className={`tag ${profile.available ? 'tag-green' : 'tag-red'}`}
                style={{ cursor: 'pointer' }}
                onClick={toggleAvailable}
              >
                {profile.available ? 'Available' : 'Unavailable'}
              </span>
            </div>
            <h1 className={styles.name}>{profile.name}</h1>

            {/* PIS */}
            {pisDisplay !== null ? (
              <div className={styles.pisSection}>
                <span className={styles.pisLabel}>IMPACT SCORE</span>
                <span className={styles.pisValue} style={{ color: pisColour(pisDisplay) }}>
                  {pisDisplay}
                </span>
                <div className={styles.pisBar}>
                  <div
                    className={styles.pisFill}
                    style={{
                      width: `${pisDisplay}%`,
                      background: pisColour(pisDisplay),
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className={styles.pisSection}>
                <span className={styles.pisLabel}>IMPACT SCORE</span>
                <span className={styles.pisNone}>Enter stats below to calculate</span>
              </div>
            )}
          </div>
        </div>

        <div className={styles.grid}>

          {/* Fitness */}
          <div className="card">
            <div className="section-header">
              <span className="section-title">Fitness</span>
              <div className="section-line" />
            </div>
            <div className={styles.fitnessRow}>
              <span
                className={styles.fitnessBig}
                style={{ color: fitnessColour(profile.fitness_score) }}
              >
                {Math.round(profile.fitness_score * 100)}%
              </span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={profile.fitness_score}
                onChange={e => updateFitness(parseFloat(e.target.value))}
                className={styles.fitnessSlider}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="card">
            <div className="section-header">
              <span className="section-title">Season Stats</span>
              <div className="section-line" />
            </div>

            {/* Matches played — always first */}
            <div className={styles.statRow}>
              <label>Matches Played</label>
              <input
                type="number"
                min={0}
                value={profile.stats.matches_played ?? 0}
                onChange={e => updateStat('matches_played', parseInt(e.target.value) || 0)}
              />
            </div>

            {/* Position-specific stats */}
            {statFields.map(f => (
              <div key={f.key} className={styles.statRow}>
                <label>{f.label}</label>
                <input
                  type="number"
                  min={0}
                  value={(profile.stats[f.key] as number) ?? 0}
                  onChange={e => updateStat(f.key, parseInt(e.target.value) || 0)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Save button */}
        <div className={styles.saveBar}>
          {saved && (
            <span className={styles.savedMsg}>✓ Profile saved</span>
          )}
          <button className="btn btn-primary" onClick={handleSave}>
            💾 Save Profile
          </button>
        </div>

      </div>
    </div>
  )
}