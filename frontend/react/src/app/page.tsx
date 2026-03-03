'use client'
import { useState, useCallback, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import MatchForm from '@/components/MatchForm'
import SquadBuilder from '@/components/SquadBuilder'
import ReportPanel from '@/components/ReportPanel'
import { analyseMatch } from '@/lib/api'
import type { TacticalReport, Tier1Data, Tier2Data, Player, DataTier } from '@/types/gafferos'
import styles from './page.module.css'

type Tab = 'match' | 'squad' | 'report'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'match', label: 'Match Setup', icon: '📋' },
  { id: 'squad', label: 'Squad',       icon: '👤' },
  { id: 'report', label: 'Report',     icon: '📊' },
]

export default function HomePage() {
  const [mounted, setMounted] = useState(false)

  const [tier, setTier] = useState<DataTier>(() => {
    if (typeof window === 'undefined') return 'tier_1'
    return (localStorage.getItem('gafferos_tier') as DataTier) ?? 'tier_1'
  })

  const [activeTab, setActiveTab] = useState<Tab>('match')

  const [matchData, setMatchData] = useState<Tier1Data | Tier2Data | null>(() => {
    if (typeof window === 'undefined') return null
    const saved = localStorage.getItem('gafferos_match')
    return saved ? JSON.parse(saved) : null
  })

  const [players, setPlayers] = useState<Player[]>(() => {
    if (typeof window === 'undefined') return []
    const saved = localStorage.getItem('gafferos_squad')
    return saved ? JSON.parse(saved) : []
  })

  const [report, setReport] = useState<TacticalReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { setMounted(true) }, [])

  const handleMatchChange = useCallback((data: Tier1Data | Tier2Data) => {
    setMatchData(data)
    localStorage.setItem('gafferos_match', JSON.stringify(data))
  }, [])

  const handleSquadChange = useCallback((p: Player[]) => {
    setPlayers(p)
    localStorage.setItem('gafferos_squad', JSON.stringify(p))
  }, [])

  function handleTierChange(t: DataTier) {
    setTier(t)
    localStorage.setItem('gafferos_tier', t)
  }

  async function handleAnalyse() {
    if (!matchData) {
      setError('Please fill in the match setup first.')
      setActiveTab('match')
      return
    }
    setError(null)
    setLoading(true)
    const payload = { ...matchData, players }
    try {
      const result = await analyseMatch(
        tier === 'tier_1'
          ? { tier: 'tier_1', tier1_data: payload as Tier1Data }
          : { tier: 'tier_2', tier2_data: payload as Tier2Data }
      )
      setReport(result)
      setActiveTab('report')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) return null


  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <div className="container">

          {/* Hero */}
          <div className={styles.hero}>
            <div className={styles.heroLeft}>
              <h1 className={styles.heroTitle}>
                Tactical<br />
                <span className={styles.heroAccent}>Intelligence</span>
              </h1>
              <p className={styles.heroSub}>
                Elite analytics for grassroots clubs. Enter your match data, get a full tactical report.
              </p>
            </div>
            <div className={styles.heroRight}>
              <div className={styles.tierToggle}>
                <div className={styles.tierLabel}>Data Tier</div>
                <div className={styles.tierButtons}>
                  <button
                    className={`${styles.tierBtn} ${tier === 'tier_1' ? styles.tierBtnActive : ''}`}
                    onClick={() => handleTierChange('tier_1')}
                    type="button"
                  >
                    <span className={styles.tierNum}>T1</span>
                    <span className={styles.tierName}>Basic</span>
                  </button>
                  <button
                    className={`${styles.tierBtn} ${tier === 'tier_2' ? styles.tierBtnActive : ''}`}
                    onClick={() => handleTierChange('tier_2')}
                    type="button"
                  >
                    <span className={styles.tierNum}>T2</span>
                    <span className={styles.tierName}>Full Stats</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className={styles.tabs}>
            {TABS.map(t => (
              <button
                key={t.id}
                className={`${styles.tab} ${activeTab === t.id ? styles.tabActive : ''} ${t.id === 'report' && !report ? styles.tabDisabled : ''}`}
                onClick={() => t.id !== 'report' || report ? setActiveTab(t.id) : null}
                type="button"
              >
                <span>{t.icon}</span>
                <span>{t.label}</span>
                {t.id === 'report' && report && <span className={styles.tabDot} />}
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="alert alert-error" style={{ marginBottom: 20 }}>
              <span>⚠</span><span>{error}</span>
            </div>
          )}

          {/* Content */}
          <div className={styles.content}>
            {activeTab === 'match' && (
              <div className="fade-in-up">
                <MatchForm tier={tier} onChange={handleMatchChange} initialData={matchData} />
              </div>
            )}
            {activeTab === 'squad' && (
              <div className="fade-in-up">
                <SquadBuilder players={players} onChange={handleSquadChange} />
              </div>
            )}
            {activeTab === 'report' && report && (
              <div className="fade-in-up">
                <ReportPanel report={report} />
              </div>
            )}
            {activeTab === 'report' && !report && (
              <div className={styles.noReport}>
                <span className={styles.noReportIcon}>📊</span>
                <p>No report generated yet.</p>
                <p className={styles.noReportSub}>Fill in the Match Setup, then click Analyse.</p>
              </div>
            )}
          </div>

          {/* Analyse bar */}
          {activeTab !== 'report' && (
            <div className={styles.analyseBar}>
              <div className={styles.analyseMeta}>
                {matchData && (
                  <span className={styles.readyTag}>
                    ✓ {matchData.team_name} vs {matchData.opponent_name}
                  </span>
                )}
                {players.length > 0 && (
                  <span className={styles.readyTag}>
                    ✓ {players.length} player{players.length > 1 ? 's' : ''} added
                  </span>
                )}
              </div>
              <button
                className={`btn btn-primary ${styles.analyseBtn}`}
                onClick={handleAnalyse}
                disabled={loading || !matchData}
                type="button"
              >
                {loading ? (
                  <><span className={styles.spinner} />Analysing…</>
                ) : (
                  <>⚡ Analyse Match</>
                )}
              </button>
            </div>
          )}

        </div>
      </main>

      <footer className={styles.footer}>
        <div className="container">
          <span className={styles.footerText}>GafferOS v1.0 — Phase 3</span>
          <span className={styles.footerSep}>·</span>
          <span className={styles.footerText}>FastAPI + Next.js</span>
        </div>
      </footer>
    </>
  )
}