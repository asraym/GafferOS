'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { storage } from '@/lib/storage'
import { Player, PitchPlayer, SpecificPosition } from '@/types/gafferos'
import styles from './tactics.module.css'

const FORMATIONS: Record<string, Record<string, [number, number]>> = {
  '4-3-3': {
    GK: [50, 90], LB: [15, 70], LCB: [35, 75], RCB: [65, 75], RB: [85, 70],
    LCM: [25, 52], CM: [50, 48], RCM: [75, 52],
    LW: [18, 25], ST: [50, 18], RW: [82, 25],
  },
  '4-2-3-1': {
    GK: [50, 90], LB: [15, 70], LCB: [35, 75], RCB: [65, 75], RB: [85, 70],
    LDM: [33, 58], RDM: [67, 58],
    LAM: [20, 38], CAM: [50, 35], RAM: [80, 38],
    ST: [50, 18],
  },
  '4-4-2': {
    GK: [50, 90], LB: [15, 70], LCB: [35, 75], RCB: [65, 75], RB: [85, 70],
    LM: [12, 50], LCM: [35, 52], RCM: [65, 52], RM: [88, 50],
    LST: [35, 20], RST: [65, 20],
  },
  '4-5-1': {
    GK: [50, 90], LB: [15, 70], LCB: [35, 75], RCB: [65, 75], RB: [85, 70],
    LM: [10, 50], LCM: [28, 50], CM: [50, 48], RCM: [72, 50], RM: [90, 50],
    ST: [50, 18],
  },
  '5-4-1': {
    GK: [50, 90], LWB: [8, 62], LCB: [28, 78], CB: [50, 82], RCB: [72, 78], RWB: [92, 62],
    LM: [15, 48], LCM: [37, 50], RCM: [63, 50], RM: [85, 48],
    ST: [50, 18],
  },
}

const FORMATION_KEYS = Object.keys(FORMATIONS)

function buildPitchPlayers(players: Player[], formKey: string): PitchPlayer[] {
  const slots = FORMATIONS[formKey] || FORMATIONS['4-3-3']
  const available = [...players.filter(p => p.available)]
    .sort((a, b) => (b.fitness_score ?? 1) - (a.fitness_score ?? 1))

  const slotKeys = Object.keys(slots)
  const result: PitchPlayer[] = []

  // Simple greedy assignment
  const used = new Set<string>()
  slotKeys.forEach((slot, i) => {
    const [x, y] = slots[slot]
    const player = available.find(p => !used.has(p.name)) || null
    if (player) used.add(player.name)
    result.push({
      id: slot,
      name: player?.name ?? slot,
      number: player?.number,
      position: (player?.specific_position ?? 'CM') as SpecificPosition,
      x, y,
      fitness_score: player?.fitness_score ?? 1,
    })
  })
  return result
}

