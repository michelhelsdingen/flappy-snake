// Achievement system

export interface Achievement {
  id: string;
  name: string;
  description: string;
  emoji: string;
  unlocked: boolean;
  unlockedAt?: number;
}

const ACHIEVEMENT_DEFINITIONS: Omit<Achievement, 'unlocked' | 'unlockedAt'>[] = [
  // Score achievements
  { id: 'first_score', name: 'First Flight', description: 'Score your first point', emoji: '🐣' },
  { id: 'score_10', name: 'Getting Started', description: 'Score 10 points', emoji: '🌟' },
  { id: 'score_25', name: 'Pro Flapper', description: 'Score 25 points', emoji: '⭐' },
  { id: 'score_50', name: 'Master Flapper', description: 'Score 50 points', emoji: '🏆' },
  { id: 'score_100', name: 'Legend', description: 'Score 100 points', emoji: '👑' },

  // Coin achievements
  { id: 'first_coin', name: 'Shiny!', description: 'Collect your first coin', emoji: '🪙' },
  { id: 'coins_10', name: 'Coin Collector', description: 'Collect 10 coins in one game', emoji: '💰' },
  { id: 'coins_25', name: 'Treasure Hunter', description: 'Collect 25 coins in one game', emoji: '💎' },
  { id: 'coins_50', name: 'Moneybags', description: 'Collect 50 coins in one game', emoji: '🤑' },

  // Power-up achievements
  { id: 'first_powerup', name: 'Power Up!', description: 'Collect your first power-up', emoji: '⚡' },
  { id: 'shield_save', name: 'Close Call', description: 'Get saved by a shield', emoji: '🛡️' },
  { id: 'slowmo_master', name: 'Time Lord', description: 'Use slow-mo 5 times', emoji: '⏱️' },
  { id: 'magnet_master', name: 'Magnetic Personality', description: 'Use magnet 5 times', emoji: '🧲' },
  { id: 'all_powerups', name: 'Fully Loaded', description: 'Collect all power-up types in one game', emoji: '🎯' },

  // Special achievements
  { id: 'no_coins', name: 'Minimalist', description: 'Score 20 points without collecting coins', emoji: '🧘' },
  { id: 'speed_demon', name: 'Speed Demon', description: 'Survive for 60 seconds', emoji: '🏎️' },
  { id: 'comeback', name: 'Comeback Kid', description: 'Beat your previous high score', emoji: '🔥' },
];

class AchievementManager {
  private achievements: Map<string, Achievement> = new Map();
  private sessionPowerUps: Set<string> = new Set();
  private slowmoCount: number = 0;
  private magnetCount: number = 0;
  private shieldSaves: number = 0;

  constructor() {
    this.loadAchievements();
  }

  private loadAchievements(): void {
    const saved = localStorage.getItem('flappySnakeAchievements');
    const savedData: Record<string, { unlocked: boolean; unlockedAt?: number }> = saved ? JSON.parse(saved) : {};

    for (const def of ACHIEVEMENT_DEFINITIONS) {
      const savedAchievement = savedData[def.id];
      this.achievements.set(def.id, {
        ...def,
        unlocked: savedAchievement?.unlocked || false,
        unlockedAt: savedAchievement?.unlockedAt,
      });
    }
  }

  private saveAchievements(): void {
    const data: Record<string, { unlocked: boolean; unlockedAt?: number }> = {};
    this.achievements.forEach((achievement, id) => {
      if (achievement.unlocked) {
        data[id] = { unlocked: true, unlockedAt: achievement.unlockedAt };
      }
    });
    localStorage.setItem('flappySnakeAchievements', JSON.stringify(data));
  }

  private unlock(id: string): Achievement | null {
    const achievement = this.achievements.get(id);
    if (achievement && !achievement.unlocked) {
      achievement.unlocked = true;
      achievement.unlockedAt = Date.now();
      this.saveAchievements();
      return achievement;
    }
    return null;
  }

