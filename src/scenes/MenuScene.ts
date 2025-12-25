import Phaser from 'phaser';
import { GAME } from '../utils/constants';
import { soundManager } from '../utils/sounds';
import { getLeaderboard, initLeaderboard } from '../utils/leaderboard';
import { version } from '../../package.json';

const AVATARS = ['🎅', '🎄', '⛄', '🦌', '🎁', '❄️', '🔔', '⭐', '🕯️', '🧦'];

export class MenuScene extends Phaser.Scene {
  private playerName: string = '';
  private playerAvatar: string = '🎅';
  private nameInput!: HTMLInputElement;
  private avatarTexts: Phaser.GameObjects.Text[] = [];
  private selectedAvatarIndex: number = 0;

  constructor() {
    super({ key: 'MenuScene' });
  }

  async create(): Promise<void> {
    this.playerName = localStorage.getItem('flappySnakePlayerName') || '';
    this.playerAvatar = localStorage.getItem('flappySnakeAvatar') || '🎅';
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

    // Avatar selection
    this.createAvatarSelector();

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

  private createAvatarSelector(): void {
    const y = GAME.HEIGHT / 2 - 80;
    const startX = GAME.WIDTH / 2 - (AVATARS.length * 28) / 2;

    this.add.text(GAME.WIDTH / 2, y - 25, 'CHOOSE YOUR AVATAR:', {
      fontSize: '14px',
      fontFamily: 'Arial',
      color: '#888888',
    }).setOrigin(0.5);

    this.avatarTexts = [];

    AVATARS.forEach((avatar, index) => {
      const x = startX + index * 28;
      const avatarText = this.add.text(x, y, avatar, {
        fontSize: '24px',
      });
      avatarText.setOrigin(0.5);
      avatarText.setInteractive({ useHandCursor: true });

      if (index === this.selectedAvatarIndex) {
        avatarText.setScale(1.3);
      } else {
        avatarText.setAlpha(0.5);
      }

      avatarText.on('pointerdown', () => {
        this.selectAvatar(index);
      });

      avatarText.on('pointerover', () => {
        if (index !== this.selectedAvatarIndex) {
          avatarText.setAlpha(0.8);
        }
      });

      avatarText.on('pointerout', () => {
        if (index !== this.selectedAvatarIndex) {
          avatarText.setAlpha(0.5);
        }
      });

      this.avatarTexts.push(avatarText);
    });
  }

  private selectAvatar(index: number): void {
    // Deselect previous
    if (this.avatarTexts[this.selectedAvatarIndex]) {
      this.avatarTexts[this.selectedAvatarIndex].setScale(1);
      this.avatarTexts[this.selectedAvatarIndex].setAlpha(0.5);
    }

    // Select new
    this.selectedAvatarIndex = index;
    this.playerAvatar = AVATARS[index];
    this.avatarTexts[index].setScale(1.3);
    this.avatarTexts[index].setAlpha(1);

    // Play sound
    soundManager.playScore();
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
    const leaderboard = getLeaderboard();
    if (leaderboard.length === 0) return;

    // Leaderboard title with Christmas style
    const lbTitle = this.add.text(GAME.WIDTH / 2, GAME.HEIGHT / 2 + 140, '🎄 TOP SCORES 🎄', {
      fontSize: '14px',
      fontFamily: 'Arial Black, Arial',
      color: '#ff3333',
    });
    lbTitle.setOrigin(0.5);
    lbTitle.setShadow(0, 0, '#00ff00', 5, true, true);

    // Show top 5 scores
    const top5 = leaderboard.slice(0, 5);
    top5.forEach((entry, index) => {
      const y = GAME.HEIGHT / 2 + 165 + index * 22;

      // Avatar emoji
      const avatarText = this.add.text(GAME.WIDTH / 2 - 100, y, entry.avatar || '🐍', {
        fontSize: '14px',
      });
      avatarText.setOrigin(0.5, 0.5);

      const rankText = this.add.text(GAME.WIDTH / 2 - 80, y, `${index + 1}.`, {
        fontSize: '14px',
        fontFamily: 'Arial',
        color: index === 0 ? '#ffd700' : '#888888',
      });
      rankText.setOrigin(0, 0.5);

      const nameText = this.add.text(GAME.WIDTH / 2 - 60, y, entry.name, {
        fontSize: '14px',
        fontFamily: 'Arial',
        color: index === 0 ? '#ffd700' : '#ffffff',
      });
      nameText.setOrigin(0, 0.5);

      const scoreText = this.add.text(GAME.WIDTH / 2 + 80, y, entry.score.toString(), {
        fontSize: '14px',
        fontFamily: 'Arial',
        color: index === 0 ? '#ffd700' : '#00ff00',
      });
      scoreText.setOrigin(1, 0.5);
    });
  }

  private startGame(): void {
    const name = this.nameInput.value.trim().toUpperCase() || 'SPELER';
    localStorage.setItem('flappySnakePlayerName', name);
    localStorage.setItem('flappySnakeAvatar', this.playerAvatar);

    soundManager.resume();
    this.nameInput.remove();
    this.scene.start('GameScene', { playerName: name, avatar: this.playerAvatar });
  }
}
