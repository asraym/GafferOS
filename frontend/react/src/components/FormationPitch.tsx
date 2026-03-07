'use client'
import type { PlayerSlot, TacticalReport } from '@/types/gafferos'
import styles from './FormationPitch.module.css'

type Props = {
  report: TacticalReport
}

// Formation string → rows of counts (attack at top, GK at bottom)
function parseFormation(f: string): number[] {
  const parts = f.split('-').map(Number)
  // Reverse so GK is first row we render, attack is last
  return [1, ...parts]
}

function fitnessColour(f: number): string {
  if (f >= 0.8) return '#22c55e'
  if (f >= 0.65) return '#f59e0b'
  return '#ef4444'
}

export default function FormationPitch({ report }: Props) {
  const { recommended_formation, starting_xi, bench, rotation_suggestions } = report

  const broadOrder: Record<string, number> = { GK: 0, DEF: 1, MID: 2, FWD: 3 }
  const sorted = [...(starting_xi ?? [])].sort(
    (a, b) => (broadOrder[a.position] ?? 0) - (broadOrder[b.position] ?? 0)
  )

  const rows = parseFormation(recommended_formation)
  let playerIdx = 0

  // Assign players to rows
  const rowPlayers: (PlayerSlot | null)[][] = rows.map(count => {
    const rowArr: (PlayerSlot | null)[] = []
    for (let i = 0; i < count; i++) {
      rowArr.push(sorted[playerIdx] ?? null)
      playerIdx++
    }
    return rowArr
  })

  // SVG dimensions
  const W = 360
  const H = 520
  const PAD = 28
  const usableH = H - PAD * 2
  const numRows = rowPlayers.length
  const rowGap = usableH / (numRows - 1 || 1)

  return (
    <div className={styles.root}>
      <div className={styles.pitchWrap}>
        <svg viewBox={`0 0 ${W} ${H}`} className={styles.svg} aria-label="Formation pitch">
          {/* Pitch background */}
          <defs>
            <linearGradient id="pitchGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1a3a20" />
              <stop offset="100%" stopColor="#0f2414" />
            </linearGradient>
            {/* Stripe pattern */}
            <pattern id="stripes" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <rect width="20" height="40" fill="rgba(255,255,255,0.015)" />
            </pattern>
          </defs>

          {/* Background */}
          <rect width={W} height={H} fill="url(#pitchGrad)" rx="8" />
          <rect width={W} height={H} fill="url(#stripes)" rx="8" opacity="0.6" />

          {/* Pitch outline */}
          <rect x={12} y={12} width={W - 24} height={H - 24}
            fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" rx="4" />

          {/* Halfway line */}
          <line x1={12} y1={H / 2} x2={W - 12} y2={H / 2}
            stroke="rgba(255,255,255,0.18)" strokeWidth="1" />

          {/* Centre circle */}
          <circle cx={W / 2} cy={H / 2} r={42}
            fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
          <circle cx={W / 2} cy={H / 2} r={3} fill="rgba(255,255,255,0.3)" />

          {/* Top penalty box */}
          <rect x={85} y={12} width={W - 170} height={90}
            fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
          {/* Top 6-yard box */}
          <rect x={130} y={12} width={W - 260} height={38}
            fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />

          {/* Bottom penalty box */}
          <rect x={85} y={H - 102} width={W - 170} height={90}
            fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
          {/* Bottom 6-yard box */}
          <rect x={130} y={H - 50} width={W - 260} height={38}
            fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />

          {/* Player nodes — GK at bottom (row 0), FWD at top */}
          {rowPlayers.map((row, ri) => {
            // Render GK at bottom, FWD at top
            const y = PAD + (numRows - 1 - ri) * rowGap
            return row.map((player, ci) => {
              const x = (W / (row.length + 1)) * (ci + 1)
              const fitness = player?.fitness_score ?? 0
              const colour = player ? fitnessColour(fitness) : '#4a5568'
              const shortName = player?.name?.split(' ').pop() ?? '?'
              const pos = player?.specific_position ?? ''

              return (
                <g key={`${ri}-${ci}`}>
                  {/* Glow */}
                  <circle cx={x} cy={y} r={19}
                    fill={colour} opacity={0.12} />
                  {/* Main dot */}
                  <circle cx={x} cy={y} r={15}
                    fill={colour} opacity={0.9} />
                  {/* White ring */}
                  <circle cx={x} cy={y} r={15}
                    fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
                  {/* Name */}
                  <text x={x} y={y + 1.5}
                    textAnchor="middle" dominantBaseline="middle"
                    fontSize="7.5" fontWeight="700" fill="white"
                    fontFamily="'Barlow Condensed', sans-serif"
                    letterSpacing="0.3"
                  >
                    {shortName.length > 9 ? shortName.slice(0, 8) + '…' : shortName}
                  </text>
                  {/* Position label */}
                  <text x={x} y={y + 25}
                    textAnchor="middle"
                    fontSize="7" fill="rgba(255,220,100,0.85)"
                    fontFamily="'JetBrains Mono', monospace"
                  >
                    {pos}
                  </text>
                  {/* Fitness % */}
                  <text x={x} y={y + 35}
                    textAnchor="middle"
                    fontSize="6.5" fill="rgba(255,255,255,0.45)"
                    fontFamily="'JetBrains Mono', monospace"
                  >
                    {player ? `${Math.round(fitness * 100)}%` : ''}
                  </text>
                </g>
              )
            })
          })}

          {/* Formation label */}
          <text x={W / 2} y={H - 6}
            textAnchor="middle"
            fontSize="11" fontWeight="800" fill="rgba(255,255,255,0.4)"
            fontFamily="'Barlow Condensed', sans-serif"
            letterSpacing="1"
          >
            {recommended_formation}
          </text>
        </svg>
      </div>

      {/* Bench */}
      {bench && bench.length > 0 && (
        <div className={styles.bench}>
          <div className={styles.benchLabel}>BENCH</div>
          <div className={styles.benchGrid}>
            {bench.map((p, i) => (
              <div key={i} className={styles.benchCard}>
                <span
                  className={styles.benchDot}
                  style={{ background: fitnessColour(p.fitness_score) }}
                />
                <div>
                  <div className={styles.benchName}>{p.name}</div>
                  <div className={styles.benchPos}>{p.specific_position} · {Math.round(p.fitness_score * 100)}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rotation suggestions */}
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