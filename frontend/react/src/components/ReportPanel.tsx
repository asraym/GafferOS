'use client'
import type { TacticalReport } from '@/types/gafferos'
import FormationPitch from './FormationPitch'
import styles from './ReportPanel.module.css'

type Props = { report: TacticalReport }

function IndexBar({ value, label }: { value: number; label: string }) {
  const pct = Math.round(value * 100)
  const colour = pct < 35 ? 'var(--green)' : pct < 65 ? 'var(--amber)' : 'var(--red)'
  return (
    <div className={styles.indexRow}>
      <div className={styles.indexMeta}>
        <span className={styles.indexLabel}>{label}</span>
        <span className={styles.indexVal} style={{ color: colour }}>{pct}</span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${pct}%`, background: colour }} />
      </div>
    </div>
  )
}

function riskColour(r: string) {
  if (r === 'High') return 'var(--red)'
  if (r === 'Medium') return 'var(--amber)'
  return 'var(--green)'
}

function pressColour(p: string) {
  if (p === 'High') return 'var(--green)'
  if (p === 'Medium') return 'var(--amber)'
  return 'var(--red)'
}

export default function ReportPanel({ report }: Props) {
  const {
    recommended_formation,
    press_intensity,
    defensive_line,
    tactical_focus,
    match_risk_level,
    reasoning,
    offensive_strength_index,
    defensive_vulnerability_index,
    fatigue_risk_score,
    tactical_stability_score,
  } = report

  return (
    <div className={styles.root}>

      {/* ── Top KPI strip ── */}
      <div className={styles.kpiStrip}>
        <KpiCard label="Formation" value={recommended_formation} highlight />
        <KpiCard label="Press" value={press_intensity} colour={pressColour(press_intensity)} />
        <KpiCard label="Def. Line" value={defensive_line} />
        <KpiCard label="Risk" value={match_risk_level} colour={riskColour(match_risk_level)} />
      </div>

      {/* ── Tactical focus banner ── */}
      <div className={styles.focusBanner}>
        <span className={styles.focusIcon}>🎯</span>
        <span className={styles.focusText}>{tactical_focus}</span>
      </div>

      {/* ── Two columns: pitch + metrics ── */}
      <div className={styles.bodyGrid}>

        {/* Formation pitch */}
        <div className="card">
          <div className="section-header">
            <span className="section-title">Formation</span>
            <div className="section-line" />
          </div>
          <FormationPitch report={report} />
        </div>

        {/* Right column: indices + reasoning */}
        <div className={styles.rightCol}>
          {/* Internal metrics */}
          <div className="card">
            <div className="section-header">
              <span className="section-title">Indices</span>
              <div className="section-line" />
            </div>
            <IndexBar value={offensive_strength_index}     label="Offensive Strength" />
            <IndexBar value={defensive_vulnerability_index} label="Defensive Vulnerability" />
            <IndexBar value={fatigue_risk_score}           label="Fatigue Risk" />
            <IndexBar value={tactical_stability_score}     label="Tactical Stability" />
          </div>

          {/* Reasoning */}
          <div className="card">
            <div className="section-header">
              <span className="section-title">Reasoning</span>
              <div className="section-line" />
            </div>
            <p className={styles.reasoning}>{reasoning}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function KpiCard({ label, value, highlight, colour }: {
  label: string
  value: string
  highlight?: boolean
  colour?: string
}) {
  return (
    <div className={`${styles.kpiCard} ${highlight ? styles.kpiHighlight : ''}`}>
      <div className="metric-label">{label}</div>
      <div
        className={styles.kpiValue}
        style={colour ? { color: colour } : undefined}
      >
        {value}
      </div>
    </div>
  )
}