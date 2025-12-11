

import { Match, PreMatchTeamStats, MarketStrategy, TargetOutcome, CriteriaMetric, Operator, MatchOdds, BetTicket } from './types';
import { v4 as uuidv4 } from 'uuid';

export const LEAGUES = [
  "Premier League",
  "La Liga",
  "Serie A",
  "Bundesliga",
  "Ligue 1",
  "Championship",
  "Eredivisie",
  "Primeira Liga"
];

export const TEAMS = {
  "Premier League": ["Arsenal", "Aston Villa", "Bournemouth", "Brentford", "Brighton", "Chelsea", "Crystal Palace", "Everton", "Fulham", "Liverpool", "Luton", "Man City", "Man Utd", "Newcastle", "Nottm Forest", "Sheffield Utd", "Tottenham", "West Ham", "Wolves"],
  "La Liga": ["Real Madrid", "Barcelona", "Girona", "Atlético Madrid", "Athletic Club", "Real Sociedad", "Betis", "Valencia", "Las Palmas", "Getafe"],
  "Serie A": ["Inter", "Juventus", "Milan", "Atalanta", "Roma", "Bologna", "Napoli", "Lazio", "Torino", "Monza"],
  "Bundesliga": ["Leverkusen", "Bayern", "Stuttgart", "Dortmund", "Leipzig", "Frankfurt", "Augsburg", "Hoffenheim", "Freiburg", "Heidenheim"]
};

// Helper to generate fake history for market details
const generateFakeHistory = (stratId: string, outcome: TargetOutcome, count: number): BetTicket[] => {
  return Array.from({ length: count }).map((_, i) => {
    const isWin = Math.random() > 0.25; // 75% win rate simulation
    const odds = parseFloat((Math.random() * 0.8 + 1.4).toFixed(2));
    
    // Fake score generation based on win/loss
    let ftHome = Math.floor(Math.random() * 3);
    let ftAway = Math.floor(Math.random() * 3);
    
    // Force score to match outcome if win, or opposite if loss (simplified)
    if (outcome === TargetOutcome.OVER_0_5_GOALS) {
        if (isWin) ftHome = Math.max(1, ftHome);
        else { ftHome = 0; ftAway = 0; }
    } else if (outcome === TargetOutcome.BTTS_YES) {
        if (isWin) { ftHome = Math.max(1, ftHome); ftAway = Math.max(1, ftAway); }
        else ftAway = 0; 
    }

    return {
      id: uuidv4(),
      strategyId: stratId,
      strategyName: 'Market Strat',
      matchId: `hist-${i}`,
      homeTeam: TEAMS['Premier League'][Math.floor(Math.random() * 18)],
      awayTeam: TEAMS['La Liga'][Math.floor(Math.random() * 10)],
      targetOutcome: outcome,
      triggerTime: Date.now() - (i * 86400000), // Days ago
      initialScore: { home: 0, away: 0 },
      oddsAtTrigger: odds,
      status: isWin ? 'WON' : 'LOST',
      resultTime: Date.now(),
      htScore: `${Math.floor(ftHome/2)}-${Math.floor(ftAway/2)}`,
      ftScore: `${ftHome}-${ftAway}`
    };
  });
};

