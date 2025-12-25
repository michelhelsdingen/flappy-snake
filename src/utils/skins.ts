// Snake skins system with unlockables

export interface Skin {
  id: string;
  emoji: string;
  name: string;
  description: string;
  unlockRequirement: string;
  unlockCondition: (stats: PlayerStats) => boolean;
  glowColor: number;
  trailColor: number;
}

export interface PlayerStats {
  highScore: number;
  totalGames: number;
  totalCoins: number;
  totalPowerUps: number;
  achievementsUnlocked: number;
}

export const SKINS: Skin[] = [
  // Default skins (always unlocked)
  {
    id: 'snake',
    emoji: '🐍',
    name: 'Classic Snake',
    description: 'The original slithery friend',
    unlockRequirement: 'Always available',
    unlockCondition: () => true,
    glowColor: 0x00ff00,
    trailColor: 0x00ff00,
  },
  {
    id: 'santa',
    emoji: '🎅',
    name: 'Santa',
    description: 'Ho ho ho!',
    unlockRequirement: 'Always available',
    unlockCondition: () => true,
    glowColor: 0xff3333,
    trailColor: 0xff0000,
  },
  // Score-based unlocks
  {
    id: 'fire',
    emoji: '🔥',
    name: 'Fire Spirit',
    description: 'Burning through pipes!',
    unlockRequirement: 'Score 25+ in a single game',
    unlockCondition: (stats) => stats.highScore >= 25,
    glowColor: 0xff6600,
    trailColor: 0xff3300,
  },
  {
    id: 'rocket',
    emoji: '🚀',
    name: 'Rocket',
    description: 'To the moon!',
    unlockRequirement: 'Score 50+ in a single game',
    unlockCondition: (stats) => stats.highScore >= 50,
    glowColor: 0x3399ff,
    trailColor: 0xff6600,
  },
  {
    id: 'star',
    emoji: '⭐',
    name: 'Superstar',
    description: 'You\'re a star!',
    unlockRequirement: 'Score 100+ in a single game',
    unlockCondition: (stats) => stats.highScore >= 100,
    glowColor: 0xffd700,
    trailColor: 0xffff00,
  },
  // Game count unlocks
  {
    id: 'ghost',
    emoji: '👻',
    name: 'Ghost',
    description: 'Boo!',
    unlockRequirement: 'Play 10 games',
    unlockCondition: (stats) => stats.totalGames >= 10,
    glowColor: 0xaaaaff,
    trailColor: 0xccccff,
  },
  {
    id: 'alien',
    emoji: '👽',
    name: 'Alien',
    description: 'From outer space',
    unlockRequirement: 'Play 25 games',
    unlockCondition: (stats) => stats.totalGames >= 25,
    glowColor: 0x00ff88,
    trailColor: 0x00ffaa,
  },
  // Coin-based unlocks
  {
    id: 'crown',
    emoji: '👑',
    name: 'Royal',
    description: 'Fit for a king',
    unlockRequirement: 'Collect 100 total coins',
    unlockCondition: (stats) => stats.totalCoins >= 100,
    glowColor: 0xffd700,
    trailColor: 0xffcc00,
  },
  {
    id: 'diamond',
    emoji: '💎',
    name: 'Diamond',
    description: 'Precious flyer',
    unlockRequirement: 'Collect 500 total coins',
    unlockCondition: (stats) => stats.totalCoins >= 500,
    glowColor: 0x00ffff,
    trailColor: 0x88ffff,
  },
  // Power-up based unlocks
  {
    id: 'unicorn',
    emoji: '🦄',
    name: 'Unicorn',
    description: 'Magical creature',
    unlockRequirement: 'Collect 20 power-ups',
    unlockCondition: (stats) => stats.totalPowerUps >= 20,
    glowColor: 0xff88ff,
    trailColor: 0xffaaff,
  },
  // Achievement based unlocks
  {
    id: 'dragon',
    emoji: '🐉',
    name: 'Dragon',
    description: 'Legendary beast',
    unlockRequirement: 'Unlock 10 achievements',
    unlockCondition: (stats) => stats.achievementsUnlocked >= 10,
    glowColor: 0xff0000,
    trailColor: 0xff6600,
  },
  {
    id: 'rainbow',
    emoji: '🌈',
    name: 'Rainbow',
    description: 'All the colors!',
    unlockRequirement: 'Unlock all achievements',
    unlockCondition: (stats) => stats.achievementsUnlocked >= 20,
    glowColor: 0xff00ff,
    trailColor: 0x00ffff,
  },
];

class SkinManager {
  private selectedSkinId: string = 'santa';
  private stats: PlayerStats = {
    highScore: 0,
    totalGames: 0,
    totalCoins: 0,
    totalPowerUps: 0,
    achievementsUnlocked: 0,
  };

  constructor() {
    this.loadStats();
    this.selectedSkinId = localStorage.getItem('selectedSkin') || 'santa';
  }

  private loadStats(): void {
    const saved = localStorage.getItem('playerStats');
    if (saved) {
      try {
        this.stats = { ...this.stats, ...JSON.parse(saved) };
      } catch {
        // Ignore parse errors
      }
    }
  }

  private saveStats(): void {
    localStorage.setItem('playerStats', JSON.stringify(this.stats));
  }

  updateStats(update: Partial<PlayerStats>): void {
    if (update.highScore !== undefined && update.highScore > this.stats.highScore) {
      this.stats.highScore = update.highScore;
    }
    if (update.totalGames !== undefined) {
      this.stats.totalGames += update.totalGames;
    }
    if (update.totalCoins !== undefined) {
      this.stats.totalCoins += update.totalCoins;
    }
    if (update.totalPowerUps !== undefined) {
      this.stats.totalPowerUps += update.totalPowerUps;
    }
    if (update.achievementsUnlocked !== undefined) {
      this.stats.achievementsUnlocked = update.achievementsUnlocked;
    }
    this.saveStats();
  }

  getStats(): PlayerStats {
    return { ...this.stats };
  }

  getUnlockedSkins(): Skin[] {
    return SKINS.filter(skin => skin.unlockCondition(this.stats));
  }

  getAllSkins(): { skin: Skin; unlocked: boolean }[] {
    return SKINS.map(skin => ({
      skin,
      unlocked: skin.unlockCondition(this.stats),
    }));
  }

  getSelectedSkin(): Skin {
    const skin = SKINS.find(s => s.id === this.selectedSkinId);
    if (skin && skin.unlockCondition(this.stats)) {
      return skin;
    }
    // Fall back to default if selected skin is locked
    return SKINS[0];
  }

  selectSkin(skinId: string): boolean {
    const skin = SKINS.find(s => s.id === skinId);
    if (skin && skin.unlockCondition(this.stats)) {
      this.selectedSkinId = skinId;
      localStorage.setItem('selectedSkin', skinId);
      return true;
    }
    return false;
  }

  getNewlyUnlockedSkins(previousStats: PlayerStats): Skin[] {
    return SKINS.filter(skin =>
      skin.unlockCondition(this.stats) && !skin.unlockCondition(previousStats)
    );
  }
}

export const skinManager = new SkinManager();
