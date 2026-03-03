'use client'
import { useState, useRef } from 'react'
import type { PlayerSlot, SpecificPosition, TacticalReport } from '@/types/gafferos'
import styles from './FormationPitch.module.css'

type Props = { report: TacticalReport }

const W = 400
const H = 560

// ── Zone inference ────────────────────────────────────────────
// Returns either a single position (clear zone) or two positions (grey zone)
function inferPosition(x: number, y: number): SpecificPosition | [SpecificPosition, SpecificPosition] {
  const left = x < W * 0.28
  const right = x > W * 0.72
  const centre = !left && !right

  // GK zone
  if (y > 490) return 'GK'

  // Defensive zone — clear
  if (y > 465 && y <= 490) return left ? 'LB' : right ? 'RB' : 'CB'

  // Defensive line
  if (y > 420 && y <= 465) return left ? 'LB' : right ? 'RB' : 'CB'

  // Grey — DEF or CDM
  if (y > 400 && y <= 420) {
    if (left) return ['LB', 'LWB']
    if (right) return ['RB', 'RWB']
    return ['CB', 'CDM']
  }

  // CDM zone — clear
  if (y > 375 && y <= 400) {
    if (left) return 'LWB'
    if (right) return 'RWB'
    return 'CDM'
  }

  // Grey — CM or CDM
  if (y > 340 && y <= 375) {
    if (left) return ['LM', 'LWB']
    if (right) return ['RM', 'RWB']
    return ['CM', 'CDM']
  }

  // CM zone — clear
  if (y > 300 && y <= 340) {
    if (left) return 'LM'
    if (right) return 'RM'
    return 'CM'
  }

  // Grey — CAM or CM
  if (y > 240 && y <= 300) {
    if (left) return ['LM', 'CAM']
    if (right) return ['RM', 'CAM']
    return ['CAM', 'CM']
  }

  // CAM zone — clear
  if (y > 170 && y <= 240) {
    if (left) return 'LW'
    if (right) return 'RW'
    return 'CAM'
  }

  // Forward zone — clear
  if (y > 80 && y <= 170) {
    if (left) return 'LW'
    if (right) return 'RW'
    return centre ? 'SS' : left ? 'LW' : 'RW'
  }

  // Grey — ST or CF/SS
  if (y > 60 && y <= 80) {
    if (left) return ['LW', 'ST']
    if (right) return ['RW', 'ST']
    return ['ST', 'CF']
  }

  // Striker zone
  return left ? 'LW' : right ? 'RW' : 'ST'
}

function fitnessColour(f: number): string {
  if (f >= 0.8) return '#22c55e'
  if (f >= 0.65) return '#f59e0b'
  return '#ef4444'
}

function deriveBroadPosition(sp: SpecificPosition): PlayerSlot['position'] {
  if (sp === 'GK') return 'GK'
  if (['CB', 'RB', 'LB', 'RWB', 'LWB'].includes(sp)) return 'DEF'
  if (['CDM', 'CM', 'CAM', 'RM', 'LM'].includes(sp)) return 'MID'
  return 'FWD'
}

// Initial coords — spread players using their specific position for Y, X by index in group
const POSITION_COORDS: Record<SpecificPosition, { x: number; y: number }> = {
  GK:  { x: 200, y: 510 },
  CB:  { x: 200, y: 435 },
  RB:  { x: 315, y: 435 },
  LB:  { x: 85,  y: 435 },
  RWB: { x: 340, y: 385 },
  LWB: { x: 60,  y: 385 },
  CDM: { x: 200, y: 388 },
  CM:  { x: 200, y: 320 },
  CAM: { x: 200, y: 220 },
  RM:  { x: 330, y: 320 },
  LM:  { x: 70,  y: 320 },
  RW:  { x: 320, y: 130 },
  LW:  { x: 80,  y: 130 },
  ST:  { x: 200, y: 70  },
  CF:  { x: 200, y: 100 },
  SS:  { x: 200, y: 150 },
}