// MARKETPLACE DATA
export const MOCK_MARKET_STRATEGIES: MarketStrategy[] = [
  {
    id: 'mkt-1',
    userId: 'system',
    name: 'Late 2nd Half Goal Sniper',
    author: 'GoalKing99',
    description: 'Finds matches 70+ mins with high pressure but 0-0 scoreline.',
    active: true,
    targetOutcome: TargetOutcome.OVER_0_5_GOALS,
    criteria: [
      { id: '1', metric: CriteriaMetric.TIME, operator: Operator.GREATER_THAN, value: 70 },
      { id: '2', metric: CriteriaMetric.GOALS_TOTAL, operator: Operator.EQUALS, value: 0 },
      { id: '3', metric: CriteriaMetric.DA_TOTAL, operator: Operator.GREATER_THAN, value: 45 }
    ],
    triggeredMatches: [],
    wins: 142,
    totalHits: 180,
    strikeRate: 78.8,
    avgOdds: 1.85,
    roi: 12.5,
    copyCount: 1240,
    price: 0, // Free
    isPublic: true,
    history: generateFakeHistory('mkt-1', TargetOutcome.OVER_0_5_GOALS, 15)
  },
  {
    id: 'mkt-2',
    userId: 'system',
    name: 'First Half BTTS Machine',
    author: 'PuntMaster',
    description: 'Teams with high pre-match BTTS% actively attacking early.',
    active: true,
    targetOutcome: TargetOutcome.BTTS_YES,
    criteria: [
      { id: '1', metric: CriteriaMetric.TIME, operator: Operator.LESS_THAN, value: 30 },
      { id: '2', metric: CriteriaMetric.PRE_BTTS_HOME, operator: Operator.GREATER_THAN, value: 65 },
      { id: '3', metric: CriteriaMetric.SHOTS_ON_TOTAL, operator: Operator.GREATER_THAN, value: 4 }
    ],
    triggeredMatches: [],
    wins: 89,
    totalHits: 110,
    strikeRate: 81.0,
    avgOdds: 2.10,
    roi: 18.2,
    copyCount: 850,
    price: 9.99, // Paid
    isPublic: true,
    history: generateFakeHistory('mkt-2', TargetOutcome.BTTS_YES, 12)
  },
  {
    id: 'mkt-3',
    userId: 'system',
    name: 'Under 2.5 Fortress',
    author: 'DefensiveGuru',
    description: 'Low xG matches in the 2nd half with defensive history.',
    active: true,
    targetOutcome: TargetOutcome.UNDER_2_5_GOALS,
    criteria: [
      { id: '1', metric: CriteriaMetric.GOALS_TOTAL, operator: Operator.LESS_THAN, value: 2 },
      { id: '2', metric: CriteriaMetric.TIME, operator: Operator.GREATER_THAN, value: 60 },
      { id: '3', metric: CriteriaMetric.XG_TOTAL, operator: Operator.LESS_THAN, value: 1.2 }
    ],
    triggeredMatches: [],
    wins: 210,
    totalHits: 245,
    strikeRate: 85.7,
    avgOdds: 1.45,
    roi: 8.4,
    copyCount: 1500,
    price: 0, // Free
    isPublic: true,
    history: generateFakeHistory('mkt-3', TargetOutcome.UNDER_2_5_GOALS, 20)
  }
];

const generatePreMatchStats = (): PreMatchTeamStats => {
  const avgGoals = parseFloat((Math.random() * 2.5 + 0.5).toFixed(2));
  const avgConceded = parseFloat((Math.random() * 2 + 0.5).toFixed(2));
  
  return {
    avgGoalsScored: avgGoals,
    avgGoalsConceded: avgConceded,
    avgCorners: parseFloat((Math.random() * 6 + 2).toFixed(2)),
    bttsPercentage: Math.floor(Math.random() * 80 + 20),
    over25Percentage: Math.floor(Math.random() * 80 + 20),
    last5Form: Array(5).fill(0).map(() => ['W','D','L'][Math.floor(Math.random()*3)]).join(''),
    
    // New Stats
    ppg: parseFloat((Math.random() * 2.5 + 0.5).toFixed(2)),
    leaguePosition: Math.floor(Math.random() * 18 + 1),
    cleanSheetPercentage: Math.floor(Math.random() * 50 + 10),
    failedToScorePercentage: Math.floor(Math.random() * 40 + 5),

    // Detailed Stats (For)
    avgFirstHalfGoalsFor: parseFloat((avgGoals * 0.4).toFixed(2)),
    avgSecondHalfGoalsFor: parseFloat((avgGoals * 0.6).toFixed(2)),
    
    // Detailed Stats (Against)
    avgFirstHalfGoalsAgainst: parseFloat((avgConceded * 0.45).toFixed(2)),
    avgSecondHalfGoalsAgainst: parseFloat((avgConceded * 0.55).toFixed(2)),
    
    avgTimeFirstGoalScored: Math.floor(Math.random() * 50 + 10), // 10-60 mins
    avgTimeFirstGoalConceded: Math.floor(Math.random() * 50 + 10),
  };
};

