'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { storage } from '@/lib/storage'
import { Player, BroadPosition, SpecificPosition } from '@/types/gafferos'
import styles from './players.module.css'

const POSITIONS: { broad: BroadPosition; specifics: SpecificPosition[] }[] = [
  { broad: 'GK',  specifics: ['GK'] },
  { broad: 'DEF', specifics: ['CB','RB','LB','RWB','LWB'] },
  { broad: 'MID', specifics: ['CDM','CM','CAM','RM','LM'] },
  { broad: 'FWD', specifics: ['RW','LW','ST','CF','SS'] },
]

const BROAD_LABEL: Record<BroadPosition, string> = {
  GK: 'Goalkeepers', DEF: 'Defenders', MID: 'Midfielders', FWD: 'Forwards'
}

function FitnessRing({ value }: { value: number }) {
  const r = 20, circ = 2 * Math.PI * r
  const pct = value ?? 1
  const color = pct > 0.65 ? '#2d7a4f' : pct > 0.4 ? '#c8922a' : '#c0392b'
  return (
    <svg width={52} height={52} viewBox="0 0 52 52">
      <circle cx={26} cy={26} r={r} fill="none" stroke="#ede9e2" strokeWidth={4} />
      <circle cx={26} cy={26} r={r} fill="none" stroke={color} strokeWidth={4}
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - pct)}
        strokeLinecap="round"
        transform="rotate(-90 26 26)"
        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
      />
      <text x={26} y={30} textAnchor="middle"
        style={{ fontSize: 11, fontFamily: "'DM Mono',monospace", fill: '#0f1923' }}>
        {Math.round(pct * 100)}
      </text>
    </svg>
  )
}

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [filter, setFilter] = useState<BroadPosition | 'ALL'>('ALL')
  const [newPlayer, setNewPlayer] = useState<Partial<Player>>({
    available: true, fitness_score: 1.0
  })

  useEffect(() => { setPlayers(storage.getPlayers()) }, [])

  function saveAll(updated: Player[]) {
    setPlayers(updated)
    storage.savePlayers(updated)
  }

  function addPlayer() {
    if (!newPlayer.name || !newPlayer.position || !newPlayer.specific_position) return
    const p: Player = {
      name: newPlayer.name!,
      position: newPlayer.position!,
      specific_position: newPlayer.specific_position!,
      available: newPlayer.available ?? true,
      fitness_score: newPlayer.fitness_score ?? 1.0,
      number: newPlayer.number,
    }
    saveAll([...players, p])
    setNewPlayer({ available: true, fitness_score: 1.0 })
    setShowAdd(false)
  }

  function removePlayer(name: string) {
    saveAll(players.filter(p => p.name !== name))
  }

  function toggleAvailable(name: string) {
    saveAll(players.map(p => p.name === name ? { ...p, available: !p.available } : p))
  }

  const filtered = filter === 'ALL' ? players : players.filter(p => p.position === filter)
  const byBroad = POSITIONS.map(g => ({
    ...g,
    players: filtered.filter(p => p.position === g.broad)
  })).filter(g => g.players.length > 0)

  const available = players.filter(p => p.available).length
  const avgFit = players.length
    ? (players.reduce((s, p) => s + (p.fitness_score ?? 1), 0) / players.length * 100).toFixed(0)
    : null

  return (
    <div className={`${styles.page} page-enter`}>
      <div className={styles.header}>
        <div>
          <div className={styles.eyebrow}>Squad Management</div>
          <h1 className={styles.title}>Players</h1>
        </div>
        <button className={styles.addBtn} onClick={() => setShowAdd(!showAdd)}>
          {showAdd ? '✕ Cancel' : '+ Add Player'}
        </button>
      </div>

      {/* Stats strip */}
      <div className={styles.statsStrip}>
        <div className={styles.stat}>
          <div className={styles.statNum}>{players.length}</div>
          <div className={styles.statLabel}>Total Players</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statNum}>{available}</div>
          <div className={styles.statLabel}>Available</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statNum}>{avgFit ? `${avgFit}%` : '—'}</div>
          <div className={styles.statLabel}>Avg Fitness</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statNum}>{players.length - available}</div>
          <div className={styles.statLabel}>Unavailable</div>
        </div>
      </div>

      {/* Add Player Form */}
      {showAdd && (
        <div className={styles.addForm}>
          <div className={styles.addFormTitle}>New Player</div>
          <div className={styles.addGrid}>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Name</label>
              <input className={styles.input} placeholder="James Smith"
                value={newPlayer.name || ''}
                onChange={e => setNewPlayer(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Number</label>
              <input type="number" className={styles.input} placeholder="9"
                value={newPlayer.number || ''}
                onChange={e => setNewPlayer(p => ({ ...p, number: +e.target.value }))} />
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Broad Position</label>
              <select className={styles.input}
                value={newPlayer.position || ''}
                onChange={e => setNewPlayer(p => ({ ...p, position: e.target.value as BroadPosition, specific_position: undefined }))}>
                <option value="">Select...</option>
                {POSITIONS.map(g => <option key={g.broad} value={g.broad}>{g.broad}</option>)}
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Specific Position</label>
              <select className={styles.input}
                value={newPlayer.specific_position || ''}
                onChange={e => setNewPlayer(p => ({ ...p, specific_position: e.target.value as SpecificPosition }))}>
                <option value="">Select...</option>
                {(POSITIONS.find(g => g.broad === newPlayer.position)?.specifics || []).map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Fitness (0–100)</label>
              <input type="number" min={0} max={100} className={styles.input}
                value={Math.round((newPlayer.fitness_score ?? 1) * 100)}
                onChange={e => setNewPlayer(p => ({ ...p, fitness_score: +e.target.value / 100 }))} />
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Available</label>
              <select className={styles.input}
                value={newPlayer.available ? 'yes' : 'no'}
                onChange={e => setNewPlayer(p => ({ ...p, available: e.target.value === 'yes' }))}>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
          </div>
          <button className={styles.saveBtn} onClick={addPlayer}>Add to Squad →</button>
        </div>
      )}

      {/* Filter */}
      <div className={styles.filters}>
        {(['ALL', 'GK', 'DEF', 'MID', 'FWD'] as const).map(f => (
          <button key={f}
            className={`${styles.filterBtn} ${filter === f ? styles.filterActive : ''}`}
            onClick={() => setFilter(f)}>
            {f}
          </button>
        ))}
      </div>

      {/* Player groups */}
      {players.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>◎</div>
          <div className={styles.emptyTitle}>No Players Yet</div>
          <p>Add your squad members using the button above.</p>
        </div>
      ) : (
        byBroad.map(group => (
          <div key={group.broad} className={styles.group}>
            <div className={styles.groupLabel}>{BROAD_LABEL[group.broad]}</div>
            <div className={styles.playerGrid}>
              {group.players.map(p => (
                <div key={p.name} className={`${styles.playerCard} ${!p.available ? styles.unavailable : ''}`}>
                  <div className={styles.cardTop}>
                    <div className={styles.numberBadge}>{p.number ?? '—'}</div>
                    <div className={styles.posBadge}>{p.specific_position}</div>
                    <button className={styles.removeBtn} onClick={() => removePlayer(p.name)}>✕</button>
                  </div>
                  <FitnessRing value={p.fitness_score ?? 1} />
                  <div className={styles.playerName}>{p.name}</div>
                  <div className={styles.cardActions}>
                    <button
                      className={`${styles.availBtn} ${p.available ? styles.availOn : styles.availOff}`}
                      onClick={() => toggleAvailable(p.name)}>
                      {p.available ? 'Available' : 'Unavailable'}
                    </button>
                    <Link href={`/players/${encodeURIComponent(p.name)}?pos=${p.position}&spec=${p.specific_position}`}
                      className={styles.profileLink}>
                      View ↗
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
