'use client'
import { useState } from 'react'
import type { Player, BroadPosition, SpecificPosition } from '@/types/gafferos'
import { POSITION_MAP, ALL_SPECIFICS } from '@/types/gafferos'
import styles from './SquadBuilder.module.css'

type Props = {
  players: Player[]
  onChange: (players: Player[]) => void
}

function makePlayer(i: number): Player {
  return {
    name: `Player ${i + 1}`,
    position: 'MID',
    specific_position: 'CM',
    secondary_position: null,
    available: true,
    fitness_score: 0.85,
  }
}

function fitnessColour(f: number): string {
  if (f >= 0.8) return 'var(--green)'
  if (f >= 0.65) return 'var(--amber)'
  return 'var(--red)'
}

export default function SquadBuilder({ players, onChange }: Props) {
  const [count, setCount] = useState(players.length || 0)

  function handleCount(n: number) {
    setCount(n)
    if (n > players.length) {
      const added = Array.from({ length: n - players.length }, (_, i) =>
        makePlayer(players.length + i)
      )
      onChange([...players, ...added])
    } else {
      onChange(players.slice(0, n))
    }
  }

  function updatePlayer(idx: number, patch: Partial<Player>) {
    const next = players.map((p, i) => (i === idx ? { ...p, ...patch } : p))
    if (patch.position) {
      next[idx].specific_position = POSITION_MAP[patch.position as BroadPosition][0]
      next[idx].secondary_position = null
    }
    onChange(next)
  }

  function removePlayer(idx: number) {
    const next = players.filter((_, i) => i !== idx)
    onChange(next)
    setCount(next.length)
  }

  return (
    <div className={styles.root}>
      <div className={styles.controls}>
        <div className={styles.countField}>
          <label>Number of Players</label>
          <div className={styles.countRow}>
            <button className={`btn btn-ghost ${styles.countBtn}`} type="button"
              onClick={() => handleCount(Math.max(0, count - 1))}>−</button>
            <span className={styles.countNum}>{count}</span>
            <button className={`btn btn-ghost ${styles.countBtn}`} type="button"
              onClick={() => handleCount(Math.min(25, count + 1))}>+</button>
          </div>
        </div>
        <div className={styles.legend}>
          <div className={styles.legendItem}><span className={styles.dot} style={{ background: 'var(--green)' }} /> Fit ≥80%</div>
          <div className={styles.legendItem}><span className={styles.dot} style={{ background: 'var(--amber)' }} /> Caution 65–79%</div>
          <div className={styles.legendItem}><span className={styles.dot} style={{ background: 'var(--red)' }} /> Risk &lt;65%</div>
        </div>
      </div>

      {players.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>👤</span>
          <p>No players added yet. Increase the count above.</p>
          <p className={styles.emptySub}>Without player data, fatigue defaults to 0.30 and no rotation advice is given.</p>
        </div>
      ) : (
        <div className={styles.table}>
          <div className={styles.tableHeader}>
            <span>Name</span>
            <span>Group</span>
            <span>Position</span>
            <span>2nd Pos</span>
            <span>Fitness</span>
            <span>Available</span>
            <span></span>
          </div>

          {players.map((p, i) => {
            const specifics = POSITION_MAP[p.position]
            const otherSpecifics: SpecificPosition[] = ALL_SPECIFICS.filter(s => s !== p.specific_position)
            const fColour = fitnessColour(p.fitness_score)

            return (
              <div key={i} className={styles.row}>
                <input type="text" value={p.name}
                  onChange={e => updatePlayer(i, { name: e.target.value })}
                  className={styles.nameInput} />

                <select value={p.position}
                  onChange={e => updatePlayer(i, { position: e.target.value as BroadPosition })}>
                  {(['GK', 'DEF', 'MID', 'FWD'] as BroadPosition[]).map(pos => (
                    <option key={pos} value={pos}>{pos}</option>
                  ))}
                </select>

                <select value={p.specific_position}
                  onChange={e => updatePlayer(i, { specific_position: e.target.value as SpecificPosition })}>
                  {specifics.map(s => <option key={s} value={s}>{s}</option>)}
                </select>

                <select value={p.secondary_position ?? ''}
                  onChange={e => updatePlayer(i, { secondary_position: (e.target.value || null) as SpecificPosition | null })}>
                  <option value="">—</option>
                  {otherSpecifics.map(s => <option key={s} value={s}>{s}</option>)}
                </select>

                <div className={styles.fitnessCell}>
                  <span className={styles.fitnessPct} style={{ color: fColour }}>
                    {Math.round(p.fitness_score * 100)}%
                  </span>
                  <input type="range" min={0} max={1} step={0.01} value={p.fitness_score}
                    onChange={e => updatePlayer(i, { fitness_score: parseFloat(e.target.value) })}
                    className={styles.fitnessSlider} />
                </div>

                <div className={styles.availCell}>
                  <input type="checkbox" checked={p.available}
                    onChange={e => updatePlayer(i, { available: e.target.checked })} />
                  <span className={p.available ? styles.availYes : styles.availNo}>
                    {p.available ? 'Yes' : 'No'}
                  </span>
                </div>

                <button type="button" className={`btn btn-danger ${styles.removeBtn}`}
                  onClick={() => removePlayer(i)}>✕</button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}