export default function TacticsPage() {
  const [players, setPlayers] = useState<Player[]>([])
  const [formation, setFormation] = useState('4-3-3')
  const [pitchPlayers, setPitchPlayers] = useState<PitchPlayer[]>([])
  const [dragging, setDragging] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const pitchRef = useRef<HTMLDivElement>(null)
  const dragOffset = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const p = storage.getPlayers()
    setPlayers(p)
    setPitchPlayers(buildPitchPlayers(p, formation))
  }, [])

  function changeFormation(f: string) {
    setFormation(f)
    setPitchPlayers(buildPitchPlayers(players, f))
    setSelected(null)
  }

  function resetPositions() {
    setPitchPlayers(buildPitchPlayers(players, formation))
    setSelected(null)
  }

  const getPitchCoords = useCallback((clientX: number, clientY: number) => {
    if (!pitchRef.current) return { x: 50, y: 50 }
    const rect = pitchRef.current.getBoundingClientRect()
    const x = Math.max(3, Math.min(97, ((clientX - rect.left) / rect.width) * 100))
    const y = Math.max(3, Math.min(97, ((clientY - rect.top)  / rect.height) * 100))
    return { x, y }
  }, [])

  // Mouse drag
  function onMouseDown(e: React.MouseEvent, id: string) {
    e.preventDefault()
    setDragging(id)
    setSelected(id)
    const el = e.currentTarget as HTMLElement
    const rect = el.getBoundingClientRect()
    dragOffset.current = { x: e.clientX - rect.left - rect.width/2, y: e.clientY - rect.top - rect.height/2 }
  }

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!dragging) return
      const { x, y } = getPitchCoords(e.clientX - dragOffset.current.x, e.clientY - dragOffset.current.y)
      setPitchPlayers(prev => prev.map(p => p.id === dragging ? { ...p, x, y } : p))
    }
    function onMouseUp() { setDragging(null) }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => { window.removeEventListener('mousemove', onMouseMove); window.removeEventListener('mouseup', onMouseUp) }
  }, [dragging, getPitchCoords])

  // Touch drag
  function onTouchStart(e: React.TouchEvent, id: string) {
    setDragging(id); setSelected(id)
  }

  useEffect(() => {
    function onTouchMove(e: TouchEvent) {
      if (!dragging) return
      const t = e.touches[0]
      const { x, y } = getPitchCoords(t.clientX, t.clientY)
      setPitchPlayers(prev => prev.map(p => p.id === dragging ? { ...p, x, y } : p))
    }
    function onTouchEnd() { setDragging(null) }
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend', onTouchEnd)
    return () => { window.removeEventListener('touchmove', onTouchMove); window.removeEventListener('touchend', onTouchEnd) }
  }, [dragging, getPitchCoords])

  const sel = pitchPlayers.find(p => p.id === selected)
  const fitness = sel?.fitness_score ?? 1
  const fitColor = fitness > 0.65 ? '#2d7a4f' : fitness > 0.4 ? '#c8922a' : '#c0392b'

  return (
    <div className={`${styles.page} page-enter`}>
      <div className={styles.header}>
        <div>
          <div className={styles.eyebrow}>Formation Board</div>
          <h1 className={styles.title}>Tactics</h1>
        </div>
        <div className={styles.controls}>
          <div className={styles.formationPicker}>
            {FORMATION_KEYS.map(f => (
              <button key={f}
                className={`${styles.formBtn} ${formation === f ? styles.formActive : ''}`}
                onClick={() => changeFormation(f)}>
                {f}
              </button>
            ))}
          </div>
          <button className={styles.resetBtn} onClick={resetPositions}>Reset</button>
        </div>
      </div>

      <div className={styles.layout}>
        {/* Pitch */}
        <div className={styles.pitchWrap}>
          <div className={styles.pitchContainer}>
            {/* Pitch markings */}
            <div className={styles.pitch} ref={pitchRef}>
              <svg className={styles.markings} viewBox="0 0 100 100" preserveAspectRatio="none">
                {/* Outline */}
                <rect x="2" y="2" width="96" height="96" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.4"/>
                {/* Halfway */}
                <line x1="2" y1="50" x2="98" y2="50" stroke="rgba(255,255,255,0.2)" strokeWidth="0.3"/>
                {/* Centre circle */}
                <circle cx="50" cy="50" r="12" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.3"/>
                <circle cx="50" cy="50" r="0.8" fill="rgba(255,255,255,0.3)"/>
                {/* Top box */}
                <rect x="22" y="2" width="56" height="18" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.3"/>
                <rect x="34" y="2" width="32" height="9" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.3"/>
                {/* Bottom box */}
                <rect x="22" y="80" width="56" height="18" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.3"/>
                <rect x="34" y="89" width="32" height="9" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.3"/>
                {/* Corner arcs */}
                <path d="M2,5 Q5,2 8,2" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.3"/>
                <path d="M92,2 Q98,2 98,5" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.3"/>
                <path d="M2,95 Q2,98 5,98" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.3"/>
                <path d="M98,95 Q98,98 95,98" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.3"/>
              </svg>

              {/* Players */}
              {pitchPlayers.map(p => {
                const fit = p.fitness_score ?? 1
                const color = fit > 0.65 ? '#2d7a4f' : fit > 0.4 ? '#c8922a' : '#c0392b'
                const isDrag = dragging === p.id
                const isSel  = selected === p.id
                return (
                  <div
                    key={p.id}
                    className={`${styles.player} ${isDrag ? styles.dragging : ''} ${isSel ? styles.playerSel : ''}`}
                    style={{ left: `${p.x}%`, top: `${p.y}%` }}
                    onMouseDown={e => onMouseDown(e, p.id)}
                    onTouchStart={e => onTouchStart(e, p.id)}
                    onClick={() => setSelected(isSel ? null : p.id)}
                  >
                    <div className={styles.playerDot} style={{ borderColor: color, background: isSel ? color : 'rgba(245,242,237,0.92)' }}>
                      <span className={styles.playerNum} style={{ color: isSel ? '#faf8f5' : '#0f1923' }}>
                        {p.number ?? p.position.substring(0,2)}
                      </span>
                    </div>
                    <div className={styles.playerLabel}>{p.name.split(' ').pop()}</div>
                  </div>
                )
              })}
            </div>
          </div>
          <div className={styles.pitchHint}>Drag players to reposition · Click to select</div>
        </div>

        {/* Sidebar */}
        <div className={styles.sidebar}>
          {/* Selected player info */}
          {sel ? (
            <div className={styles.selCard}>
              <div className={styles.cardLabel}>Selected</div>
              <div className={styles.selName}>{sel.name}</div>
              <div className={styles.selPos}>{sel.position}</div>
              <div className={styles.selFitness}>
                <span className={styles.selFitLabel}>Fitness</span>
                <div className={styles.selFitBar}>
                  <div style={{ width: `${fitness * 100}%`, height: '100%', background: fitColor, borderRadius: 2, transition: 'width 0.3s' }} />
                </div>
                <span className={styles.selFitVal} style={{ color: fitColor }}>{(fitness * 100).toFixed(0)}%</span>
              </div>
              <div className={styles.coords}>
                <span className={styles.coordLabel}>X</span>
                <span className={styles.coordVal}>{sel.x.toFixed(0)}</span>
                <span className={styles.coordLabel}>Y</span>
                <span className={styles.coordVal}>{sel.y.toFixed(0)}</span>
              </div>
            </div>
          ) : (
            <div className={styles.selCard}>
              <div className={styles.cardLabel}>Selected</div>
              <div className={styles.noSel}>Click a player on the pitch to inspect</div>
            </div>
          )}

          {/* Formation overview */}
          <div className={styles.formCard}>
            <div className={styles.cardLabel}>Formation</div>
            <div className={styles.formBig}>{formation}</div>
            <div className={styles.playerList}>
              {pitchPlayers.map((p, i) => (
                <div key={p.id}
                  className={`${styles.listRow} ${selected === p.id ? styles.listRowSel : ''}`}
                  onClick={() => setSelected(selected === p.id ? null : p.id)}>
                  <span className={styles.listNum}>{i + 1}</span>
                  <span className={styles.listPos}>{p.position}</span>
                  <span className={styles.listName}>{p.name}</span>
                  <span className={styles.listFit} style={{
                    color: (p.fitness_score ?? 1) > 0.65 ? 'var(--green)' : (p.fitness_score ?? 1) > 0.4 ? 'var(--amber)' : 'var(--red)'
                  }}>
                    {((p.fitness_score ?? 1) * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
