export type MatchResult = 'W' | 'D' | 'L'
export type BroadPosition = 'GK' | 'DEF' | 'MID' | 'FWD'
export type SpecificPosition = 'GK'|'CB'|'RB'|'LB'|'RWB'|'LWB'|'CDM'|'CM'|'CAM'|'RM'|'LM'|'RW'|'LW'|'ST'|'CF'|'SS'

export interface Player {
  name: string
  position: BroadPosition
  specific_position: SpecificPosition
  secondary_position?: SpecificPosition
  available: boolean
  fitness_score: number
  stats?: PlayerStats
  number?: number
}

export interface PlayerStats {
  matches_played: number
  goals?: number
  assists?: number
  saves?: number
  clean_sheets?: number
  tackles?: number
  interceptions?: number
  key_passes?: number
  chances_created?: number
  crosses?: number
  dribbles?: number
  blocks?: number
  defensive_errors?: number
}

export interface TacticalReport {
  team_name: string
  opponent_name: string
  tier_used: string
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

export interface PlayerSlot extends Player {
  slot_broad?: BroadPosition
}

export interface MatchData {
  team_name: string
  opponent_name: string
  last_5_results: MatchResult[]
  goals_scored_last_5: number
  goals_conceded_last_5: number
  opponent_last_5_results?: MatchResult[]
  opponent_goals_scored?: number
  opponent_goals_conceded?: number
  avg_possession?: number
  avg_passing_accuracy?: number
  avg_shots_per_match?: number
  avg_shots_on_target?: number
  avg_defensive_errors?: number
}

export interface PitchPlayer {
  id: string
  name: string
  number?: number
  position: SpecificPosition
  x: number  // 0–100 percentage on pitch
  y: number  // 0–100 percentage on pitch
  fitness_score: number
}
