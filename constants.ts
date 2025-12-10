import { Match, PreMatchTeamStats } from './types';

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

const generatePreMatchStats = (): PreMatchTeamStats => ({
  avgGoalsScored: parseFloat((Math.random() * 2.5 + 0.5).toFixed(2)),
  avgGoalsConceded: parseFloat((Math.random() * 2 + 0.5).toFixed(2)),
  avgCorners: parseFloat((Math.random() * 6 + 2).toFixed(2)),
  bttsPercentage: Math.floor(Math.random() * 80 + 20),
  over25Percentage: Math.floor(Math.random() * 80 + 20),
  last5Form: Array(5).fill(0).map(() => ['W','D','L'][Math.floor(Math.random()*3)]).join('')
});

// Helper to create a random initial match
export const generateMockMatch = (id: string): Match => {
  const leagues = Object.keys(TEAMS);
  const randomLeague = leagues[Math.floor(Math.random() * leagues.length)];
  const teams = TEAMS[randomLeague as keyof typeof TEAMS] || [];
  
  // Pick two distinct teams
  let homeIdx = Math.floor(Math.random() * teams.length);
  let awayIdx = Math.floor(Math.random() * teams.length);
  
  // Fallback if teams undefined
  const homeTeam = teams[homeIdx] || "Home Team";
  const awayTeam = teams[awayIdx] || "Away Team";

  // Randomize start state (some already live, some 0-0)
  const isLive = Math.random() > 0.1; // Most matches live for demo purposes
  const minute = isLive ? Math.floor(Math.random() * 88) + 1 : 0;

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
        corners: isLive ? Math.floor(Math.random() * 8) : 0,
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
        corners: isLive ? Math.floor(Math.random() * 5) : 0,
        shotsOnTarget: isLive ? Math.floor(Math.random() * 4) : 0,
        shotsOffTarget: isLive ? Math.floor(Math.random() * 4) : 0,
        attacks: isLive ? Math.floor(Math.random() * 40) : 0,
        dangerousAttacks: isLive ? Math.floor(Math.random() * 20) : 0,
        possession: 50,
        yellowCards: isLive && Math.random() > 0.8 ? 1 : 0,
        redCards: 0,
        expectedGoals: isLive ? parseFloat((Math.random() * 1.5).toFixed(2)) : 0,
      }
    },
    preMatch: {
      home: generatePreMatchStats(),
      away: generatePreMatchStats()
    }
  };
};