export interface LeaderboardEntry {
  id?: number;
  name: string;
  score: number;
  avatar?: string;
  created_at?: string;
}

// API base URL - same host, different port
const API_URL = `http://${window.location.hostname}:3001/api`;

// Cache for leaderboard data
let cachedLeaderboard: LeaderboardEntry[] = [];
let cachedHighScore: number = 0;

// Fetch leaderboard from API
export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  try {
    const response = await fetch(`${API_URL}/leaderboard`);
    if (!response.ok) throw new Error('Failed to fetch leaderboard');
    cachedLeaderboard = await response.json();
    if (cachedLeaderboard.length > 0) {
      cachedHighScore = cachedLeaderboard[0].score;
    }
    return cachedLeaderboard;
  } catch (error) {
    console.error('Leaderboard fetch error:', error);
    return cachedLeaderboard;
  }
}

// Get cached leaderboard (sync)
export function getLeaderboard(): LeaderboardEntry[] {
  return cachedLeaderboard;
}

// Add score to API
export async function addScoreAsync(name: string, score: number, avatar: string = '🐍'): Promise<number> {
  try {
    const response = await fetch(`${API_URL}/scores`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, score, avatar })
    });
    if (!response.ok) throw new Error('Failed to add score');
    const result = await response.json();

    // Refresh the cache
    await fetchLeaderboard();

    return result.rank;
  } catch (error) {
    console.error('Add score error:', error);
    return 0;
  }
}

// Sync wrapper for backward compatibility
export function addScore(name: string, score: number, avatar: string = '��'): number {
  // Fire and forget - the async version will update the cache
  addScoreAsync(name, score, avatar);

  // Return estimated rank based on cached data
  const rank = cachedLeaderboard.findIndex(e => score > e.score);
  if (rank === -1) {
    return cachedLeaderboard.length < 10 ? cachedLeaderboard.length + 1 : 0;
  }
  return rank + 1;
}

// Get high score (sync from cache)
export function getHighScore(): number {
  return cachedHighScore;
}

// Fetch high score from API
export async function fetchHighScore(): Promise<number> {
  try {
    const response = await fetch(`${API_URL}/highscore`);
    if (!response.ok) throw new Error('Failed to fetch high score');
    const result = await response.json();
    cachedHighScore = result.highScore;
    return cachedHighScore;
  } catch (error) {
    console.error('High score fetch error:', error);
    return cachedHighScore;
  }
}

// Initialize - call this when the game starts
export async function initLeaderboard(): Promise<void> {
  await fetchLeaderboard();
}
