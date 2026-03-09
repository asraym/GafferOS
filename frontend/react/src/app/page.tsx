'use client'
import { useState, useEffect } from 'react'
import { storage } from '@/lib/storage'
import { analyseMatch } from '@/lib/api'
import { TacticalReport, MatchData, Player, MatchResult } from '@/types/gafferos'
import styles from './page.module.css'

const DEFAULT_MATCH: MatchData = {
  team_name: '',
  opponent_name: '',
  last_5_results: [],
  goals_scored_last_5: 0,
  goals_conceded_last_5: 0,
}

function IndexBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={styles.indexBar}>
      <div className={styles.indexBarTop}>
        <span className={styles.indexLabel}>{label}</span>
        <span className={styles.indexValue}>{(value * 100).toFixed(0)}</span>
      </div>
      <div className={styles.indexTrack}>
        <div className={styles.indexFill} style={{ width: `${value * 100}%`, background: color }} />
      </div>
    </div>
  )
}

function ResultPill({ r }: { r: MatchResult }) {
  const map = { W: styles.win, D: styles.draw, L: styles.loss }
  return <span className={`${styles.pill} ${map[r]}`}>{r}</span>
}

function RiskBadge({ level }: { level: string }) {
  const map: Record<string, string> = { High: styles.riskHigh, Medium: styles.riskMed, Low: styles.riskLow }
  return <span className={`${styles.risk} ${map[level] || ''}`}>{level} Risk</span>
}

