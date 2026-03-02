import type { PlayerProfile } from './storage'

type PositionGroup =
  | 'GK' | 'CB' | 'Fullback'
  | 'CDM' | 'CM' | 'CAM'
  | 'Wide' | 'FWD'

function getGroup(specific: string): PositionGroup | null {
  if (specific === 'GK')                          return 'GK'
  if (specific === 'CB')                          return 'CB'
  if (['RB','LB','RWB','LWB'].includes(specific)) return 'Fullback'
  if (specific === 'CDM')                         return 'CDM'
  if (specific === 'CM')                          return 'CM'
  if (specific === 'CAM')                         return 'CAM'
  if (['RW','LW','RM','LM'].includes(specific))   return 'Wide'
  if (['ST','CF','SS'].includes(specific))        return 'FWD'
  return null
}

function cap(val: number): number {
  return Math.min(val, 1.0)
}

export function calculatePIS(player: PlayerProfile): number | null {
  const { stats, specific_position } = player
  if (!stats || !stats.matches_played || stats.matches_played === 0) return null

  const mp = stats.matches_played
  const per = (key: keyof typeof stats) => ((stats[key] as number) ?? 0) / mp
  const group = getGroup(specific_position)

  switch (group) {
    case 'GK':
      return cap(
        cap(per('saves') / 5) * 0.6 +
        cap(per('clean_sheets') / 0.5) * 0.4
      )

    case 'CB':
      return cap(
        cap(per('tackles') / 5) * 0.40 +
        cap(per('interceptions') / 3) * 0.35 +
        cap(per('blocks') / 2) * 0.25
      )

    case 'Fullback':
      return cap(
        cap(per('tackles') / 4) * 0.30 +
        cap(per('interceptions') / 3) * 0.30 +
        cap(per('crosses') / 4) * 0.20 +
        cap(per('assists') / 0.5) * 0.20
      )

    case 'CDM':
      return cap(
        cap(per('tackles') / 5) * 0.45 +
        cap(per('interceptions') / 3) * 0.35 +
        cap(per('key_passes') / 2) * 0.20
      )

    case 'CM':
      return cap(
        cap(per('key_passes') / 3) * 0.40 +
        cap(per('assists') / 0.5) * 0.35 +
        cap(per('goals') / 0.3) * 0.25
      )

    case 'CAM':
      return cap(
        cap(per('key_passes') / 4) * 0.35 +
        cap(per('chances_created') / 3) * 0.35 +
        cap(per('assists') / 0.5) * 0.30
      )

    case 'Wide':
      return cap(
        cap(per('goals') / 0.5) * 0.30 +
        cap(per('assists') / 0.5) * 0.30 +
        cap(per('crosses') / 4) * 0.20 +
        cap(per('dribbles') / 3) * 0.20
      )

    case 'FWD':
      return cap(
        cap(per('goals') / 0.6) * 0.65 +
        cap(per('assists') / 0.4) * 0.35
      )

    default:
      return null
  }
}

// Key stats to display per position group
export function getStatFields(specific: string): {
  key: keyof PlayerProfile['stats']
  label: string
}[] {
  const group = getGroup(specific)
  switch (group) {
    case 'GK':
      return [
        { key: 'saves',        label: 'Saves' },
        { key: 'clean_sheets', label: 'Clean Sheets' },
      ]
    case 'CB':
      return [
        { key: 'tackles',       label: 'Tackles' },
        { key: 'interceptions', label: 'Interceptions' },
        { key: 'blocks',        label: 'Blocks' },
      ]
    case 'Fullback':
      return [
        { key: 'tackles',       label: 'Tackles' },
        { key: 'interceptions', label: 'Interceptions' },
        { key: 'crosses',       label: 'Crosses' },
        { key: 'assists',       label: 'Assists' },
      ]
    case 'CDM':
      return [
        { key: 'tackles',       label: 'Tackles' },
        { key: 'interceptions', label: 'Interceptions' },
        { key: 'key_passes',    label: 'Key Passes' },
      ]
    case 'CM':
      return [
        { key: 'key_passes', label: 'Key Passes' },
        { key: 'assists',    label: 'Assists' },
        { key: 'goals',      label: 'Goals' },
      ]
    case 'CAM':
      return [
        { key: 'key_passes',      label: 'Key Passes' },
        { key: 'chances_created', label: 'Chances Created' },
        { key: 'assists',         label: 'Assists' },
      ]
    case 'Wide':
      return [
        { key: 'goals',    label: 'Goals' },
        { key: 'assists',  label: 'Assists' },
        { key: 'crosses',  label: 'Crosses' },
        { key: 'dribbles', label: 'Dribbles' },
      ]
    case 'FWD':
      return [
        { key: 'goals',   label: 'Goals' },
        { key: 'assists', label: 'Assists' },
      ]
    default:
      return []
  }
}