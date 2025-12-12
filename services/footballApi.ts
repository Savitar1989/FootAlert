
import { Match, MatchStatus, PreMatchTeamStats, ApiSettings, MatchOdds } from '../types';
import { generateMockMatch } from '../constants';

// CONFIGURATION
const API_FOOTBALL_BASE_URL = 'https://v3.football.api-sports.io';
// Note: SportMonks v3 base URL
const SPORTMONKS_BASE_URL = 'https://api.sportmonks.com/v3/football';
// The Odds API Base URL
const THE_ODDS_API_BASE_URL = 'https://api.the-odds-api.com/v4/sports/soccer/odds';

// Helper to pause execution
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

const generateDemoData = (): Match[] => {
  return Array.from({ length: 8 }).map((_, i) => generateMockMatch(`demo-${i}`));
};

// --- DATA PROVIDER 1: API-FOOTBALL ---
const getApiFootballHeaders = (apiKey: string) => ({
  "x-apisports-key": apiKey,
  "x-rapidapi-key": apiKey,
  "x-rapidapi-host": 'v3.football.api-sports.io'
});

const fetchApiFootballMatches = async (apiKey: string): Promise<Match[]> => {
    if (!apiKey) return [];

    // 1. Fetch List
    const listResponse = await fetch(`${API_FOOTBALL_BASE_URL}/fixtures?live=all`, {
      method: "GET",
      headers: getApiFootballHeaders(apiKey)
    });

    if (!listResponse.ok) {
      console.warn("API-Football Fetch Failed:", listResponse.status);
      return [];
    }
    const listData = await listResponse.json();
    const fixtures = listData.response || [];
    if (fixtures.length === 0) return [];

    const matches: Match[] = [];
    
    // Limit to first 5 live matches to avoid quota drain in loop for this demo
    const fixturesToProcess = fixtures.slice(0, 5); 

    for (const item of fixturesToProcess) {
       await sleep(200); // Rate limit

       let homeStatsArr: any[] = [];
       let awayStatsArr: any[] = [];

       try {
        const statsUrl = `${API_FOOTBALL_BASE_URL}/fixtures/statistics?fixture=${item.fixture.id}`;
        const statsResponse = await fetch(statsUrl, {
          method: "GET",
          headers: getApiFootballHeaders(apiKey)
        });

        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          const statsResponseArr = statsData.response; 
          if (Array.isArray(statsResponseArr) && statsResponseArr.length > 0) {
             const t1 = statsResponseArr[0];
             const t2 = statsResponseArr[1];
             if (t1 && t1.team.id === item.teams.home.id) homeStatsArr = t1.statistics;
             else if (t1) awayStatsArr = t1.statistics;
             if (t2 && t2.team.id === item.teams.home.id) homeStatsArr = t2.statistics;
             else if (t2) awayStatsArr = t2.statistics;
          }
        }
      } catch (e) { console.warn("Stats fetch fail", e) }

      const getVal = (arr: any[], type: string) => {
        const f = arr.find(x => x.type === type);
        return f ? (typeof f.value === 'string' ? parseFloat(f.value) : f.value) : null;
      };

      matches.push({
        id: String(item.fixture.id),
        league: item.league.name,
        country: item.league.country,
        homeTeam: item.teams.home.name,
        awayTeam: item.teams.away.name,
        homeLogo: item.teams.home.logo,
        awayLogo: item.teams.away.logo,
        startTime: item.fixture.timestamp * 1000,
        minute: item.fixture.status.elapsed || 0,
        status: 'Live',
        lastUpdated: Date.now(),
        stats: {
          home: {
             goals: item.goals.home || 0,
             goalsFirstHalf: item.score?.halftime?.home ?? null,
             corners: getVal(homeStatsArr, 'Corner Kicks'),
             cornersFirstHalf: null,
             shotsOnTarget: getVal(homeStatsArr, 'Shots on Goal'),
             shotsOffTarget: getVal(homeStatsArr, 'Shots off Goal'),
             attacks: getVal(homeStatsArr, 'Attacks'),
             dangerousAttacks: getVal(homeStatsArr, 'Dangerous Attacks'),
             possession: getVal(homeStatsArr, 'Ball Possession'),
             yellowCards: getVal(homeStatsArr, 'Yellow Cards'),
             redCards: getVal(homeStatsArr, 'Red Cards'),
             expectedGoals: getVal(homeStatsArr, 'expected_goals'),
          },
          away: {
             goals: item.goals.away || 0,
             goalsFirstHalf: item.score?.halftime?.away ?? null,
             corners: getVal(awayStatsArr, 'Corner Kicks'),
             cornersFirstHalf: null,
             shotsOnTarget: getVal(awayStatsArr, 'Shots on Goal'),
             shotsOffTarget: getVal(awayStatsArr, 'Shots off Goal'),
             attacks: getVal(awayStatsArr, 'Attacks'),
             dangerousAttacks: getVal(awayStatsArr, 'Dangerous Attacks'),
             possession: getVal(awayStatsArr, 'Ball Possession'),
             yellowCards: getVal(awayStatsArr, 'Yellow Cards'),
             redCards: getVal(awayStatsArr, 'Red Cards'),
             expectedGoals: getVal(awayStatsArr, 'expected_goals'),
          }
        },
        preMatch: {
          home: { avgGoalsScored: 1.5, avgGoalsConceded: 1.2, avgCorners: 5, bttsPercentage: 50, over25Percentage: 50, last5Form: 'WDLWW', ppg: 1.5, leaguePosition: 5, cleanSheetPercentage: 30, failedToScorePercentage: 10, avgFirstHalfGoalsFor: 0.5, avgSecondHalfGoalsFor: 1.0, avgFirstHalfGoalsAgainst: 0.5, avgSecondHalfGoalsAgainst: 0.7, avgTimeFirstGoalScored: 30, avgTimeFirstGoalConceded: 40 },
          away: { avgGoalsScored: 1.1, avgGoalsConceded: 1.4, avgCorners: 4, bttsPercentage: 45, over25Percentage: 40, last5Form: 'LLDWD', ppg: 1.0, leaguePosition: 12, cleanSheetPercentage: 20, failedToScorePercentage: 25, avgFirstHalfGoalsFor: 0.4, avgSecondHalfGoalsFor: 0.7, avgFirstHalfGoalsAgainst: 0.6, avgSecondHalfGoalsAgainst: 0.8, avgTimeFirstGoalScored: 45, avgTimeFirstGoalConceded: 25 }
        }
      });
    }

    return matches;
};