export default function Dashboard() {
  const [match, setMatch] = useState<MatchData>(DEFAULT_MATCH)
  const [players, setPlayers] = useState<Player[]>([])
  const [tier, setTier] = useState<'tier_1' | 'tier_2'>('tier_1')
  const [report, setReport] = useState<TacticalReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [results, setResults] = useState<MatchResult[]>([])

  useEffect(() => {
    const m = storage.getMatch()
    if (m) { setMatch(m); setResults(m.last_5_results || []) }
    setPlayers(storage.getPlayers())
    setTier(storage.getTier())
    setReport(storage.getReport())
  }, [])

  function toggleResult(r: MatchResult) {
    setResults(prev => {
      const next = prev.length < 5 ? [...prev, r] : prev
      const updated = { ...match, last_5_results: next }
      setMatch(updated)
      storage.saveMatch(updated)
      return next
    })
  }

  function clearResults() {
    setResults([])
    const updated = { ...match, last_5_results: [] }
    setMatch(updated)
    storage.saveMatch(updated)
  }

  function updateMatch(field: keyof MatchData, value: unknown) {
    const updated = { ...match, [field]: value }
    setMatch(updated as MatchData)
    storage.saveMatch(updated as MatchData)
  }

  async function runAnalysis() {
    if (!match.team_name || !match.opponent_name || results.length === 0) {
      setError('Team name, opponent, and at least one result required.')
      return
    }
    setLoading(true); setError('')
    try {
      const r = await analyseMatch({ ...match, last_5_results: results }, players, tier)
      setReport(r)
      storage.saveReport(r)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally { setLoading(false) }
  }

  const avgFitness = players.length
    ? players.reduce((s, p) => s + (p.fitness_score ?? 1), 0) / players.length
    : null

  return (
    <div className={`${styles.page} page-enter`}>
      {/* ── Header ── */}
      <div className={styles.header}>
        <div>
          <div className={styles.eyebrow}>Team Dashboard</div>
          <h1 className={styles.title}>
            {match.team_name || 'Your Club'}
          </h1>
        </div>
        <div className={styles.tierToggle}>
          {(['tier_1', 'tier_2'] as const).map(t => (
            <button
              key={t}
              className={`${styles.tierBtn} ${tier === t ? styles.tierActive : ''}`}
              onClick={() => { setTier(t); storage.saveTier(t) }}
            >
              {t === 'tier_1' ? 'T1 Basic' : 'T2 Full Stats'}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.grid}>
        {/* ── Left col: input ── */}
        <div className={styles.leftCol}>

          {/* Match Setup Card */}
          <div className={styles.card}>
            <div className={styles.cardLabel}>Match Setup</div>
            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Your Team</label>
                <input
                  className={styles.input}
                  placeholder="FC United"
                  value={match.team_name}
                  onChange={e => updateMatch('team_name', e.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Opponent</label>
                <input
                  className={styles.input}
                  placeholder="Rivals FC"
                  value={match.opponent_name}
                  onChange={e => updateMatch('opponent_name', e.target.value)}
                />
              </div>
            </div>

            <div className={styles.fieldLabel} style={{marginTop: 20}}>Last 5 Results</div>
            <div className={styles.resultButtons}>
              {(['W','D','L'] as MatchResult[]).map(r => (
                <button key={r} className={styles.resultBtn} onClick={() => toggleResult(r)}>{r}</button>
              ))}
              <button className={styles.clearBtn} onClick={clearResults}>Clear</button>
            </div>
            <div className={styles.resultStrip}>
              {results.length === 0
                ? <span className={styles.noResults}>No results yet</span>
                : results.map((r, i) => <ResultPill key={i} r={r} />)
              }
            </div>

            <div className={styles.fieldRow} style={{marginTop: 16}}>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Goals Scored</label>
                <input type="number" min={0} className={styles.input}
                  value={match.goals_scored_last_5}
                  onChange={e => updateMatch('goals_scored_last_5', +e.target.value)} />
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Goals Conceded</label>
                <input type="number" min={0} className={styles.input}
                  value={match.goals_conceded_last_5}
                  onChange={e => updateMatch('goals_conceded_last_5', +e.target.value)} />
              </div>
            </div>

            {tier === 'tier_2' && (
              <div className={styles.tier2Fields}>
                <div className={styles.cardLabel} style={{marginBottom: 12}}>Advanced Stats</div>
                {[
                  ['avg_possession', 'Avg Possession %'],
                  ['avg_passing_accuracy', 'Passing Accuracy %'],
                  ['avg_shots_per_match', 'Shots per Match'],
                  ['avg_shots_on_target', 'Shots on Target'],
                  ['avg_defensive_errors', 'Defensive Errors'],
                ].map(([key, label]) => (
                  <div key={key} className={styles.field}>
                    <label className={styles.fieldLabel}>{label}</label>
                    <input type="number" min={0} className={styles.input}
                      value={(match as Record<string, unknown>)[key] as number || ''}
                      onChange={e => updateMatch(key as keyof MatchData, +e.target.value)} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Squad Fitness Card */}
          <div className={styles.card}>
            <div className={styles.cardLabel}>Squad Overview</div>
            {players.length === 0 ? (
              <p className={styles.emptyNote}>No players added yet. Go to the Players page to build your squad.</p>
            ) : (
              <>
                <div className={styles.fitnessHeader}>
                  <span className={styles.fitnessTitle}>Avg Fitness</span>
                  <span className={styles.fitnessPct}>{avgFitness !== null ? `${(avgFitness * 100).toFixed(0)}%` : '—'}</span>
                </div>
                <div className={styles.fitnessTrack}>
                  <div className={styles.fitnessFill} style={{ width: `${(avgFitness ?? 0) * 100}%` }} />
                </div>
                <div className={styles.playerList}>
                  {players.slice(0, 8).map(p => (
                    <div key={p.name} className={styles.playerRow}>
                      <div className={styles.playerInfo}>
                        <span className={styles.playerPos}>{p.specific_position}</span>
                        <span className={styles.playerName}>{p.name}</span>
                      </div>
                      <div className={styles.playerFitness}>
                        <div className={styles.miniTrack}>
                          <div className={styles.miniFill}
                            style={{
                              width: `${(p.fitness_score ?? 1) * 100}%`,
                              background: (p.fitness_score ?? 1) > 0.65 ? 'var(--green)' : (p.fitness_score ?? 1) > 0.4 ? 'var(--amber)' : 'var(--red)'
                            }} />
                        </div>
                        <span className={styles.miniFitPct}>{((p.fitness_score ?? 1) * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  ))}
                  {players.length > 8 && (
                    <div className={styles.moreNote}>+{players.length - 8} more players</div>
                  )}
                </div>
              </>
            )}
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button className={styles.analyseBtn} onClick={runAnalysis} disabled={loading}>
            {loading ? 'Analysing...' : 'Run Analysis →'}
          </button>
        </div>

        {/* ── Right col: report ── */}
        <div className={styles.rightCol}>
          {!report ? (
            <div className={styles.emptyReport}>
              <div className={styles.emptyIcon}>⬡</div>
              <div className={styles.emptyTitle}>No Analysis Yet</div>
              <p className={styles.emptyText}>Fill in match data and hit Run Analysis to generate your tactical report.</p>
            </div>
          ) : (
            <div className={styles.report}>
              {/* Report Header */}
              <div className={styles.reportHeader}>
                <div>
                  <div className={styles.reportTeams}>{report.team_name} <span>vs</span> {report.opponent_name}</div>
                  <RiskBadge level={report.match_risk_level} />
                </div>
                <div className={styles.formation}>{report.recommended_formation}</div>
              </div>

              {/* KPI Strip */}
              <div className={styles.kpiStrip}>
                {[
                  { label: 'Press', value: report.press_intensity },
                  { label: 'Line',  value: report.defensive_line },
                  { label: 'Focus', value: report.tactical_focus },
                ].map(k => (
                  <div key={k.label} className={styles.kpi}>
                    <div className={styles.kpiLabel}>{k.label}</div>
                    <div className={styles.kpiValue}>{k.value}</div>
                  </div>
                ))}
              </div>

              {/* Indices */}
              <div className={styles.indices}>
                <div className={styles.cardLabel}>Tactical Indices</div>
                <IndexBar label="Offensive Strength" value={report.offensive_strength_index} color="var(--amber)" />
                <IndexBar label="Defensive Vulnerability" value={report.defensive_vulnerability_index} color="var(--red)" />
                <IndexBar label="Fatigue Risk" value={report.fatigue_risk_score} color="var(--yellow)" />
                <IndexBar label="Tactical Stability" value={report.tactical_stability_score} color="var(--green)" />
              </div>

              {/* Rotation */}
              {report.rotation_suggestions?.length > 0 && (
                <div className={styles.rotations}>
                  <div className={styles.cardLabel}>Rotation Notes</div>
                  {report.rotation_suggestions.map((s, i) => (
                    <div key={i} className={styles.rotationItem}>
                      <span className={styles.rotationDot} />
                      {s}
                    </div>
                  ))}
                </div>
              )}

              {/* Reasoning */}
              <div className={styles.reasoning}>
                <div className={styles.cardLabel}>Tactical Reasoning</div>
                <p className={styles.reasoningText}>{report.reasoning}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