  // Reset session tracking (call at game start)
  startSession(): void {
    this.sessionPowerUps.clear();
  }

  // Check achievements based on current score
  checkScore(score: number, previousHighScore: number): Achievement[] {
    const unlocked: Achievement[] = [];

    if (score >= 1) {
      const a = this.unlock('first_score');
      if (a) unlocked.push(a);
    }
    if (score >= 10) {
      const a = this.unlock('score_10');
      if (a) unlocked.push(a);
    }
    if (score >= 25) {
      const a = this.unlock('score_25');
      if (a) unlocked.push(a);
    }
    if (score >= 50) {
      const a = this.unlock('score_50');
      if (a) unlocked.push(a);
    }
    if (score >= 100) {
      const a = this.unlock('score_100');
      if (a) unlocked.push(a);
    }

    // Comeback achievement
    if (score > previousHighScore && previousHighScore > 0) {
      const a = this.unlock('comeback');
      if (a) unlocked.push(a);
    }

    return unlocked;
  }

  // Check coin achievements
  checkCoins(sessionCoins: number): Achievement[] {
    const unlocked: Achievement[] = [];

    if (sessionCoins >= 1) {
      const a = this.unlock('first_coin');
      if (a) unlocked.push(a);
    }
    if (sessionCoins >= 10) {
      const a = this.unlock('coins_10');
      if (a) unlocked.push(a);
    }
    if (sessionCoins >= 25) {
      const a = this.unlock('coins_25');
      if (a) unlocked.push(a);
    }
    if (sessionCoins >= 50) {
      const a = this.unlock('coins_50');
      if (a) unlocked.push(a);
    }

    return unlocked;
  }

  // Check power-up achievements
  checkPowerUp(type: string): Achievement[] {
    const unlocked: Achievement[] = [];

    // First power-up
    if (this.sessionPowerUps.size === 0) {
      const a = this.unlock('first_powerup');
      if (a) unlocked.push(a);
    }

    this.sessionPowerUps.add(type);

    // Track usage counts
    if (type === 'slowmo') {
      this.slowmoCount++;
      if (this.slowmoCount >= 5) {
        const a = this.unlock('slowmo_master');
        if (a) unlocked.push(a);
      }
    }
    if (type === 'magnet') {
      this.magnetCount++;
      if (this.magnetCount >= 5) {
        const a = this.unlock('magnet_master');
        if (a) unlocked.push(a);
      }
    }

    // All power-ups in one game
    if (this.sessionPowerUps.has('shield') &&
        this.sessionPowerUps.has('slowmo') &&
        this.sessionPowerUps.has('magnet')) {
      const a = this.unlock('all_powerups');
      if (a) unlocked.push(a);
    }

    return unlocked;
  }

  // Shield save achievement
  checkShieldSave(): Achievement[] {
    const unlocked: Achievement[] = [];
    this.shieldSaves++;
    const a = this.unlock('shield_save');
    if (a) unlocked.push(a);
    return unlocked;
  }

  // Minimalist achievement (20 score, 0 coins)
  checkMinimalist(score: number, sessionCoins: number): Achievement[] {
    const unlocked: Achievement[] = [];
    if (score >= 20 && sessionCoins === 0) {
      const a = this.unlock('no_coins');
      if (a) unlocked.push(a);
    }
    return unlocked;
  }

  // Speed demon achievement (60 seconds survival)
  checkSurvivalTime(seconds: number): Achievement[] {
    const unlocked: Achievement[] = [];
    if (seconds >= 60) {
      const a = this.unlock('speed_demon');
      if (a) unlocked.push(a);
    }
    return unlocked;
  }

  // Get all achievements for display
  getAllAchievements(): Achievement[] {
    return Array.from(this.achievements.values());
  }

  // Get unlocked count
  getUnlockedCount(): { unlocked: number; total: number } {
    let unlocked = 0;
    this.achievements.forEach(a => { if (a.unlocked) unlocked++; });
    return { unlocked, total: this.achievements.size };
  }
}

export const achievements = new AchievementManager();
