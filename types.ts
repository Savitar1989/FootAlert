
export type MatchStatus = 'Scheduled' | 'Live' | 'HT' | 'FT' | 'PST' | 'AET' | 'PEN';

export type UserRole = 'user' | 'admin';

export type SubscriptionPlan = 'trial' | 'weekly' | 'monthly';

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sound: boolean;
  telegram: boolean;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  createdAt: number;
  lastLogin?: number;
  
  // Profile
  avatar?: string;
  bio?: string;

  // Settings
  preferences: NotificationPreferences;

  // Security
  twoFactorEnabled: boolean;
  isBanned?: boolean;

  // New Economy Fields
  walletBalance: number;
  subscription: {
    plan: SubscriptionPlan;
    status: 'active' | 'expired';
    expiryDate: number;
  };
}

export interface GlobalSettings {
  siteName: string;
  maintenanceMode: boolean;
  
  // External APIs
  apiFootballKey: string;
  sportMonksToken: string;
  oddsApiKey: string;
  geminiApiKey: string;
  
  // Payment Gateways
  stripePublishableKey: string;
  stripeSecretKey: string;
  currencyCode: string;
  
  // Email Service
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpFrom: string;
}

export interface AuditLog {
  id: string;
  adminId: string;
  action: string;
  targetId?: string;
  details: string;
  timestamp: number;
  ip?: string;
}

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning';
}

export interface TeamStats {
  goals: number; 
  goalsFirstHalf: number | null; 
  corners: number | null;
  cornersFirstHalf: number | null; 
  shotsOnTarget: number | null;
  shotsOffTarget: number | null;
  attacks: number | null;
  dangerousAttacks: number | null;
  possession: number | null;
  yellowCards: number | null;
  redCards: number | null;
  expectedGoals: number | null; 
}

export interface PreMatchTeamStats {
  // General
  avgGoalsScored: number | null;
  avgGoalsConceded: number | null;
  avgCorners: number | null;
  bttsPercentage: number | null;
  over25Percentage: number | null;
  last5Form: string | null;
  
  // New Stats
  ppg: number | null; 
  leaguePosition: number | null;
  cleanSheetPercentage: number | null;
  failedToScorePercentage: number | null;

  // Half Specific Goals For
  avgFirstHalfGoalsFor: number | null;
  avgSecondHalfGoalsFor: number | null;
  
  // Half Specific Goals Conceded
  avgFirstHalfGoalsAgainst: number | null; 
  avgSecondHalfGoalsAgainst: number | null; 
  
  // Timing
  avgTimeFirstGoalScored: number | null; 
  avgTimeFirstGoalConceded: number | null;
}

export interface MatchOdds {
  homeWin: number;
  draw: number;
  awayWin: number;
  over25: number;
  under25: number;
  bttsYes: number;
}

export interface MatchStats {
  home: TeamStats;
  away: TeamStats;
  liveOdds?: MatchOdds;
}

export interface Match {
  id: string; 
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
    odds?: MatchOdds;
  };
  lastUpdated: number;
}

export enum CriteriaMetric {
  // LIVE METRICS
  TIME = 'Time (Minute)',
  
  GOALS_HOME = 'Live Home Goals',
  GOALS_AWAY = 'Live Away Goals',
  GOALS_TOTAL = 'Live Total Goals',
  GOAL_DIFF = 'Live Goal Difference', 

  ODDS_HOME_WIN = 'Live Odds: Home Win',
  ODDS_AWAY_WIN = 'Live Odds: Away Win',
  ODDS_DRAW = 'Live Odds: Draw',
  ODDS_OVER_25 = 'Live Odds: Over 2.5',

  XG_HOME = 'Live Home xG',
  XG_AWAY = 'Live Away xG',
  XG_TOTAL = 'Live Total xG',
  
  CORNERS_HOME = 'Live Home Corners',
  CORNERS_AWAY = 'Live Away Corners',
  CORNERS_TOTAL = 'Live Total Corners',
  
  SHOTS_ON_HOME = 'Live Home Shots On Target',
  SHOTS_ON_AWAY = 'Live Away Shots On Target',
  SHOTS_ON_TOTAL = 'Live Total Shots On Target',
  SHOTS_OFF_HOME = 'Live Home Shots Off Target',
  SHOTS_OFF_AWAY = 'Live Away Shots Off Target',
  SHOTS_OFF_TOTAL = 'Live Total Shots Off Target',
  
  ATTACKS_HOME = 'Live Home Attacks',
  ATTACKS_AWAY = 'Live Away Attacks',
  ATTACKS_TOTAL = 'Live Total Attacks',
  DA_HOME = 'Live Home Dangerous Attacks',
  DA_AWAY = 'Live Away Dangerous Attacks',
  DA_TOTAL = 'Live Total Dangerous Attacks',
  POSSESSION_HOME = 'Live Home Possession %',
  POSSESSION_AWAY = 'Live Away Possession %',
  
