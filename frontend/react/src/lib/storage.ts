import type { Player } from '@/types/gafferos'

// ── Extended player with stats and profile ─────────────────────
export interface PlayerStats {
  matches_played: number
  // GK
  saves?: number
  clean_sheets?: number
  // Defender / CDM
  tackles?: number
  interceptions?: number
  blocks?: number
  // Fullback / Wide
  crosses?: number
  dribbles?: number
  // Midfield / Attack
  key_passes?: number
  chances_created?: number
  assists?: number
  goals?: number
}

export interface PlayerProfile extends Player {
  stats: PlayerStats
  photo?: string // base64 or URL — placeholder for now
}

const STORAGE_KEY = 'gafferos_players'

// ── Read all profiles ──────────────────────────────────────────
export function loadProfiles(): PlayerProfile[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

// ── Save all profiles ──────────────────────────────────────────
export function saveProfiles(profiles: PlayerProfile[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles))
}

// ── Get single profile by name ─────────────────────────────────
export function getProfile(name: string): PlayerProfile | null {
  return loadProfiles().find(p => p.name === name) ?? null
}

// ── Upsert single profile ──────────────────────────────────────
export function upsertProfile(profile: PlayerProfile): void {
  const all = loadProfiles()
  const idx = all.findIndex(p => p.name === profile.name)
  if (idx >= 0) {
    // Keep existing stats — only update non-stat fields
    all[idx] = {
      ...all[idx],
      name: profile.name,
      position: profile.position,
      specific_position: profile.specific_position,
      secondary_position: profile.secondary_position,
      available: profile.available,
      fitness_score: profile.fitness_score,
      // Never overwrite stats unless explicitly passed with data
      stats: profile.stats?.matches_played > 0
        ? profile.stats
        : all[idx].stats,
    }
  } else {
    all.push(profile)
  }
  saveProfiles(all)
}
// ── Merge basic Player list with stored profiles ───────────────
// Called in SquadBuilder to hydrate players with saved stats
export function hydratePlayers(players: Player[]): PlayerProfile[] {
  const profiles = loadProfiles()
  return players.map(p => {
    const saved = profiles.find(pr => pr.name === p.name)
    return saved
      ? { ...saved, ...p, stats: saved.stats ?? { matches_played: 0 } }
      : { ...p, stats: { matches_played: 0 } }
  })
}