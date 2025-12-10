
import { Match, MatchStatus, PreMatchTeamStats } from '../types';
import { generateMockMatch } from '../constants';

// CONFIGURATION
const BACKEND_PROXY_URL = process.env.REACT_APP_PROXY_URL || ''; 
const API_HOST = 'v3.football.api-sports.io';
const API_BASE_URL = `https://${API_HOST}`;

// Simple in-memory cache
const preMatchCache = new Map<string, PreMatchTeamStats>();

// Helper to pause execution (throttle)
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

const generateDemoData = (): Match[] => {
  return Array.from({ length: 8 }).map((_, i) => generateMockMatch(`demo-${i}`));
};

const getStat = (statsArray: any[], type: string): number | null => {
  if (!Array.isArray(statsArray)) return null;
  const stat = statsArray.find((x: any) => x.type === type);
  if (!stat || stat.value === null) return null;
  
  if (typeof stat.value === 'number') return stat.value;
  if (typeof stat.value === 'string') {
    const clean = stat.value.replace('%', '');
    const parsed = parseFloat(clean); 
    return isNaN(parsed) ? null : parsed;
  }
  return null;
};

// Helper for headers
const getHeaders = (apiKey: string) => ({
  "x-apisports-key": apiKey,
  "x-rapidapi-key": apiKey, // Send both to be safe (some proxies use rapid header)
  "x-rapidapi-host": API_HOST
});

