'use client'
import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { storage } from '@/lib/storage'
import { Player, PlayerStats, SpecificPosition } from '@/types/gafferos'
import styles from './profile.module.css'

const STAT_FIELDS: Record<string, { label: string; positions: SpecificPosition[] }> = {
  matches_played: { label: 'Matches Played', positions: ['GK','CB','RB','LB','RWB','LWB','CDM','CM','CAM','RM','LM','RW','LW','ST','CF','SS'] },
  goals:          { label: 'Goals',          positions: ['CM','CAM','RM','LM','RW','LW','ST','CF','SS'] },
  assists:        { label: 'Assists',         positions: ['CM','CAM','RM','LM','RW','LW','ST','CF','SS','RB','LB','RWB','LWB'] },
  saves:          { label: 'Saves',           positions: ['GK'] },
  clean_sheets:   { label: 'Clean Sheets',    positions: ['GK','CB'] },
  tackles:        { label: 'Tackles',         positions: ['CB','RB','LB','RWB','LWB','CDM','CM'] },
  interceptions:  { label: 'Interceptions',   positions: ['CB','RB','LB','RWB','LWB','CDM'] },
  key_passes:     { label: 'Key Passes',      positions: ['CM','CAM','CDM','RM','LM'] },
  chances_created:{ label: 'Chances Created', positions: ['CAM','RW','LW'] },
  crosses:        { label: 'Crosses',         positions: ['RB','LB','RWB','LWB','RM','LM','RW','LW'] },
  dribbles:       { label: 'Dribbles',        positions: ['RW','LW','ST','CAM'] },
  blocks:         { label: 'Blocks',          positions: ['CB','CDM'] },
}

function calcPIS(stats: PlayerStats, pos: SpecificPosition): number {
  const mp = stats.matches_played || 1
  let score = 0, weight = 0

  const add = (val: number | undefined, w: number, norm: number) => {
    if (val !== undefined) { score += Math.min(val / mp / norm, 1) * w; weight += w }
  }

  if (pos === 'GK') { add(stats.saves, 0.5, 4); add(stats.clean_sheets, 0.5, 0.5) }
  else if (['CB'].includes(pos)) { add(stats.tackles, 0.35, 3); add(stats.interceptions, 0.35, 2); add(stats.blocks, 0.3, 1) }
  else if (['RB','LB','RWB','LWB'].includes(pos)) { add(stats.tackles, 0.3, 3); add(stats.interceptions, 0.25, 2); add(stats.crosses, 0.25, 3); add(stats.assists, 0.2, 0.3) }
  else if (pos === 'CDM') { add(stats.tackles, 0.4, 4); add(stats.interceptions, 0.35, 3); add(stats.key_passes, 0.25, 1.5) }
  else if (pos === 'CM') { add(stats.key_passes, 0.4, 2); add(stats.assists, 0.3, 0.5); add(stats.goals, 0.3, 0.3) }
  else if (pos === 'CAM') { add(stats.key_passes, 0.3, 3); add(stats.chances_created, 0.4, 2); add(stats.assists, 0.3, 0.5) }
  else if (['RM','LM','RW','LW'].includes(pos)) { add(stats.goals, 0.3, 0.4); add(stats.assists, 0.3, 0.5); add(stats.dribbles, 0.2, 2); add(stats.crosses, 0.2, 2) }
  else { add(stats.goals, 0.5, 0.5); add(stats.assists, 0.3, 0.3); add(stats.chances_created, 0.2, 1) }

  return weight > 0 ? Math.min(score / weight, 1) : 0
}

export default function PlayerProfile() {
  const params = useParams()
  const searchParams = useSearchParams()
  const name = decodeURIComponent(params.name as string)
  const specPos = (searchParams.get('spec') || 'CM') as SpecificPosition

  const [player, setPlayer] = useState<Player | null>(null)
  const [stats, setStats] = useState<PlayerStats>({ matches_played: 0 })
  const [fitness, setFitness] = useState(100)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const players = storage.getPlayers()
    const found = players.find(p => p.name === name)
    if (found) {
      setPlayer(found)
      setFitness(Math.round((found.fitness_score ?? 1) * 100))
      if (found.stats) setStats(found.stats)
    }
  }, [name])

  const pis = stats.matches_played > 0 ? calcPIS(stats, specPos) : null

  const relevantStats = Object.entries(STAT_FIELDS).filter(([, v]) =>
    v.positions.includes(specPos)
  )

  function save() {
    const players = storage.getPlayers()
    const updated = players.map(p =>
      p.name === name ? { ...p, fitness_score: fitness / 100, stats } : p
    )
    storage.savePlayers(updated)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (!player) return (
    <div className={styles.page}>
      <div className={styles.notFound}>Player not found.</div>
    </div>
  )

  return (
    <div className={`${styles.page} page-enter`}>
      <Link href="/players" className={styles.back}>← Squad</Link>

      <div className={styles.hero}>
        {/* Silhouette */}
        <div className={styles.silhouette}>
          <svg viewBox="0 0 120 180" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="60" cy="35" r="22" fill="rgba(15,25,35,0.12)" />
            <path d="M20 180 Q20 100 60 90 Q100 100 100 180" fill="rgba(15,25,35,0.12)" />
          </svg>
          <div className={styles.shirtNumber}>{player.number ?? '—'}</div>
        </div>

        <div className={styles.heroInfo}>
          <div className={styles.posBadge}>{player.specific_position}</div>
          <h1 className={styles.playerName}>{player.name}</h1>
          <div className={styles.broadPos}>{player.position}</div>

          {pis !== null && (
            <div className={styles.pisRow}>
              <span className={styles.pisLabel}>Player Impact Score</span>
              <div className={styles.pisBar}>
                <div className={styles.pisFill} style={{ width: `${pis * 100}%` }} />
              </div>
              <span className={styles.pisVal}>{(pis * 100).toFixed(0)}</span>
            </div>
          )}
        </div>
      </div>

      <div className={styles.grid}>
        {/* Fitness */}
        <div className={styles.card}>
          <div className={styles.cardLabel}>Fitness</div>
          <div className={styles.fitnessDisplay}>
            <span className={styles.fitnessBig}>{fitness}%</span>
            <input type="range" min={0} max={100} value={fitness}
              className={styles.slider}
              onChange={e => setFitness(+e.target.value)} />
          </div>
          <div className={styles.availRow}>
            <span className={styles.availLabel}>Available</span>
            <div className={`${styles.availPill} ${player.available ? styles.availOn : styles.availOff}`}>
              {player.available ? 'Yes' : 'No'}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className={styles.card}>
          <div className={styles.cardLabel}>Season Stats</div>
          <div className={styles.statsGrid}>
            {relevantStats.map(([key, { label }]) => (
              <div key={key} className={styles.statField}>
                <label className={styles.statLabel}>{label}</label>
                <input type="number" min={0} className={styles.statInput}
                  value={(stats as Record<string, number | undefined>)[key] ?? ''}
                  onChange={e => setStats(s => ({ ...s, [key]: +e.target.value }))} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <button className={`${styles.saveBtn} ${saved ? styles.saved : ''}`} onClick={save}>
        {saved ? '✓ Saved' : 'Save Profile →'}
      </button>
    </div>
  )
}
