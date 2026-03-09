import { Player, MatchData } from '@/types/gafferos'

const KEYS = {
  players: 'gafferos_players',
  match:   'gafferos_match',
  tier:    'gafferos_tier',
  report:  'gafferos_report',
}

function safe<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch { return fallback }
}

function save(key: string, value: unknown) {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify(value))
}

export const storage = {
  getPlayers: (): Player[] => safe(KEYS.players, []),
  savePlayers: (p: Player[]) => save(KEYS.players, p),
  getMatch: (): MatchData | null => safe(KEYS.match, null),
  saveMatch: (m: MatchData) => save(KEYS.match, m),
  getTier: (): 'tier_1' | 'tier_2' => safe(KEYS.tier, 'tier_1'),
  saveTier: (t: string) => save(KEYS.tier, t),
  getReport: () => safe(KEYS.report, null),
  saveReport: (r: unknown) => save(KEYS.report, r),
}
