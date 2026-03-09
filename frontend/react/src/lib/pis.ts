import type { PlayerProfile, PlayerStats } from '@/types/gafferos'

function clamp(v: number) { return Math.min(1, Math.max(0, v)) }

export function calculatePIS(player: PlayerProfile): number {
  const s = player.stats
  if (!s || !s.matches_played || s.matches_played === 0) return 0

  const mp = s.matches_played
  const sp = player.specific_position

  if (sp === 'GK') {
    const saves = clamp((s.saves || 0) / (mp * 4))
    const cs    = clamp((s.clean_sheets || 0) / mp)
    return clamp(saves * 0.55 + cs * 0.45)
  }
  if (['CB'].includes(sp)) {
    const t = clamp((s.tackles || 0) / (mp * 4))
    const i = clamp((s.interceptions || 0) / (mp * 3))
    const b = clamp((s.blocks || 0) / (mp * 2))
    return clamp(t * 0.4 + i * 0.35 + b * 0.25)
  }
  if (['RB','LB','RWB','LWB'].includes(sp)) {
    const t  = clamp((s.tackles || 0) / (mp * 3))
    const i  = clamp((s.interceptions || 0) / (mp * 2))
    const cr = clamp((s.crosses || 0) / (mp * 4))
    const a  = clamp((s.assists || 0) / mp)
    return clamp(t * 0.3 + i * 0.25 + cr * 0.25 + a * 0.2)
  }
  if (sp === 'CDM') {
    const t  = clamp((s.tackles || 0) / (mp * 4))
    const i  = clamp((s.interceptions || 0) / (mp * 3))
    const kp = clamp((s.key_passes || 0) / (mp * 2))
    return clamp(t * 0.4 + i * 0.35 + kp * 0.25)
  }
  if (['CM','RM','LM'].includes(sp)) {
    const kp = clamp((s.key_passes || 0) / (mp * 3))
    const a  = clamp((s.assists || 0) / mp)
    const g  = clamp((s.goals || 0) / mp)
    return clamp(kp * 0.4 + a * 0.35 + g * 0.25)
  }
  if (sp === 'CAM') {
    const kp = clamp((s.key_passes || 0) / (mp * 4))
    const cc = clamp((s.chances_created || 0) / (mp * 3))
    const a  = clamp((s.assists || 0) / mp)
    return clamp(kp * 0.35 + cc * 0.35 + a * 0.3)
  }
  if (['RW','LW'].includes(sp)) {
    const g  = clamp((s.goals || 0) / mp)
    const a  = clamp((s.assists || 0) / mp)
    const cr = clamp((s.crosses || 0) / (mp * 3))
    const dr = clamp((s.dribbles || 0) / (mp * 4))
    return clamp(g * 0.3 + a * 0.25 + cr * 0.25 + dr * 0.2)
  }
  // ST, CF, SS
  const g = clamp((s.goals || 0) / mp)
  const a = clamp((s.assists || 0) / (mp * 0.5))
  return clamp(g * 0.65 + a * 0.35)
}

export function selectionScore(
  player: PlayerProfile,
  risk: 'High' | 'Medium' | 'Low'
): number {
  const pis     = player.pis ?? calculatePIS(player)
  const fitness = player.fitness_score ?? 1.0
  if (!player.stats?.matches_played) return fitness
  const weights = { High: [0.70, 0.30], Medium: [0.50, 0.50], Low: [0.30, 0.70] }
  const [wp, wf] = weights[risk]
  return clamp(pis * wp + fitness * wf)
}
