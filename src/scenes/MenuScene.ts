import Phaser from 'phaser';
import { GAME } from '../utils/constants';
import { soundManager } from '../utils/sounds';
import { getLeaderboard, initLeaderboard, subscribeLiveUpdates, LeaderboardEntry } from '../utils/leaderboard';
import { skinManager, SKINS, Skin } from '../utils/skins';
import { version } from '../../package.json';

// Legacy avatars for backwards compatibility
const AVATARS = ['🎅', '🎄', '⛄', '🦌', '🎁', '❄️', '🔔', '⭐', '🕯️', '🧦'];

export class MenuScene extends Phaser.Scene {
  private playerName: string = '';
  private playerAvatar: string = '🎅';
  private nameInput!: HTMLInputElement;
  private avatarTexts: Phaser.GameObjects.Text[] = [];
  private selectedAvatarIndex: number = 0;
  private skinElements: (Phaser.GameObjects.Text | Phaser.GameObjects.Image)[] = [];
  private selectedSkinId: string = 'santa';
  private skinTooltip: Phaser.GameObjects.Container | null = null;
  private leaderboardContainer: Phaser.GameObjects.Container | null = null;
  private unsubscribeLiveUpdates: (() => void) | null = null;

  constructor() {
    super({ key: 'MenuScene' });
  }

  preload(): void {
    // Load Nyan Cat sprite for skin selector
    if (!this.textures.exists('nyancat')) {
      this.load.image('nyancat', 'assets/nyancat.png');
    }
  }

  async create(): Promise<void> {
    this.playerName = localStorage.getItem('flappySnakePlayerName') || '';

    // Load selected skin
    const selectedSkin = skinManager.getSelectedSkin();
    this.selectedSkinId = selectedSkin.id;
    this.playerAvatar = selectedSkin.emoji;

    // Backwards compatibility with old avatar system
    const legacyAvatar = localStorage.getItem('flappySnakeAvatar');
    if (legacyAvatar && !SKINS.find(s => s.emoji === legacyAvatar)) {
      this.playerAvatar = legacyAvatar;
    }

    this.selectedAvatarIndex = AVATARS.indexOf(this.playerAvatar);
    if (this.selectedAvatarIndex === -1) this.selectedAvatarIndex = 0;

    // Initialize leaderboard from API
    await initLeaderboard();

    // Snowflake background
    for (let i = 0; i < 60; i++) {
      const x = Phaser.Math.Between(0, GAME.WIDTH);
      const y = Phaser.Math.Between(0, GAME.HEIGHT);
      const snowflake = this.add.text(x, y, '❄', {
        fontSize: `${Phaser.Math.Between(8, 18)}px`,
      });
      snowflake.setAlpha(Phaser.Math.FloatBetween(0.2, 0.6));
      snowflake.setDepth(-1);

      // Falling animation
      this.tweens.add({
        targets: snowflake,
        y: GAME.HEIGHT + 20,
        x: snowflake.x + Phaser.Math.Between(-30, 30),
        duration: Phaser.Math.Between(4000, 8000),
        repeat: -1,
        onRepeat: () => {
          snowflake.y = -20;
          snowflake.x = Phaser.Math.Between(0, GAME.WIDTH);
        },
      });

      // Gentle rotation
      this.tweens.add({
        targets: snowflake,
        rotation: Phaser.Math.FloatBetween(-0.5, 0.5),
        duration: Phaser.Math.Between(2000, 4000),
        yoyo: true,
        repeat: -1,
      });
    }

    // Title with Christmas glow effect
    const title = this.add.text(GAME.WIDTH / 2, 70, '🎄 FLAPPY\nSNAKE 🎄', {
      fontSize: '36px',
      fontFamily: 'Arial Black, Arial',
      color: '#ff3333',
      align: 'center',
    });
    title.setOrigin(0.5);
    title.setShadow(0, 0, '#00ff00', 15, true, true);

    // Skins selection (replaces old avatar selector)
    this.createSkinSelector();

    // Name input label
    this.add.text(GAME.WIDTH / 2, GAME.HEIGHT / 2 - 30, 'ENTER YOUR NAME:', {
      fontSize: '14px',
      fontFamily: 'Arial',
      color: '#888888',
    }).setOrigin(0.5);

    // Create HTML input for name
    this.createNameInput();

    // Start button with Christmas style
    const startButton = this.add.text(GAME.WIDTH / 2, GAME.HEIGHT / 2 + 80, '🎁 START GAME 🎁', {
      fontSize: '22px',
      fontFamily: 'Arial Black, Arial',
      color: '#00ff00',
      backgroundColor: '#8B0000',
      padding: { x: 20, y: 10 },
    });
    startButton.setOrigin(0.5);
    startButton.setInteractive({ useHandCursor: true });

    startButton.on('pointerover', () => {
      startButton.setColor('#ffffff');
    });

    startButton.on('pointerout', () => {
      startButton.setColor('#00ff00');
    });

    startButton.on('pointerdown', () => {
      this.startGame();
    });

    // Leaderboard
    this.showLeaderboard();

    // Version number in bottom right
    const versionText = this.add.text(GAME.WIDTH - 10, GAME.HEIGHT - 10, `v${version}`, {
      fontSize: '12px',
      fontFamily: 'Arial',
      color: '#555555',
    });
    versionText.setOrigin(1, 1);

    // Cleanup on scene shutdown
    this.events.on('shutdown', () => {
      if (this.nameInput) {
        this.nameInput.remove();
      }
    });
  }