const getTeamStats = async (apiKey: string, teamId: number, season: number, leagueId: number): Promise<PreMatchTeamStats> => {
  const cacheKey = `${season}-${teamId}-${leagueId}`;
  if (preMatchCache.has(cacheKey)) {
    return preMatchCache.get(cacheKey)!;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/teams/statistics?season=${season}&team=${teamId}&league=${leagueId}`, {
       method: "GET",
       headers: getHeaders(apiKey)
    });

    if (response.ok) {
      const data = await response.json();
      
      // Handle API errors embedded in 200 OK responses (e.g. permission denied)
      if (data.errors && Object.keys(data.errors).length > 0) {
        console.warn(`Pre-match stats API Error for team ${teamId}:`, data.errors);
        return createNullPreMatchStats();
      }

      const stats = data.response;
      const result: PreMatchTeamStats = {
        avgGoalsScored: stats.goals?.for?.average?.total ? parseFloat(stats.goals.for.average.total) : null,
        avgGoalsConceded: stats.goals?.against?.average?.total ? parseFloat(stats.goals.against.average.total) : null,
        avgCorners: null, 
        bttsPercentage: null, 
        over25Percentage: null, 
        last5Form: stats.form ? stats.form.slice(-5) : null
      };

      preMatchCache.set(cacheKey, result);
      return result;
    }
  } catch (e) {
    console.warn("Failed to fetch pre-match stats for team " + teamId, e);
  }

  return createNullPreMatchStats();
};

const createNullPreMatchStats = (): PreMatchTeamStats => ({
  avgGoalsScored: null,
  avgGoalsConceded: null,
  avgCorners: null,
  bttsPercentage: null,
  over25Percentage: null,
  last5Form: null
});

export const fetchLiveMatches = async (userApiKey: string, useDemo: boolean): Promise<Match[]> => {
  if (useDemo) {
    return new Promise(resolve => setTimeout(() => resolve(generateDemoData()), 600));
  }

  const apiKey = userApiKey || process.env.REACT_APP_API_KEY || '';

  if (BACKEND_PROXY_URL) {
    try {
      const response = await fetch(BACKEND_PROXY_URL);
      if (!response.ok) throw new Error('Proxy Error');
      return await response.json();
    } catch (e) {
      console.error("Proxy fetch failed, falling back to direct...", e);
    }
  }

  if (!apiKey) {
    console.warn("No API Key found. Switching to Demo Mode.");
    return generateDemoData();
  }

  try {
    // 1. Fetch List
    const listResponse = await fetch(`${API_BASE_URL}/fixtures?live=all`, {
      method: "GET",
      headers: getHeaders(apiKey)
    });

    if (!listResponse.ok) {
      const errText = await listResponse.text();
      throw new Error(`API Error (${listResponse.status}): ${errText}`);
    }

    const listData = await listResponse.json();
    
    if (listData.errors && Object.keys(listData.errors).length > 0) {
       console.error("API-Football Logic Error:", listData.errors);
       throw new Error(JSON.stringify(listData.errors));
    }

    const fixtures = listData.response || [];
    if (fixtures.length === 0) return [];

    // 2. Fetch Details SEQUENTIALLY to avoid Rate Limiting (429)
    const matches: Match[] = [];
    
    // Limit to processing 15 matches max per cycle to save quota if needed, 
    // or remove slice to process all.
    const fixturesToProcess = fixtures; 

    for (const item of fixturesToProcess) {
      const matchId = item.fixture.id;
      const leagueId = item.league.id;
      const season = item.league.season;
      const homeTeamId = item.teams.home.id;
      const awayTeamId = item.teams.away.id;
      
      let homeStatsArr: any[] = [];
      let awayStatsArr: any[] = [];
      let homePre = createNullPreMatchStats();
      let awayPre = createNullPreMatchStats();

      // Delay to be kind to the API (throttling)
      await sleep(250); 

      // A. Live Stats
      try {
        const statsUrl = `${API_BASE_URL}/fixtures/statistics?fixture=${matchId}`;
        const statsResponse = await fetch(statsUrl, {
          method: "GET",
          headers: getHeaders(apiKey)
        });

        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          // API returns empty array if no stats available (common for lower leagues)
          const statsResponseArr = statsData.response; 

          if (Array.isArray(statsResponseArr) && statsResponseArr.length > 0) {
             const team1Data = statsResponseArr[0];
             const team2Data = statsResponseArr[1];

             if (team1Data && team1Data.team.id === homeTeamId) homeStatsArr = team1Data.statistics;
             else if (team1Data && team1Data.team.id === awayTeamId) awayStatsArr = team1Data.statistics;

             if (team2Data) {
               if (team2Data.team.id === homeTeamId) homeStatsArr = team2Data.statistics;
               else if (team2Data.team.id === awayTeamId) awayStatsArr = team2Data.statistics;
             }
          }
        }
      } catch (err) {
        console.warn(`Could not fetch live stats for match ${matchId}`, err);
      }

      // B. Pre-Match Stats (Cached)
      // We process these in parallel for the single match to save a bit of time
      try {
        const [h, a] = await Promise.all([
          getTeamStats(apiKey, homeTeamId, season, leagueId),
          getTeamStats(apiKey, awayTeamId, season, leagueId)
        ]);
        homePre = h;
        awayPre = a;
      } catch (e) {
        console.warn("Pre-match fetch error", e);
      }

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
        status: (item.fixture.status.short === '1H' || item.fixture.status.short === '2H') ? 'Live' : item.fixture.status.short as MatchStatus,
        lastUpdated: Date.now(),
        stats: {
          home: {
            goals: item.goals.home || 0,
            corners: getStat(homeStatsArr, 'Corner Kicks'),
            shotsOnTarget: getStat(homeStatsArr, 'Shots on Goal'),
            shotsOffTarget: getStat(homeStatsArr, 'Shots off Goal'),
            attacks: getStat(homeStatsArr, 'Attacks'),
            dangerousAttacks: getStat(homeStatsArr, 'Dangerous Attacks'),
            possession: getStat(homeStatsArr, 'Ball Possession'),
            yellowCards: getStat(homeStatsArr, 'Yellow Cards'),
            redCards: getStat(homeStatsArr, 'Red Cards'),
            expectedGoals: getStat(homeStatsArr, 'expected_goals'),
          },
          away: {
            goals: item.goals.away || 0,
            corners: getStat(awayStatsArr, 'Corner Kicks'),
            shotsOnTarget: getStat(awayStatsArr, 'Shots on Goal'),
            shotsOffTarget: getStat(awayStatsArr, 'Shots off Goal'),
            attacks: getStat(awayStatsArr, 'Attacks'),
            dangerousAttacks: getStat(awayStatsArr, 'Dangerous Attacks'),
            possession: getStat(awayStatsArr, 'Ball Possession'),
            yellowCards: getStat(awayStatsArr, 'Yellow Cards'),
            redCards: getStat(awayStatsArr, 'Red Cards'),
            expectedGoals: getStat(awayStatsArr, 'expected_goals'),
          }
        },
        preMatch: {
          home: homePre,
          away: awayPre
        }
      });
    }

    return matches;

  } catch (error) {
    console.error("Failed to fetch live matches:", error);
    throw error;
  }
};
