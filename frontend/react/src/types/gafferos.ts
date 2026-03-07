// ── Enums ──────────────────────────────────────────────────────
export type DataTier = 'tier_1' | 'tier_2'
export type MatchResult = 'W' | 'D' | 'L'
export type BroadPosition = 'GK' | 'DEF' | 'MID' | 'FWD'

export type SpecificPosition =
  | 'GK'
  | 'CB' | 'RB' | 'LB' | 'RWB' | 'LWB'
  | 'CDM' | 'CM' | 'CAM' | 'RM' | 'LM'
  | 'RW' | 'LW' | 'ST' | 'CF' | 'SS'

// ── Position map (broad → specifics) ──────────────────────────
export const POSITION_MAP: Record<BroadPosition, SpecificPosition[]> = {
  GK:  ['GK'],
  DEF: ['CB', 'RB', 'LB', 'RWB', 'LWB'],
  MID: ['CDM', 'CM', 'CAM', 'RM', 'LM'],
  FWD: ['RW', 'LW', 'ST', 'CF', 'SS'],
}

export const ALL_SPECIFICS: SpecificPosition[] = [
  'GK', 'CB', 'RB', 'LB', 'RWB', 'LWB',
  'CDM', 'CM', 'CAM', 'RM', 'LM',
  'RW', 'LW', 'ST', 'CF', 'SS',
]

// ── Input models ───────────────────────────────────────────────
export interface Player {
  name: string
  position: BroadPosition
  specific_position: SpecificPosition
  secondary_position?: SpecificPosition | null
  available: boolean
  fitness_score: number
}

export interface Tier1Data {
  team_name: string
  opponent_name: string
  last_5_results: MatchResult[]
  goals_scored_last_5: number
  goals_conceded_last_5: number
  players: Player[]
  opponent_last_5_results?: MatchResult[]
  opponent_goals_scored?: number
  opponent_goals_conceded?: number
}

export interface Tier2Data extends Tier1Data {
  avg_possession: number
  avg_passing_accuracy: number
  avg_shots_per_match: number
  avg_shots_on_target: number
  avg_defensive_errors: number
  opp_avg_possession?: number
  opp_avg_passing_accuracy?: number
  opp_avg_shots_per_match?: number
  opp_avg_defensive_errors?: number
}

export interface AnalyseRequest {
  tier: DataTier
  tier1_data?: Tier1Data
  tier2_data?: Tier2Data
}

// ── Output model ───────────────────────────────────────────────
export interface TacticalReport {
  team_name: string
  opponent_name: string
  tier_used: DataTier
  recommended_formation: string
  press_intensity: string
  defensive_line: string
  tactical_focus: string
  match_risk_level: string
  rotation_suggestions: string[]
  win_probability?: number
  draw_probability?: number
  loss_probability?: number
  offensive_strength_index: number
  defensive_vulnerability_index: number
  fatigue_risk_score: number
  tactical_stability_score: number
  reasoning: string
  starting_xi: PlayerSlot[]
  bench: PlayerSlot[]
}

export interface PlayerSlot {
  name: string
  position: BroadPosition
  specific_position: SpecificPosition
  secondary_position?: SpecificPosition
  fitness_score: number
  available: boolean
  slot_broad?: BroadPosition
}