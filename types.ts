
export type MatchStatus = 'Scheduled' | 'Live' | 'HT' | 'FT' | 'PST';

export interface TeamStats {
  goals: number; // Goals are rarely null, usually 0
  corners: number | null;
  shotsOnTarget: number | null;
  shotsOffTarget: number | null;
  attacks: number | null;
  dangerousAttacks: number | null;
  possession: number | null;
  yellowCards: number | null;
  redCards: number | null;
  expectedGoals: number | null; // New xG metric
}

export interface PreMatchTeamStats {
  avgGoalsScored: number | null;
  avgGoalsConceded: number | null;
  avgCorners: number | null;
  bttsPercentage: number | null; // Both Teams To Score %
  over25Percentage: number | null; // Over 2.5 Goals %
  last5Form: string | null; // e.g., "WDLWW"
}

export interface MatchStats {
  home: TeamStats;
  away: TeamStats;
}

export interface Match {
  id: string; // API Fixture ID
  league: string;
  country: string;
  homeTeam: string;
  awayTeam: string;
  homeLogo?: string;
  awayLogo?: string;
  startTime: number;
  minute: number;
  status: MatchStatus;
  stats: MatchStats;
  preMatch: {
    home: PreMatchTeamStats;
    away: PreMatchTeamStats;
  };
  lastUpdated: number;
}

export enum CriteriaMetric {
  // LIVE METRICS
  TIME = 'Time (Minute)',
  
  // Live Goals
  GOALS_HOME = 'Live Home Goals',
  GOALS_AWAY = 'Live Away Goals',
  GOALS_TOTAL = 'Live Total Goals',
  
  // Live xG
  XG_HOME = 'Live Home xG',
  XG_AWAY = 'Live Away xG',
  XG_TOTAL = 'Live Total xG',
  
  // Live Corners
  CORNERS_HOME = 'Live Home Corners',
  CORNERS_AWAY = 'Live Away Corners',
  CORNERS_TOTAL = 'Live Total Corners',
  
  // Live Shots
  SHOTS_ON_HOME = 'Live Home Shots On Target',
  SHOTS_ON_AWAY = 'Live Away Shots On Target',
  SHOTS_ON_TOTAL = 'Live Total Shots On Target',
  SHOTS_OFF_HOME = 'Live Home Shots Off Target',
  SHOTS_OFF_AWAY = 'Live Away Shots Off Target',
  SHOTS_OFF_TOTAL = 'Live Total Shots Off Target',
  
  // Live Pressure
  ATTACKS_HOME = 'Live Home Attacks',
  ATTACKS_AWAY = 'Live Away Attacks',
  ATTACKS_TOTAL = 'Live Total Attacks',
  DA_HOME = 'Live Home Dangerous Attacks',
  DA_AWAY = 'Live Away Dangerous Attacks',
  DA_TOTAL = 'Live Total Dangerous Attacks',
  POSSESSION_HOME = 'Live Home Possession %',
  POSSESSION_AWAY = 'Live Away Possession %',
  
  // Live Cards
  YELLOW_HOME = 'Live Home Yellow Cards',
  YELLOW_AWAY = 'Live Away Yellow Cards',
  YELLOW_TOTAL = 'Live Total Yellow Cards',
  RED_HOME = 'Live Home Red Cards',
  RED_AWAY = 'Live Away Red Cards',
  RED_TOTAL = 'Live Total Red Cards',

  // PRE-MATCH METRICS (History/Form)
  PRE_AVG_GOALS_SCORED_HOME = 'Pre-Match Avg Goals Scored (Home Team)',
  PRE_AVG_GOALS_SCORED_AWAY = 'Pre-Match Avg Goals Scored (Away Team)',
  
  PRE_AVG_GOALS_CONCEDED_HOME = 'Pre-Match Avg Goals Conceded (Home Team)',
  PRE_AVG_GOALS_CONCEDED_AWAY = 'Pre-Match Avg Goals Conceded (Away Team)',

  PRE_AVG_CORNERS_HOME = 'Pre-Match Avg Corners (Home Team)',
  PRE_AVG_CORNERS_AWAY = 'Pre-Match Avg Corners (Away Team)',

  PRE_BTTS_HOME = 'Pre-Match BTTS % (Home Team)',
  PRE_BTTS_AWAY = 'Pre-Match BTTS % (Away Team)',

  PRE_OVER25_HOME = 'Pre-Match Over 2.5 % (Home Team)',
  PRE_OVER25_AWAY = 'Pre-Match Over 2.5 % (Away Team)'
}

export enum Operator {
  GREATER_THAN = '>',
  LESS_THAN = '<',
  EQUALS = '=',
  GREATER_EQUAL = '>=',
  LESS_EQUAL = '<='
}

export interface AlertCriteria {
  id: string;
  metric: CriteriaMetric;
  operator: Operator;
  value: number;
}

export interface AlertStrategy {
  id: string;
  name: string;
  active: boolean;
  criteria: AlertCriteria[];
  triggeredMatches: string[]; // List of match IDs
}

export interface NotificationLog {
  id: string;
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  strategyName: string;
  message: string;
  timestamp: number;
  read: boolean;
}

export interface ApiSettings {
  apiKey: string;
  refreshRate: number; // in seconds
  useDemoData: boolean;
}