  private createSkinSelector(): void {
    const y = GAME.HEIGHT / 2 - 80;
    const allSkins = skinManager.getAllSkins();

    // Show 7 skins per row to fit all 13 skins in 2 rows
    const skinsPerRow = 7;
    const spacing = 34;

    this.add.text(GAME.WIDTH / 2, y - 35, 'CHOOSE YOUR SKIN:', {
      fontSize: '14px',
      fontFamily: 'Arial',
      color: '#888888',
    }).setOrigin(0.5);

    this.skinElements = [];

    allSkins.forEach((item, index) => {
      const row = Math.floor(index / skinsPerRow);
      const col = index % skinsPerRow;
      const rowWidth = Math.min(skinsPerRow, allSkins.length - row * skinsPerRow) * spacing;
      const startX = GAME.WIDTH / 2 - rowWidth / 2 + spacing / 2;
      const x = startX + col * spacing;
      const skinY = y + row * 40;

      // Use sprite for Nyan Cat, text for others
      let skinElement: Phaser.GameObjects.Text | Phaser.GameObjects.Image;
      const isNyanCat = item.skin.id === 'nyancat';

      if (isNyanCat && this.textures.exists('nyancat')) {
        skinElement = this.add.image(x, skinY, 'nyancat');
        skinElement.setScale(0.1);
        skinElement.setOrigin(0.5);
      } else {
        skinElement = this.add.text(x, skinY, item.skin.emoji, {
          fontSize: '24px',
        });
        skinElement.setOrigin(0.5);
      }

      if (item.unlocked) {
        skinElement.setInteractive({ useHandCursor: true });

        if (item.skin.id === this.selectedSkinId) {
          skinElement.setScale(isNyanCat ? 0.13 : 1.3);
        } else {
          skinElement.setAlpha(0.6);
        }

        skinElement.on('pointerdown', () => {
          this.selectSkin(item.skin, index);
        });

        skinElement.on('pointerover', () => {
          if (item.skin.id !== this.selectedSkinId) {
            skinElement.setAlpha(0.9);
          }
          this.showSkinTooltip(item.skin, x, skinY, true);
        });

        skinElement.on('pointerout', () => {
          if (item.skin.id !== this.selectedSkinId) {
            skinElement.setAlpha(0.6);
          }
          this.hideSkinTooltip();
        });
      } else {
        // Locked skin - show as greyed out with lock
        skinElement.setAlpha(0.3);
        skinElement.setTint(0x444444);

        skinElement.setInteractive({ useHandCursor: true });
        skinElement.on('pointerover', () => {
          this.showSkinTooltip(item.skin, x, skinY, false);
        });
        skinElement.on('pointerout', () => {
          this.hideSkinTooltip();
        });
      }

      this.skinElements.push(skinElement);
    });
  }