  YELLOW_HOME = 'Live Home Yellow Cards',
  YELLOW_AWAY = 'Live Away Yellow Cards',
  YELLOW_TOTAL = 'Live Total Yellow Cards',
  RED_HOME = 'Live Home Red Cards',
  RED_AWAY = 'Live Away Red Cards',
  RED_TOTAL = 'Live Total Red Cards',

  // PRE-MATCH
  PRE_ODDS_HOME_WIN = 'Pre-Odds: Home Win',
  PRE_ODDS_AWAY_WIN = 'Pre-Odds: Away Win',
  PRE_ODDS_OVER_25 = 'Pre-Odds: Over 2.5',

  PRE_AVG_GOALS_SCORED_HOME = 'Pre: Avg Goals Scored (Home)',
  PRE_AVG_GOALS_SCORED_AWAY = 'Pre: Avg Goals Scored (Away)',
  PRE_AVG_GOALS_SCORED_ANY = 'Pre: Avg Goals Scored (ANY)', 

  PRE_AVG_GOALS_CONCEDED_HOME = 'Pre: Avg Goals Conceded (Home)',
  PRE_AVG_GOALS_CONCEDED_AWAY = 'Pre: Avg Goals Conceded (Away)',
  PRE_AVG_GOALS_CONCEDED_ANY = 'Pre: Avg Goals Conceded (ANY)', 

  PRE_PPG_HOME = 'Pre: PPG (Home)',
  PRE_PPG_AWAY = 'Pre: PPG (Away)',
  PRE_LEAGUE_POS_HOME = 'Pre: League Position (Home)',
  PRE_LEAGUE_POS_AWAY = 'Pre: League Position (Away)',
  PRE_CLEAN_SHEET_HOME = 'Pre: Clean Sheet % (Home)',
  PRE_CLEAN_SHEET_AWAY = 'Pre: Clean Sheet % (Away)',
  PRE_FAILED_SCORE_HOME = 'Pre: Failed to Score % (Home)',
  PRE_FAILED_SCORE_AWAY = 'Pre: Failed to Score % (Away)',

  PRE_BTTS_HOME = 'Pre: BTTS % (Home)',
  PRE_BTTS_AWAY = 'Pre: BTTS % (Away)',
  PRE_BTTS_ANY = 'Pre: BTTS % (ANY)', 

  PRE_OVER25_HOME = 'Pre: Over 2.5 % (Home)',
  PRE_OVER25_AWAY = 'Pre: Over 2.5 % (Away)',
  PRE_OVER25_ANY = 'Pre: Over 2.5 % (ANY)',
  
  PRE_AVG_1ST_HALF_GOALS_FOR_HOME = 'Pre: Avg 1H Goals For (Home)',
  PRE_AVG_1ST_HALF_GOALS_FOR_AWAY = 'Pre: Avg 1H Goals For (Away)',
  PRE_AVG_1ST_HALF_GOALS_FOR_ANY = 'Pre: Avg 1H Goals For (ANY)',

  PRE_AVG_2ND_HALF_GOALS_FOR_HOME = 'Pre: Avg 2H Goals For (Home)',
  PRE_AVG_2ND_HALF_GOALS_FOR_AWAY = 'Pre: Avg 2H Goals For (Away)',
  PRE_AVG_2ND_HALF_GOALS_FOR_ANY = 'Pre: Avg 2H Goals For (ANY)',

  PRE_AVG_1ST_HALF_GOALS_AGAINST_HOME = 'Pre: Avg 1H Goals Agst (Home)',
  PRE_AVG_1ST_HALF_GOALS_AGAINST_AWAY = 'Pre: Avg 1H Goals Agst (Away)',
  PRE_AVG_1ST_HALF_GOALS_AGAINST_ANY = 'Pre: Avg 1H Goals Agst (ANY)',

  PRE_AVG_2ND_HALF_GOALS_AGAINST_HOME = 'Pre: Avg 2H Goals Agst (Home)',
  PRE_AVG_2ND_HALF_GOALS_AGAINST_AWAY = 'Pre: Avg 2H Goals Agst (Away)',
  PRE_AVG_2ND_HALF_GOALS_AGAINST_ANY = 'Pre: Avg 2H Goals Agst (ANY)',

  PRE_AVG_TIME_1ST_GOAL_HOME = 'Pre: Avg Min 1st Goal (Home)',
  PRE_AVG_TIME_1ST_GOAL_AWAY = 'Pre: Avg Min 1st Goal (Away)',