function initialCoords(players: PlayerSlot[]): Map<string, { x: number; y: number }> {
  const posGroups: Record<string, PlayerSlot[]> = {}
  for (const p of players) {
    const sp = p.specific_position
    if (!posGroups[sp]) posGroups[sp] = []
    posGroups[sp].push(p)
  }
  const coordMap = new Map<string, { x: number; y: number }>()
  for (const [sp, group] of Object.entries(posGroups)) {
    const base = POSITION_COORDS[sp as SpecificPosition] ?? { x: W / 2, y: H / 2 }
    if (group.length === 1) {
      coordMap.set(group[0].name, { ...base })
    } else {
      const spread = Math.min(75, 260 / (group.length + 1))
      const startX = base.x - (spread * (group.length - 1)) / 2
      group.forEach((p, i) => {
        coordMap.set(p.name, {
          x: Math.max(28, Math.min(W - 28, startX + spread * i)),
          y: base.y,
        })
      })
    }
  }
  return coordMap
}

type FreeCoords = Map<string, { x: number; y: number }>

type PositionPopup = {
  options: [SpecificPosition, SpecificPosition]
  playerName: string
  x: number
  y: number
}

type Confirmation = {
  label: string
  x: number
  y: number
}

export default function FormationPitch({ report }: Props) {
  const { recommended_formation, starting_xi, bench, rotation_suggestions } = report

  const [boardXI, setBoardXI] = useState<PlayerSlot[]>(() => [...(starting_xi ?? [])])
  const [boardBench, setBoardBench] = useState<PlayerSlot[]>(() => [...(bench ?? [])])

  // Free-form coordinates per player on the board
  const [coords, setCoords] = useState<FreeCoords>(() => initialCoords(starting_xi ?? []))
  // Ghost coords — frozen at initial
  const ghostCoords = useState<FreeCoords>(() => initialCoords(starting_xi ?? []))[0]

  const [isDirty, setIsDirty] = useState(false)
  const [savedMsg, setSavedMsg] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null)
  const [dragging, setDragging] = useState<string | null>(null)
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null)
  const [tooltip, setTooltip] = useState<{ name: string; x: number; y: number } | null>(null)
  const [popup, setPopup] = useState<PositionPopup | null>(null)
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null)

  const svgRef = useRef<SVGSVGElement>(null)

  function svgPoint(e: React.PointerEvent | React.MouseEvent) {
    const svg = svgRef.current
    if (!svg) return { x: 0, y: 0 }
    const rect = svg.getBoundingClientRect()
    return {
      x: Math.max(20, Math.min(W - 20, (e.clientX - rect.left) * (W / rect.width))),
      y: Math.max(20, Math.min(H - 20, (e.clientY - rect.top) * (H / rect.height))),
    }
  }

  function showConfirmation(label: string, x: number, y: number) {
    setConfirmation({ label, x, y })
    setTimeout(() => setConfirmation(null), 1400)
  }

  // ── Apply position assignment ─────────────────────────────────
  function applyPosition(playerName: string, newPos: SpecificPosition, dropX: number, dropY: number) {
    setBoardXI(prev => {
      const next = [...prev]
      const aIdx = next.findIndex(p => p.name === playerName)
      if (aIdx === -1) return prev
      const oldPos = next[aIdx].specific_position
      // If another player is very close to drop point (within 30px), swap their positions
      const occupantIdx = next.findIndex((p, i) => {
        if (i === aIdx) return false
        const c = coords.get(p.name)
        if (!c) return false
        return Math.hypot(c.x - dropX, c.y - dropY) < 30
      })
      next[aIdx] = { ...next[aIdx], specific_position: newPos, position: deriveBroadPosition(newPos) }
      if (occupantIdx !== -1) {
        next[occupantIdx] = { ...next[occupantIdx], specific_position: oldPos, position: deriveBroadPosition(oldPos) }
      }
      return next
    })
    setCoords(prev => {
      const next = new Map(prev)
      next.set(playerName, { x: dropX, y: dropY })
      return next
    })
    setIsDirty(true)
  }

  // ── Drag handlers ─────────────────────────────────────────────
  function handlePlayerPointerDown(e: React.PointerEvent, name: string) {
    e.stopPropagation()
    setDragging(name)
    setSelectedPlayer(null)
    setTooltip(null)
    setPopup(null)
    setDragPos(svgPoint(e))
    ;(e.target as Element).setPointerCapture(e.pointerId)
  }

  function handleSvgPointerMove(e: React.PointerEvent) {
    if (!dragging) return
    setDragPos(svgPoint(e))
  }

  function handleSvgPointerUp(e: React.PointerEvent) {
    if (!dragging) return
    const pt = svgPoint(e)
    const inferred = inferPosition(pt.x, pt.y)

    if (Array.isArray(inferred)) {
      // Grey zone — show popup
      setPopup({ options: inferred, playerName: dragging, x: pt.x, y: pt.y })
    } else {
      // Clear zone — apply silently with confirmation tag
      applyPosition(dragging, inferred, pt.x, pt.y)
      showConfirmation(`→ ${inferred}`, pt.x, pt.y)
    }

    setDragging(null)
    setDragPos(null)
  }

  function handlePopupChoice(pos: SpecificPosition) {
    if (!popup) return
    applyPosition(popup.playerName, pos, popup.x, popup.y)
    showConfirmation(`→ ${pos}`, popup.x, popup.y)
    setPopup(null)
  }

  // ── Click to select / swap ────────────────────────────────────
  function handlePlayerClick(e: React.MouseEvent, name: string) {
    e.stopPropagation()
    if (dragging || popup) return
    if (selectedPlayer === name) { setSelectedPlayer(null); return }
    if (selectedPlayer && boardXI.find(p => p.name === selectedPlayer)) {
      setBoardXI(prev => {
        const next = [...prev]
        const aIdx = next.findIndex(p => p.name === selectedPlayer)
        const bIdx = next.findIndex(p => p.name === name)
        if (aIdx === -1 || bIdx === -1) return prev
        const { specific_position: aSp, position: aBroad } = next[aIdx]
        next[aIdx] = { ...next[aIdx], specific_position: next[bIdx].specific_position, position: next[bIdx].position }
        next[bIdx] = { ...next[bIdx], specific_position: aSp, position: aBroad }
        return next
      })
      // Also swap their visual coords
      setCoords(prev => {
        const next = new Map(prev)
        const aC = next.get(selectedPlayer!)
        const bC = next.get(name)
        if (aC && bC) { next.set(selectedPlayer!, { ...bC }); next.set(name, { ...aC }) }
        return next
      })
      setSelectedPlayer(null)
      setIsDirty(true)
      return
    }
    setSelectedPlayer(name)
  }

  // ── Bench swap ────────────────────────────────────────────────
  function handleBenchSwap(benchPlayer: PlayerSlot) {
    if (!selectedPlayer) return
    const pitchIdx = boardXI.findIndex(p => p.name === selectedPlayer)
    if (pitchIdx === -1) return
    const pitchPlayer = boardXI[pitchIdx]
    const pitchCoord = coords.get(selectedPlayer) ?? { x: W / 2, y: H / 2 }

    setBoardXI(prev => {
      const next = [...prev]
      next[pitchIdx] = {
        ...benchPlayer,
        specific_position: pitchPlayer.specific_position,
        position: pitchPlayer.position,
        slot_broad: pitchPlayer.slot_broad,
      }
      return next
    })
    setBoardBench(prev => [...prev.filter(p => p.name !== benchPlayer.name), { ...pitchPlayer }])
    setCoords(prev => {
      const next = new Map(prev)
      next.delete(selectedPlayer)
      next.set(benchPlayer.name, pitchCoord)
      return next
    })
    setSelectedPlayer(null)
    setIsDirty(true)
  }

  // ── Save / discard ────────────────────────────────────────────
  function handleSave() {
    const boardState = {
      starting_xi: boardXI,
      bench: boardBench,
      coords: Object.fromEntries(coords),
    }
    localStorage.setItem('gafferos_board', JSON.stringify(boardState))
    setIsDirty(false)
    setSavedMsg(true)
    setTimeout(() => setSavedMsg(false), 2200)
  }

  function handleDiscard() {
    setBoardXI([...(starting_xi ?? [])])
    setBoardBench([...(bench ?? [])])
    setCoords(initialCoords(starting_xi ?? []))
    setIsDirty(false)
    setSelectedPlayer(null)
    setPopup(null)
  }

  const selectedOnPitch = selectedPlayer ? boardXI.find(p => p.name === selectedPlayer) : null

  return (
    <div className={styles.root}>
      <div className={styles.pitchWrap}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className={styles.svg}
          aria-label="Interactive formation pitch"
          onPointerMove={handleSvgPointerMove}
          onPointerUp={handleSvgPointerUp}
          onClick={() => { setSelectedPlayer(null); setPopup(null) }}
          style={{ cursor: dragging ? 'grabbing' : 'default', touchAction: 'none' }}
        >
          <defs>
            <linearGradient id="pitchGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1a3a20" />
              <stop offset="100%" stopColor="#0f2414" />
            </linearGradient>
            <pattern id="stripes" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <rect width="20" height="40" fill="rgba(255,255,255,0.015)" />
            </pattern>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* Pitch background */}
          <rect width={W} height={H} fill="url(#pitchGrad)" rx="8" />
          <rect width={W} height={H} fill="url(#stripes)" rx="8" opacity="0.6" />

          {/* Zone overlays — subtle, visible while dragging */}
          {dragging && (
            <g opacity={0.06} style={{ pointerEvents: 'none' }}>
              <rect x={14} y={14}   width={W-28} height={66}  fill="#f59e0b" />  {/* ST */}
              <rect x={14} y={80}   width={W-28} height={90}  fill="#3b82f6" />  {/* FWD */}
              <rect x={14} y={170}  width={W-28} height={70}  fill="#8b5cf6" />  {/* CAM */}
              <rect x={14} y={240}  width={W-28} height={60}  fill="#6b7280" />  {/* grey CAM/CM */}
              <rect x={14} y={300}  width={W-28} height={40}  fill="#8b5cf6" />  {/* CM */}
              <rect x={14} y={340}  width={W-28} height={35}  fill="#6b7280" />  {/* grey CM/CDM */}
              <rect x={14} y={375}  width={W-28} height={25}  fill="#22c55e" />  {/* CDM */}
              <rect x={14} y={400}  width={W-28} height={20}  fill="#6b7280" />  {/* grey DEF/CDM */}
              <rect x={14} y={420}  width={W-28} height={70}  fill="#ef4444" />  {/* DEF */}
              <rect x={14} y={490}  width={W-28} height={56}  fill="#f59e0b" />  {/* GK */}
            </g>
          )}

          {/* Pitch markings */}
          <rect x={14} y={14} width={W-28} height={H-28} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" rx="4" />
          <line x1={14} y1={H/2} x2={W-14} y2={H/2} stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
          <circle cx={W/2} cy={H/2} r={50} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
          <circle cx={W/2} cy={H/2} r={3} fill="rgba(255,255,255,0.3)" />
          <rect x={100} y={14} width={200} height={105} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="1" />
          <rect x={148} y={14} width={104} height={44}  fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="1" />
          <rect x={100} y={H-119} width={200} height={105} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="1" />
          <rect x={148} y={H-58}  width={104} height={44}  fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="1" />

          {/* Ghost layer */}
          {(starting_xi ?? []).map(player => {
            const coord = ghostCoords.get(player.name)
            if (!coord) return null
            return (
              <g key={`ghost-${player.name}`} opacity={0.18} style={{ pointerEvents: 'none' }}>
                <circle cx={coord.x} cy={coord.y} r={17} fill={fitnessColour(player.fitness_score ?? 0)} />
                <circle cx={coord.x} cy={coord.y} r={17} fill="none" stroke="white" strokeWidth="1" strokeDasharray="3 3" />
                <text x={coord.x} y={coord.y + 1} textAnchor="middle" dominantBaseline="middle"
                  fontSize="7" fontWeight="700" fill="white" fontFamily="'Barlow Condensed', sans-serif">
                  {player.name.split(' ').pop()?.slice(0, 8)}
                </text>
              </g>
            )
          })}

          {/* Board layer */}
          {boardXI.map(player => {
            const coord = coords.get(player.name)
            if (!coord) return null
            const fitness = player.fitness_score ?? 0
            const colour = fitnessColour(fitness)
            const isSelected = selectedPlayer === player.name
            const isDraggingThis = dragging === player.name
            const cx = isDraggingThis && dragPos ? dragPos.x : coord.x
            const cy = isDraggingThis && dragPos ? dragPos.y : coord.y
            const shortName = player.name.split(' ').pop() ?? '?'

            return (
              <g key={`board-${player.name}`}
                style={{ cursor: isDraggingThis ? 'grabbing' : 'grab' }}
                onPointerDown={e => handlePlayerPointerDown(e, player.name)}
                onClick={e => handlePlayerClick(e, player.name)}
                onMouseEnter={() => !dragging && setTooltip({ name: player.name, x: coord.x, y: coord.y })}
                onMouseLeave={() => setTooltip(null)}
              >
                {isSelected && (
                  <circle cx={cx} cy={cy} r={27} fill="none" stroke="#f59e0b"
                    strokeWidth="2" strokeDasharray="5 3" opacity={0.9} />
                )}
                <circle cx={cx} cy={cy} r={22} fill={colour} opacity={isDraggingThis ? 0.18 : 0.13} />
                <circle cx={cx} cy={cy} r={17} fill={colour} opacity={isDraggingThis ? 0.6 : 1}
                  filter={isSelected ? 'url(#glow)' : undefined} />
                <circle cx={cx} cy={cy} r={17} fill="none"
                  stroke={isSelected ? '#f59e0b' : 'rgba(255,255,255,0.38)'}
                  strokeWidth={isSelected ? 2 : 1.5} />
                <text x={cx} y={cy + 1.5} textAnchor="middle" dominantBaseline="middle"
                  fontSize="7.5" fontWeight="700" fill="white"
                  fontFamily="'Barlow Condensed', sans-serif" letterSpacing="0.3"
                  style={{ pointerEvents: 'none', userSelect: 'none' }}>
                  {shortName.length > 9 ? shortName.slice(0, 8) + '…' : shortName}
                </text>
                <text x={cx} y={cy + 28} textAnchor="middle" fontSize="7"
                  fill="rgba(255,220,100,0.9)" fontFamily="'JetBrains Mono', monospace"
                  style={{ pointerEvents: 'none', userSelect: 'none' }}>
                  {player.specific_position}
                </text>
                <text x={cx} y={cy + 38} textAnchor="middle" fontSize="6.5"
                  fill="rgba(255,255,255,0.4)" fontFamily="'JetBrains Mono', monospace"
                  style={{ pointerEvents: 'none', userSelect: 'none' }}>
                  {Math.round(fitness * 100)}%
                </text>
              </g>
            )
          })}

          {/* Tooltip */}
          {tooltip && !dragging && !popup && (() => {
            const player = boardXI.find(p => p.name === tooltip.name)
            if (!player) return null
            const tx = tooltip.x > W - 120 ? tooltip.x - 118 : tooltip.x + 12
            const ty = tooltip.y > H - 90  ? tooltip.y - 72  : tooltip.y - 14
            return (
              <g style={{ pointerEvents: 'none' }}>
                <rect x={tx} y={ty} width={112} height={62} rx={5}
                  fill="#0d1117" stroke="rgba(245,158,11,0.45)" strokeWidth="1" opacity={0.97} />
                <text x={tx+8} y={ty+16} fontSize="9" fontWeight="700" fill="white"
                  fontFamily="'Barlow Condensed', sans-serif">{player.name}</text>
                <text x={tx+8} y={ty+29} fontSize="7.5" fill="rgba(255,220,100,0.9)"
                  fontFamily="'JetBrains Mono', monospace">
                  {player.specific_position}{player.secondary_position ? ` / ${player.secondary_position}` : ''}
                </text>
                <text x={tx+8} y={ty+42} fontSize="7.5" fill={fitnessColour(player.fitness_score ?? 0)}
                  fontFamily="'JetBrains Mono', monospace">
                  Fitness: {Math.round((player.fitness_score ?? 0) * 100)}%
                </text>
                <text x={tx+8} y={ty+54} fontSize="7" fill="rgba(255,255,255,0.35)"
                  fontFamily="'JetBrains Mono', monospace">
                  {player.available ? '● Available' : '○ Unavailable'}
                </text>
              </g>
            )
          })()}

          {/* Confirmation tag */}
          {confirmation && (
            <g style={{ pointerEvents: 'none' }}>
              <rect
                x={confirmation.x - 22} y={confirmation.y - 28}
                width={44} height={18} rx={4}
                fill="rgba(245,158,11,0.9)"
              />
              <text x={confirmation.x} y={confirmation.y - 16}
                textAnchor="middle" dominantBaseline="middle"
                fontSize="8" fontWeight="800" fill="#0d0f12"
                fontFamily="'Barlow Condensed', sans-serif" letterSpacing="0.3">
                {confirmation.label}
              </text>
            </g>
          )}

          {/* Position popup — grey zone */}
          {popup && (() => {
            const px = popup.x > W - 110 ? popup.x - 108 : popup.x + 8
            const py = popup.y > H - 90  ? popup.y - 82  : popup.y + 8
            const cardW = 100
            const cardH = 80
            return (
              <g>
                <rect x={px} y={py} width={cardW} height={cardH} rx={6}
                  fill="#0d1117" stroke="rgba(245,158,11,0.55)" strokeWidth="1.5" opacity={0.98} />
                <text x={px + cardW/2} y={py + 14} textAnchor="middle"
                  fontSize="7.5" fontWeight="700" fill="rgba(255,255,255,0.5)"
                  fontFamily="'Barlow Condensed', sans-serif" letterSpacing="0.5">
                  PLACE AS
                </text>
                {popup.options.map((pos, i) => {
                  const btnY = py + 22 + i * 26
                  return (
                    <g key={pos} style={{ cursor: 'pointer' }}
                      onClick={e => { e.stopPropagation(); handlePopupChoice(pos) }}>
                      <rect x={px+6} y={btnY} width={cardW-12} height={20} rx={4}
                        fill="rgba(245,158,11,0.12)" stroke="rgba(245,158,11,0.35)" strokeWidth="1" />
                      <text x={px+14} y={btnY+13} fontSize="9.5" fontWeight="700"
                        fill="#f59e0b" fontFamily="'Barlow Condensed', sans-serif">
                        {pos}
                      </text>
                    </g>
                  )
                })}
              </g>
            )
          })()}

          <text x={W/2} y={H-6} textAnchor="middle" fontSize="11" fontWeight="800"
            fill="rgba(255,255,255,0.35)" fontFamily="'Barlow Condensed', sans-serif" letterSpacing="1">
            {recommended_formation}{isDirty ? ' · EDITED' : ''}
          </text>
        </svg>
      </div>

      {/* Save bar */}
      {isDirty && (
        <div className={styles.saveBar}>
          <div className={styles.saveBarLeft}>
            <span className={styles.saveIcon}>✎</span>
            <span className={styles.saveText}>Unsaved board changes</span>
          </div>
          <div className={styles.saveBarActions}>
            <button className={styles.discardBtn} onClick={handleDiscard} type="button">Discard</button>
            <button className={styles.saveBtn} onClick={handleSave} type="button">Save Board</button>
          </div>
        </div>
      )}

      {savedMsg && <div className={styles.savedToast}>✓ Board saved</div>}

      {selectedOnPitch && (
        <div className={styles.selectionHint}>
          <span className={styles.hintDot} />
          <span>
            <strong>{selectedOnPitch.name}</strong> selected —
            click another pitch player to swap, or tap a bench player to bring them on
          </span>
        </div>
      )}

      {/* Bench */}
      {boardBench && boardBench.length > 0 && (
        <div className={styles.bench}>
          <div className={styles.benchLabel}>BENCH</div>
          <div className={styles.benchGrid}>
            {boardBench.map((p, i) => {
              const isEligible = !!selectedOnPitch && (
                p.position === selectedOnPitch.position ||
                p.specific_position === selectedOnPitch.specific_position ||
                p.secondary_position === selectedOnPitch.specific_position
              )
              return (
                <div key={i}
                  className={`${styles.benchCard} ${selectedOnPitch ? styles.benchCardDimmed : ''} ${isEligible ? styles.benchCardEligible : ''}`}
                  onClick={() => isEligible && handleBenchSwap(p)}
                  style={{ cursor: isEligible ? 'pointer' : 'default' }}
                >
                  <span className={styles.benchDot} style={{ background: fitnessColour(p.fitness_score ?? 0) }} />
                  <div>
                    <div className={styles.benchName}>{p.name}</div>
                    <div className={styles.benchPos}>
                      {p.specific_position}{p.secondary_position ? ` / ${p.secondary_position}` : ''} · {Math.round((p.fitness_score ?? 0) * 100)}%
                    </div>
                  </div>
                  {isEligible && <span className={styles.swapIcon}>⇄</span>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {rotation_suggestions && rotation_suggestions.length > 0 && (
        <div className={styles.rotations}>
          <div className={styles.benchLabel}>ROTATION NOTES</div>
          {rotation_suggestions.map((s, i) => (
            <div key={i} className={styles.rotationItem}>
              <span className={styles.rotIcon}>→</span>
              <span>{s}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}