  private selectSkin(skin: Skin, index: number): void {
    const allSkins = skinManager.getAllSkins();

    // Deselect all
    this.skinElements.forEach((element, i) => {
      if (allSkins[i].unlocked) {
        const isNyanCat = allSkins[i].skin.id === 'nyancat';
        element.setScale(isNyanCat ? 0.1 : 1);
        element.setAlpha(0.6);
      }
    });

    // Select new
    this.selectedSkinId = skin.id;
    this.playerAvatar = skin.emoji;
    skinManager.selectSkin(skin.id);
    const isSelectedNyanCat = skin.id === 'nyancat';
    this.skinElements[index].setScale(isSelectedNyanCat ? 0.13 : 1.3);
    this.skinElements[index].setAlpha(1);

    // Play sound
    soundManager.playScore();
  }

  private showSkinTooltip(skin: Skin, x: number, y: number, unlocked: boolean): void {
    this.hideSkinTooltip();

    const container = this.add.container(x, y + 45);
    container.setDepth(100);

    const bg = this.add.rectangle(0, 0, 180, 50, 0x1a1a3e, 0.95);
    bg.setStrokeStyle(1, unlocked ? 0x00ff00 : 0xff0000);

    const nameText = this.add.text(0, -12, skin.name, {
      fontSize: '12px',
      fontFamily: 'Arial Black',
      color: unlocked ? '#00ff00' : '#ff6666',
    });
    nameText.setOrigin(0.5);

    const descText = this.add.text(0, 6, unlocked ? skin.description : `🔒 ${skin.unlockRequirement}`, {
      fontSize: '10px',
      fontFamily: 'Arial',
      color: unlocked ? '#ffffff' : '#888888',
    });
    descText.setOrigin(0.5);

    container.add([bg, nameText, descText]);
    this.skinTooltip = container;
  }

  private hideSkinTooltip(): void {
    if (this.skinTooltip) {
      this.skinTooltip.destroy();
      this.skinTooltip = null;
    }
  }

  // Legacy method for backwards compatibility
  private createAvatarSelector(): void {
    this.createSkinSelector();
  }

  private selectAvatar(index: number): void {
    // Legacy - redirect to skin selection
    const allSkins = skinManager.getAllSkins();
    if (allSkins[index] && allSkins[index].unlocked) {
      this.selectSkin(allSkins[index].skin, index);
    }
  }