// --- DATA PROVIDER 2: SPORTMONKS ---
const fetchSportMonksMatches = async (apiToken: string): Promise<Match[]> => {
  if (!apiToken) return [];

  // SportMonks v3 livescores endpoint
  // Fix: Includes should be comma-separated in standard REST style for SM V3,
  // though some examples show semicolons, standard URL encoding prefers commas.
  // Also added standard headers to help with potential 4xx issues.
  try {
    const url = `${SPORTMONKS_BASE_URL}/livescores/now?api_token=${apiToken}&include=participants,scores,statistics,league.country`;
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        'Accept': 'application/json',
        // 'mode': 'cors' is default for fetch, but if server rejects it, browser throws 'Failed to fetch'
      }
    });
    
    if (!response.ok) {
      // If we get a 401/403, it's a token issue. 429 is rate limit.
      // 0 status usually means CORS block.
      console.warn(`SportMonks Error: ${response.status} ${response.statusText}`);
      throw new Error(`SportMonks API Error: ${response.status}`);
    }
    
    const json = await response.json();
    const data = json.data || [];

    return data.map((item: any) => {
      // SportMonks V3 Participant Logic
      const participants = item.participants || [];
      const homePart = participants.find((p: any) => p.meta?.location === 'home') || participants[0];
      const awayPart = participants.find((p: any) => p.meta?.location === 'away') || participants[1];
      
      if (!homePart || !awayPart) return null; 

      const stats = item.statistics || [];
      // Attempt to link stats to participants
      const homeStatsRaw = stats.find((s: any) => s.participant_id === homePart.id);
      const awayStatsRaw = stats.find((s: any) => s.participant_id === awayPart.id);

      return {
        id: String(item.id),
        league: item.league?.name || 'Unknown',
        country: item.league?.country?.name || 'World',
        homeTeam: homePart?.name || 'Home',
        awayTeam: awayPart?.name || 'Away',
        homeLogo: homePart?.image_path,
        awayLogo: awayPart?.image_path,
        startTime: item.starting_at ? new Date(item.starting_at).getTime() : Date.now(),
        minute: item.minute || 0,
        status: 'Live',
        lastUpdated: Date.now(),
        stats: {
          home: {
             goals: item.scores?.find((s:any) => s.description === 'CURRENT' && s.score_team_id === homePart.id)?.score?.goals || 0,
             goalsFirstHalf: item.scores?.find((s:any) => s.description === '1ST_HALF' && s.score_team_id === homePart.id)?.score?.goals || 0,
             corners: null, 
             cornersFirstHalf: null,
             shotsOnTarget: null,
             shotsOffTarget: null,
             attacks: null,
             dangerousAttacks: null,
             possession: 50,
             yellowCards: 0,
             redCards: 0,
             expectedGoals: null 
          },
          away: {
             goals: item.scores?.find((s:any) => s.description === 'CURRENT' && s.score_team_id === awayPart.id)?.score?.goals || 0,
             goalsFirstHalf: item.scores?.find((s:any) => s.description === '1ST_HALF' && s.score_team_id === awayPart.id)?.score?.goals || 0,
             corners: null,
             cornersFirstHalf: null,
             shotsOnTarget: null,
             shotsOffTarget: null,
             attacks: null,
             dangerousAttacks: null,
             possession: 50,
             yellowCards: 0,
             redCards: 0,
             expectedGoals: null
          }
        },
        preMatch: {
          home: { avgGoalsScored: 1.5, avgGoalsConceded: 1.2, avgCorners: 5, bttsPercentage: 50, over25Percentage: 50, last5Form: '-----', ppg: 1.5, leaguePosition: 0, cleanSheetPercentage: 30, failedToScorePercentage: 10, avgFirstHalfGoalsFor: 0.5, avgSecondHalfGoalsFor: 1.0, avgFirstHalfGoalsAgainst: 0.5, avgSecondHalfGoalsAgainst: 0.7, avgTimeFirstGoalScored: 30, avgTimeFirstGoalConceded: 40 },
          away: { avgGoalsScored: 1.1, avgGoalsConceded: 1.4, avgCorners: 4, bttsPercentage: 45, over25Percentage: 40, last5Form: '-----', ppg: 1.0, leaguePosition: 0, cleanSheetPercentage: 20, failedToScorePercentage: 25, avgFirstHalfGoalsFor: 0.4, avgSecondHalfGoalsFor: 0.7, avgFirstHalfGoalsAgainst: 0.6, avgSecondHalfGoalsAgainst: 0.8, avgTimeFirstGoalScored: 45, avgTimeFirstGoalConceded: 25 }
        }
      } as Match;
    }).filter((m: any) => m !== null) as Match[];

  } catch (e) {
    // If CORS fails or network fails, we bubble up so App can see it
    console.error("SportMonks fetch failed", e);
    throw e;
  }
};

