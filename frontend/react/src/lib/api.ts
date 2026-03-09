import { MatchData, TacticalReport, Player } from '@/types/gafferos'

export async function analyseMatch(
  matchData: MatchData,
  players: Player[],
  tier: 'tier_1' | 'tier_2'
): Promise<TacticalReport> {
  const body = tier === 'tier_2'
    ? { tier: 'tier_2', tier2_data: { ...matchData, players } }
    : { tier: 'tier_1', tier1_data: { ...matchData, players } }

  const res = await fetch('/api/analyse', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Analysis failed')
  }
  return res.json()
}