const generateOdds = (): MatchOdds => ({
  homeWin: parseFloat((Math.random() * 3 + 1.2).toFixed(2)),
  draw: parseFloat((Math.random() * 2 + 2.5).toFixed(2)),
  awayWin: parseFloat((Math.random() * 4 + 1.5).toFixed(2)),
  over25: parseFloat((Math.random() * 1 + 1.4).toFixed(2)),
  under25: parseFloat((Math.random() * 1 + 1.6).toFixed(2)),
  bttsYes: parseFloat((Math.random() * 1 + 1.5).toFixed(2)),
});

export const generateMockMatch = (id: string): Match => {
  const leagues = Object.keys(TEAMS);
  const randomLeague = leagues[Math.floor(Math.random() * leagues.length)];
  const teams = TEAMS[randomLeague as keyof typeof TEAMS] || [];
  
  let homeIdx = Math.floor(Math.random() * teams.length);
  let awayIdx = Math.floor(Math.random() * teams.length);
  const homeTeam = teams[homeIdx] || "Home Team";
  const awayTeam = teams[awayIdx] || "Away Team";

  const isLive = Math.random() > 0.1;
  const minute = isLive ? Math.floor(Math.random() * 88) + 1 : 0;

  // Simulate HT corners as half of total for demo
  const hCorners = isLive ? Math.floor(Math.random() * 8) : 0;
  const aCorners = isLive ? Math.floor(Math.random() * 5) : 0;

  return {
    id,
    league: randomLeague,
    country: 'International',
    homeTeam: homeTeam,
    awayTeam: awayTeam,
    startTime: Date.now(),
    minute: minute,
    status: isLive ? 'Live' : 'Scheduled',
    lastUpdated: Date.now(),
    stats: {
      home: {
        goals: isLive ? Math.floor(Math.random() * 3) : 0,
        goalsFirstHalf: isLive && minute > 45 ? Math.floor(Math.random() * 2) : 0,
        corners: hCorners,
        cornersFirstHalf: isLive && minute > 45 ? Math.floor(hCorners * 0.6) : hCorners,
        shotsOnTarget: isLive ? Math.floor(Math.random() * 6) : 0,
        shotsOffTarget: isLive ? Math.floor(Math.random() * 5) : 0,
        attacks: isLive ? Math.floor(Math.random() * 50) : 0,
        dangerousAttacks: isLive ? Math.floor(Math.random() * 30) : 0,
        possession: 50,
        yellowCards: isLive && Math.random() > 0.7 ? 1 : 0,
        redCards: 0,
        expectedGoals: isLive ? parseFloat((Math.random() * 2.5).toFixed(2)) : 0,
      },
      away: {
        goals: isLive ? Math.floor(Math.random() * 2) : 0,
        goalsFirstHalf: isLive && minute > 45 ? Math.floor(Math.random() * 1) : 0,
        corners: aCorners,
        cornersFirstHalf: isLive && minute > 45 ? Math.floor(aCorners * 0.6) : aCorners,
        shotsOnTarget: isLive ? Math.floor(Math.random() * 4) : 0,
        shotsOffTarget: isLive ? Math.floor(Math.random() * 4) : 0,
        attacks: isLive ? Math.floor(Math.random() * 40) : 0,
        dangerousAttacks: isLive ? Math.floor(Math.random() * 20) : 0,
        possession: 50,
        yellowCards: isLive && Math.random() > 0.8 ? 1 : 0,
        redCards: 0,
        expectedGoals: isLive ? parseFloat((Math.random() * 1.5).toFixed(2)) : 0,
      },
      liveOdds: isLive ? generateOdds() : undefined
    },
    preMatch: {
      home: generatePreMatchStats(),
      away: generatePreMatchStats(),
      odds: generateOdds()
    }
  };
};