  private createNameInput(): void {
    // Get canvas position
    const canvas = this.game.canvas;
    const canvasRect = canvas.getBoundingClientRect();

    // Calculate position relative to canvas
    const scaleX = canvasRect.width / GAME.WIDTH;
    const scaleY = canvasRect.height / GAME.HEIGHT;
    const inputX = canvasRect.left + (GAME.WIDTH / 2) * scaleX;
    const inputY = canvasRect.top + (GAME.HEIGHT / 2 + 10) * scaleY;

    // Create input element
    this.nameInput = document.createElement('input');
    this.nameInput.type = 'text';
    this.nameInput.placeholder = 'Your name...';
    this.nameInput.value = this.playerName;
    this.nameInput.maxLength = 15;
    this.nameInput.style.cssText = `
      position: absolute;
      left: ${inputX}px;
      top: ${inputY}px;
      transform: translate(-50%, -50%);
      width: 200px;
      padding: 10px 15px;
      font-size: 18px;
      font-family: Arial, sans-serif;
      text-align: center;
      border: 2px solid #00ff00;
      border-radius: 8px;
      background: #1a1a2e;
      color: #ffffff;
      outline: none;
      text-transform: uppercase;
    `;

    this.nameInput.addEventListener('focus', () => {
      this.nameInput.style.borderColor = '#ff00ff';
    });

    this.nameInput.addEventListener('blur', () => {
      this.nameInput.style.borderColor = '#00ff00';
    });

    this.nameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.startGame();
      }
    });

    document.body.appendChild(this.nameInput);
  }

  private showLeaderboard(): void {
    this.renderLeaderboard(getLeaderboard());

    // Subscribe to live updates
    this.unsubscribeLiveUpdates = subscribeLiveUpdates((entries) => {
      this.renderLeaderboard(entries);
    });
  }

  private renderLeaderboard(leaderboard: LeaderboardEntry[]): void {
    // Clear existing leaderboard
    if (this.leaderboardContainer) {
      this.leaderboardContainer.destroy();
    }

    this.leaderboardContainer = this.add.container(0, 0);

    if (leaderboard.length === 0) return;

    // Leaderboard title with Christmas style
    const lbTitle = this.add.text(GAME.WIDTH / 2, GAME.HEIGHT / 2 + 140, '🎄 LIVE SCORES 🎄', {
      fontSize: '14px',
      fontFamily: 'Arial Black, Arial',
      color: '#ff3333',
    });
    lbTitle.setOrigin(0.5);
    lbTitle.setShadow(0, 0, '#00ff00', 5, true, true);
    this.leaderboardContainer.add(lbTitle);

    // Live indicator
    const liveIndicator = this.add.circle(GAME.WIDTH / 2 + 80, GAME.HEIGHT / 2 + 140, 4, 0x00ff00);
    this.leaderboardContainer.add(liveIndicator);

    // Pulse animation for live indicator
    this.tweens.add({
      targets: liveIndicator,
      alpha: 0.3,
      scale: 1.3,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    // Show top 5 scores
    const top5 = leaderboard.slice(0, 5);
    top5.forEach((entry, index) => {
      const y = GAME.HEIGHT / 2 + 165 + index * 22;

      // Avatar emoji
      const avatarText = this.add.text(GAME.WIDTH / 2 - 100, y, entry.avatar || '🐍', {
        fontSize: '14px',
      });
      avatarText.setOrigin(0.5, 0.5);
      this.leaderboardContainer!.add(avatarText);

      const rankText = this.add.text(GAME.WIDTH / 2 - 80, y, `${index + 1}.`, {
        fontSize: '14px',
        fontFamily: 'Arial',
        color: index === 0 ? '#ffd700' : '#888888',
      });
      rankText.setOrigin(0, 0.5);
      this.leaderboardContainer!.add(rankText);

      const nameText = this.add.text(GAME.WIDTH / 2 - 60, y, entry.name, {
        fontSize: '14px',
        fontFamily: 'Arial',
        color: index === 0 ? '#ffd700' : '#ffffff',
      });
      nameText.setOrigin(0, 0.5);
      this.leaderboardContainer!.add(nameText);

      const scoreText = this.add.text(GAME.WIDTH / 2 + 80, y, entry.score.toString(), {
        fontSize: '14px',
        fontFamily: 'Arial',
        color: index === 0 ? '#ffd700' : '#00ff00',
      });
      scoreText.setOrigin(1, 0.5);
      this.leaderboardContainer!.add(scoreText);
    });
  }

  private startGame(): void {
    const name = this.nameInput.value.trim().toUpperCase() || 'SPELER';
    localStorage.setItem('flappySnakePlayerName', name);
    localStorage.setItem('flappySnakeAvatar', this.playerAvatar);

    // Unsubscribe from live updates
    if (this.unsubscribeLiveUpdates) {
      this.unsubscribeLiveUpdates();
      this.unsubscribeLiveUpdates = null;
    }

    soundManager.resume();
    this.nameInput.remove();
    this.scene.start('GameScene', { playerName: name, avatar: this.playerAvatar });
  }
}
