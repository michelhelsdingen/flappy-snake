// Live presence system for showing active players

const API_URL = 'https://flappy-snake-api.michel-91a.workers.dev/api';

export interface ActivePlayer {
  id: string;
  name: string;
  avatar: string;
  score: number;
  lastSeen: number;
}

// Local player ID (persisted in localStorage)
let playerId: string | null = null;

function getPlayerId(): string {
  if (!playerId) {
    playerId = localStorage.getItem('flappySnakePlayerId');
    if (!playerId) {
      playerId = 'p_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('flappySnakePlayerId', playerId);
    }
  }
  return playerId;
}

// Send heartbeat to server
export async function sendHeartbeat(name: string, avatar: string, score: number): Promise<void> {
  try {
    await fetch(`${API_URL}/presence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: getPlayerId(),
        name,
        avatar,
        score,
      }),
    });
  } catch (error) {
    // Silently fail - don't interrupt gameplay
  }
}

// Remove player from presence (when game ends)
export async function removePresence(): Promise<void> {
  try {
    await fetch(`${API_URL}/presence/${getPlayerId()}`, {
      method: 'DELETE',
    });
  } catch (error) {
    // Silently fail
  }
}

// Get active players
export async function getActivePlayers(): Promise<ActivePlayer[]> {
  try {
    const response = await fetch(`${API_URL}/presence`);
    if (!response.ok) return [];
    const players: ActivePlayer[] = await response.json();
    // Filter out self
    return players.filter(p => p.id !== getPlayerId());
  } catch (error) {
    return [];
  }
}

// Presence manager for game scene
export class PresenceManager {
  private heartbeatInterval: number | null = null;
  private pollInterval: number | null = null;
  private callbacks: ((players: ActivePlayer[]) => void)[] = [];
  private name: string = '';
  private avatar: string = '';
  private score: number = 0;

  start(name: string, avatar: string): void {
    this.name = name;
    this.avatar = avatar;
    this.score = 0;

    // Send heartbeat every 2.5 seconds
    this.heartbeatInterval = window.setInterval(() => {
      sendHeartbeat(this.name, this.avatar, this.score);
    }, 2500);

    // Initial heartbeat
    sendHeartbeat(this.name, this.avatar, this.score);

    // Poll for active players every 3 seconds
    this.pollInterval = window.setInterval(async () => {
      const players = await getActivePlayers();
      this.callbacks.forEach(cb => cb(players));
    }, 3000);

    // Initial poll
    getActivePlayers().then(players => {
      this.callbacks.forEach(cb => cb(players));
    });
  }

  updateScore(score: number): void {
    this.score = score;
  }

  subscribe(callback: (players: ActivePlayer[]) => void): () => void {
    this.callbacks.push(callback);
    return () => {
      this.callbacks = this.callbacks.filter(cb => cb !== callback);
    };
  }

  stop(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.callbacks = [];
    removePresence();
  }
}

export const presenceManager = new PresenceManager();