  PRE_AVG_CORNERS_HOME = 'Pre: Avg Corners (Home)',
  PRE_AVG_CORNERS_AWAY = 'Pre: Avg Corners (Away)',
  PRE_AVG_CORNERS_ANY = 'Pre: Avg Corners (ANY)', 
}

export enum Operator {
  GREATER_THAN = '>',
  LESS_THAN = '<',
  EQUALS = '=',
  GREATER_EQUAL = '>=',
  LESS_EQUAL = '<='
}

export enum TargetOutcome {
  HOME_WIN = 'Home Win (FT)',
  AWAY_WIN = 'Away Win (FT)',
  DRAW = 'Draw (FT)',
  
  HT_HOME_WIN = 'Home Win (HT)',
  HT_DRAW = 'Draw (HT)',
  HT_AWAY_WIN = 'Away Win (HT)',
  HT_OVER_0_5 = 'Over 0.5 Goals (HT)',
  HT_OVER_1_5 = 'Over 1.5 Goals (HT)',
  HT_UNDER_0_5 = 'Under 0.5 Goals (HT)', 
  HT_UNDER_1_5 = 'Under 1.5 Goals (HT)', 
  
  OVER_0_5_GOALS = 'Over 0.5 Goals',
  OVER_1_5_GOALS = 'Over 1.5 Goals',
  OVER_2_5_GOALS = 'Over 2.5 Goals',
  
  UNDER_1_5_GOALS = 'Under 1.5 Goals',
  UNDER_2_5_GOALS = 'Under 2.5 Goals',
  UNDER_3_5_GOALS = 'Under 3.5 Goals',

  BTTS_YES = 'Both Teams To Score',
  HOME_NEXT_GOAL = 'Next Goal: Home',
  AWAY_NEXT_GOAL = 'Next Goal: Away',
  
  OVER_8_5_CORNERS = 'Over 8.5 Corners',
  OVER_9_5_CORNERS = 'Over 9.5 Corners',
  UNDER_10_5_CORNERS = 'Under 10.5 Corners',

  HT_OVER_0_5_CORNERS = 'HT Corners Over 0.5',
  HT_OVER_1_5_CORNERS = 'HT Corners Over 1.5',
  HT_OVER_2_5_CORNERS = 'HT Corners Over 2.5',
  HT_OVER_3_5_CORNERS = 'HT Corners Over 3.5',
  HT_OVER_4_5_CORNERS = 'HT Corners Over 4.5',
  HT_UNDER_2_5_CORNERS = 'HT Corners Under 2.5',
  HT_UNDER_3_5_CORNERS = 'HT Corners Under 3.5',
  HT_UNDER_4_5_CORNERS = 'HT Corners Under 4.5'
}

export interface AlertCriteria {
  id: string;
  metric: CriteriaMetric;
  operator: Operator;
  value: number;
}

export interface BetTicket {
  id: string;
  strategyId: string;
  strategyName: string;
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  targetOutcome: TargetOutcome;
  triggerTime: number; 
  initialScore: { home: number, away: number }; 
  oddsAtTrigger: number; 
  status: 'PENDING' | 'WON' | 'LOST';
  resultTime?: number;
  htScore?: string; 
  ftScore?: string; 
  statsSnapshot?: { home: TeamStats, away: TeamStats };
  preMatchOdds?: MatchOdds;
}

export interface AlertStrategy {
  id: string;
  userId: string;
  name: string;
  active: boolean;
  criteria: AlertCriteria[];
  targetOutcome: TargetOutcome; 
  triggeredMatches: string[]; 
  
  // Stats
  wins?: number;
  totalHits?: number;
  strikeRate?: number;
  avgOdds?: number; 
  roi?: number;
  history?: BetTicket[];
  
  // Market Logic
  isPublic?: boolean;
  price?: number; // 0 = Free
  description?: string;
}

export interface MarketStrategy extends AlertStrategy {
  author: string;
  copyCount: number;
  description: string;
  price: number;
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

export type DataProvider = 'api-football' | 'sportmonks';

export interface ApiSettings {
  userId: string;
  apiKey: string; // API-Football Key
  sportMonksApiKey?: string; // SportMonks API Token
  oddsApiKey?: string; // The Odds API Key
  primaryProvider: DataProvider;
  refreshRate: number; 
  useDemoData: boolean;
}

export interface SystemStats {
  totalUsers: number;
  totalStrategies: number;
  totalAlertsSent: number;
  serverLoad: number;
  globalRoi: number;
  traffic: number[];
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'subscription' | 'purchase' | 'sale' | 'deposit' | 'withdrawal';
  amount: number;
  description: string;
  date: number;
}