// --- ODDS PROVIDER: THE ODDS API ---
// Matches odds to existing matches based on fuzzy string matching of Home Team
const fetchAndMergeOdds = async (currentMatches: Match[], oddsApiKey: string): Promise<Match[]> => {
  if (!oddsApiKey || currentMatches.length === 0) return currentMatches;

  try {
    // Fetch soccer odds from multiple regions to ensure coverage
    const response = await fetch(`${THE_ODDS_API_BASE_URL}?apiKey=${oddsApiKey}&regions=eu,uk,us,au&markets=h2h,totals&oddsFormat=decimal`);
    
    if (!response.ok) return currentMatches;
    const oddsData = await response.json();

    return currentMatches.map(match => {
      // Fuzzy Match Logic
      const normalize = (s: string) => s.toLowerCase().replace(/fc|cf|sc|united|city|real|inter/g, '').trim();
      
      const foundOdds = oddsData.find((o: any) => {
         const oddsHome = normalize(o.home_team);
         const matchHome = normalize(match.homeTeam);
         return oddsHome.includes(matchHome) || matchHome.includes(oddsHome);
      });

      if (foundOdds) {
        const h2h = foundOdds.bookmakers[0]?.markets.find((m: any) => m.key === 'h2h');
        const totals = foundOdds.bookmakers[0]?.markets.find((m: any) => m.key === 'totals');
        
        const newOdds: MatchOdds = {
          homeWin: h2h?.outcomes.find((x: any) => x.name === foundOdds.home_team)?.price || 0,
          awayWin: h2h?.outcomes.find((x: any) => x.name !== foundOdds.home_team && x.name !== 'Draw')?.price || 0,
          draw: h2h?.outcomes.find((x: any) => x.name === 'Draw')?.price || 0,
          over25: totals?.outcomes.find((x: any) => x.name === 'Over' && x.point === 2.5)?.price || 0,
          under25: totals?.outcomes.find((x: any) => x.name === 'Under' && x.point === 2.5)?.price || 0,
          bttsYes: 0 
        };
        
        return {
           ...match,
           stats: {
             ...match.stats,
             liveOdds: newOdds
           }
        };
      }
      return match;
    });

  } catch (e) {
    console.warn("The Odds API fetch failed", e);
    return currentMatches;
  }
};

export const fetchLiveMatches = async (settingsApiKey: string, useDemo: boolean, config: ApiSettings): Promise<Match[]> => {
  if (useDemo) {
    return new Promise(resolve => setTimeout(() => resolve(generateDemoData()), 600));
  }

  const isSportMonks = config.primaryProvider === 'sportmonks';
  
  // Choose key based on provider
  const activeKey = isSportMonks ? config.sportMonksApiKey : config.apiKey;

  // Fallback check: if active key is missing, use demo data
  if (!activeKey || activeKey.trim() === '') {
     console.warn("Missing API Key for selected provider. Switching to Demo Data.");
     return generateDemoData();
  }

  let matches: Match[] = [];

  // 1. Fetch Basic Match Data
  if (isSportMonks) {
    matches = await fetchSportMonksMatches(activeKey);
  } else {
    matches = await fetchApiFootballMatches(activeKey);
  }

  // 2. Fetch Odds (Independent Source)
  if (config.oddsApiKey && matches.length > 0) {
     matches = await fetchAndMergeOdds(matches, config.oddsApiKey);
  }

  return matches;
};
