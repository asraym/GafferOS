'use client'
import { useState } from 'react'
import type { MatchResult, Tier1Data, Tier2Data } from '@/types/gafferos'
import styles from './MatchForm.module.css'

type Props = {
  tier: 'tier_1' | 'tier_2'
  onChange: (data: Tier1Data | Tier2Data) => void
}

const RESULT_OPTIONS: MatchResult[] = ['W', 'D', 'L']

const DEFAULT_RESULTS: MatchResult[] = ['W', 'D', 'W', 'L', 'W']
const DEFAULT_OPP_RESULTS: MatchResult[] = ['L', 'W', 'D', 'L', 'D']

export default function MatchForm({ tier, onChange }: Props) {
  const [teamName, setTeamName] = useState('GafferOS FC')
  const [oppName, setOppName] = useState('Riverside United')
  const [results, setResults] = useState<MatchResult[]>(DEFAULT_RESULTS)
  const [goalsScored, setGoalsScored] = useState(9)
  const [goalsConceded, setGoalsConceded] = useState(5)
  const [oppResults, setOppResults] = useState<MatchResult[]>(DEFAULT_OPP_RESULTS)
  const [oppGoalsScored, setOppGoalsScored] = useState(5)
  const [oppGoalsConceded, setOppGoalsConceded] = useState(8)

  // Tier 2 stats
  const [possession, setPossession] = useState(54)
  const [passing, setPassing] = useState(79)
  const [shots, setShots] = useState(13)
  const [sot, setSot] = useState(6)
  const [errors, setErrors] = useState(1.2)
  const [oppPossession, setOppPossession] = useState(46)
  const [oppPassing, setOppPassing] = useState(70)
  const [oppShots, setOppShots] = useState(10)
  const [oppErrors, setOppErrors] = useState(2.4)

  function updateResult(idx: number, val: MatchResult) {
    const next = [...results]
    next[idx] = val
    setResults(next)
    emit(next, oppResults)
  }

  function updateOppResult(idx: number, val: MatchResult) {
    const next = [...oppResults]
    next[idx] = val
    setOppResults(next)
    emit(results, next)
  }

  function emit(res: MatchResult[], oppRes: MatchResult[]) {
    const base: Tier1Data = {
      team_name: teamName,
      opponent_name: oppName,
      last_5_results: res,
      goals_scored_last_5: goalsScored,
      goals_conceded_last_5: goalsConceded,
      players: [],
      opponent_last_5_results: oppRes,
      opponent_goals_scored: oppGoalsScored,
      opponent_goals_conceded: oppGoalsConceded,
    }

    if (tier === 'tier_2') {
      onChange({
        ...base,
        avg_possession: possession,
        avg_passing_accuracy: passing,
        avg_shots_per_match: shots,
        avg_shots_on_target: sot,
        avg_defensive_errors: errors,
        opp_avg_possession: oppPossession,
        opp_avg_passing_accuracy: oppPassing,
        opp_avg_shots_per_match: oppShots,
        opp_avg_defensive_errors: oppErrors,
      } as Tier2Data)
    } else {
      onChange(base)
    }
  }

  // Call emit on any field change
  function handleTeamName(v: string) { setTeamName(v); emitNow(v, oppName) }
  function handleOppName(v: string) { setOppName(v); emitNow(teamName, v) }

  function emitNow(tn: string, on: string) {
    const base: Tier1Data = {
      team_name: tn,
      opponent_name: on,
      last_5_results: results,
      goals_scored_last_5: goalsScored,
      goals_conceded_last_5: goalsConceded,
      players: [],
      opponent_last_5_results: oppResults,
      opponent_goals_scored: oppGoalsScored,
      opponent_goals_conceded: oppGoalsConceded,
    }
    if (tier === 'tier_2') {
      onChange({ ...base, avg_possession: possession, avg_passing_accuracy: passing, avg_shots_per_match: shots, avg_shots_on_target: sot, avg_defensive_errors: errors, opp_avg_possession: oppPossession, opp_avg_passing_accuracy: oppPassing, opp_avg_shots_per_match: oppShots, opp_avg_defensive_errors: oppErrors } as Tier2Data)
    } else {
      onChange(base)
    }
  }

  return (
    <div className={styles.root}>
      {/* ── Two-column: Your team + Opponent ── */}
      <div className={styles.grid}>

        {/* Your Team */}
        <div className="card">
          <div className={styles.teamHeader}>
            <span className={styles.teamBadge}>HOME</span>
            <h3 className={styles.teamTitle}>Your Team</h3>
          </div>

          <div className={styles.field}>
            <label>Team Name</label>
            <input
              type="text"
              value={teamName}
              onChange={e => handleTeamName(e.target.value)}
              placeholder="e.g. Rovers FC"
            />
          </div>

          <div className={styles.field}>
            <label>Last 5 Results <span className={styles.hint}>(oldest → newest)</span></label>
            <div className={styles.resultsRow}>
              {results.map((r, i) => (
                <div key={i} className={styles.resultSlot}>
                  <div className={styles.matchNum}>M{i + 1}</div>
                  <div className={styles.resultButtons}>
                    {RESULT_OPTIONS.map(opt => (
                      <button
                        key={opt}
                        type="button"
                        className={`${styles.resultBtn} result-badge badge-${opt} ${r === opt ? styles.resultBtnActive : ''}`}
                        onClick={() => updateResult(i, opt)}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.twoCol}>
            <div className={styles.field}>
              <label>Goals Scored</label>
              <input
                type="number"
                min={0}
                value={goalsScored}
                onChange={e => { setGoalsScored(+e.target.value); emit(results, oppResults) }}
              />
            </div>
            <div className={styles.field}>
              <label>Goals Conceded</label>
              <input
                type="number"
                min={0}
                value={goalsConceded}
                onChange={e => { setGoalsConceded(+e.target.value); emit(results, oppResults) }}
              />
            </div>
          </div>
        </div>

        {/* Opponent */}
        <div className="card">
          <div className={styles.teamHeader}>
            <span className={`${styles.teamBadge} ${styles.oppBadge}`}>OPP</span>
            <h3 className={styles.teamTitle}>Opponent</h3>
          </div>

          <div className={styles.field}>
            <label>Opponent Name</label>
            <input
              type="text"
              value={oppName}
              onChange={e => handleOppName(e.target.value)}
              placeholder="e.g. City Athletic"
            />
          </div>

          <div className={styles.field}>
            <label>Opponent Last 5 Results</label>
            <div className={styles.resultsRow}>
              {oppResults.map((r, i) => (
                <div key={i} className={styles.resultSlot}>
                  <div className={styles.matchNum}>M{i + 1}</div>
                  <div className={styles.resultButtons}>
                    {RESULT_OPTIONS.map(opt => (
                      <button
                        key={opt}
                        type="button"
                        className={`${styles.resultBtn} result-badge badge-${opt} ${r === opt ? styles.resultBtnActive : ''}`}
                        onClick={() => updateOppResult(i, opt)}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.twoCol}>
            <div className={styles.field}>
              <label>Goals Scored</label>
              <input
                type="number"
                min={0}
                value={oppGoalsScored}
                onChange={e => { setOppGoalsScored(+e.target.value); emit(results, oppResults) }}
              />
            </div>
            <div className={styles.field}>
              <label>Goals Conceded</label>
              <input
                type="number"
                min={0}
                value={oppGoalsConceded}
                onChange={e => { setOppGoalsConceded(+e.target.value); emit(results, oppResults) }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Tier 2 Stats ── */}
      {tier === 'tier_2' && (
        <div className={`${styles.statsSection} fade-in-up`}>
          <div className="section-header">
            <span className="section-title">Match Statistics</span>
            <span className="tag tag-amber">TIER 2</span>
            <div className="section-line" />
          </div>

          <div className={styles.statsGrid}>
            {/* Your team stats */}
            <div className="card">
              <div className={styles.statsTeamLabel}>Your Team</div>
              <StatSlider label="Possession %" value={possession} min={30} max={70} step={1} onChange={v => { setPossession(v); emit(results, oppResults) }} />
              <StatSlider label="Passing Accuracy %" value={passing} min={50} max={95} step={1} onChange={v => { setPassing(v); emit(results, oppResults) }} />
              <StatSlider label="Shots per Match" value={shots} min={0} max={30} step={0.5} onChange={v => { setShots(v); emit(results, oppResults) }} />
              <StatSlider label="Shots on Target" value={sot} min={0} max={15} step={0.5} onChange={v => { setSot(v); emit(results, oppResults) }} />
              <StatSlider label="Defensive Errors" value={errors} min={0} max={5} step={0.1} onChange={v => { setErrors(v); emit(results, oppResults) }} />
            </div>

            {/* Opponent stats */}
            <div className="card">
              <div className={styles.statsTeamLabel} style={{ color: 'var(--text-muted)' }}>Opponent</div>
              <StatSlider label="Possession %" value={oppPossession} min={30} max={70} step={1} onChange={v => { setOppPossession(v); emit(results, oppResults) }} />
              <StatSlider label="Passing Accuracy %" value={oppPassing} min={50} max={95} step={1} onChange={v => { setOppPassing(v); emit(results, oppResults) }} />
              <StatSlider label="Shots per Match" value={oppShots} min={0} max={30} step={0.5} onChange={v => { setOppShots(v); emit(results, oppResults) }} />
              <StatSlider label="Defensive Errors" value={oppErrors} min={0} max={5} step={0.1} onChange={v => { setOppErrors(v); emit(results, oppResults) }} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Stat Slider ────────────────────────────────────────────────
function StatSlider({ label, value, min, max, step, onChange }: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
}) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div className={styles.statRow}>
      <div className={styles.statMeta}>
        <span className={styles.statLabel}>{label}</span>
        <span className={styles.statValue}>{value.toFixed(step < 1 ? 1 : 0)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ '--pct': `${pct}%` } as React.CSSProperties}
      />
    </div>
  )
}