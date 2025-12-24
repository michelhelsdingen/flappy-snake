import Phaser from 'phaser';
import { GAME } from '../utils/constants';
import { soundManager } from '../utils/sounds';

export class MenuScene extends Phaser.Scene {
  private highScore: number = 0;
  private playerName: string = '';
  private nameInput!: HTMLInputElement;

  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    this.highScore = parseInt(localStorage.getItem('flappySnakeHighScore') || '0');
    this.playerName = localStorage.getItem('flappySnakePlayerName') || '';

    // Starfield background
    for (let i = 0; i < 50; i++) {
      const x = Phaser.Math.Between(0, GAME.WIDTH);
      const y = Phaser.Math.Between(0, GAME.HEIGHT);
      const size = Phaser.Math.Between(1, 3);
      const star = this.add.circle(x, y, size, 0xffffff, Phaser.Math.FloatBetween(0.1, 0.5));
      star.setDepth(-1);

      this.tweens.add({
        targets: star,
        alpha: Phaser.Math.FloatBetween(0.1, 0.3),
        duration: Phaser.Math.Between(1000, 3000),
        yoyo: true,
        repeat: -1,
      });
    }

    // Title with glow effect
    const title = this.add.text(GAME.WIDTH / 2, 80, 'FLAPPY\nSNAKE', {
      fontSize: '42px',
      fontFamily: 'Arial Black, Arial',
      color: '#00ffcc',
      align: 'center',
    });
    title.setOrigin(0.5);
    title.setShadow(0, 0, '#00ffcc', 15, true, true);

    // Name input label
    this.add.text(GAME.WIDTH / 2, GAME.HEIGHT / 2 - 60, 'ENTER YOUR NAME:', {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#888888',
    }).setOrigin(0.5);

    // Create HTML input for name
    this.createNameInput();

    // Start button
    const startButton = this.add.text(GAME.WIDTH / 2, GAME.HEIGHT / 2 + 60, 'START GAME', {
      fontSize: '24px',
      fontFamily: 'Arial Black, Arial',
      color: '#00ffcc',
      backgroundColor: '#1a1a2e',
      padding: { x: 20, y: 10 },
    });
    startButton.setOrigin(0.5);
    startButton.setInteractive({ useHandCursor: true });

    startButton.on('pointerover', () => {
      startButton.setColor('#ffffff');
    });

    startButton.on('pointerout', () => {
      startButton.setColor('#00ffcc');
    });

    startButton.on('pointerdown', () => {
      this.startGame();
    });

    // High score
    if (this.highScore > 0) {
      const highScoreText = this.add.text(GAME.WIDTH / 2, GAME.HEIGHT - 80, `BEST: ${this.highScore}`, {
        fontSize: '18px',
        fontFamily: 'Arial',
        color: '#888888',
      });
      highScoreText.setOrigin(0.5);
    }

    // Cleanup on scene shutdown
    this.events.on('shutdown', () => {
      if (this.nameInput) {
        this.nameInput.remove();
      }
    });
  }

  private createNameInput(): void {
    // Get canvas position
    const canvas = this.game.canvas;
    const canvasRect = canvas.getBoundingClientRect();

    // Calculate position relative to canvas
    const scaleX = canvasRect.width / GAME.WIDTH;
    const scaleY = canvasRect.height / GAME.HEIGHT;
    const inputX = canvasRect.left + (GAME.WIDTH / 2) * scaleX;
    const inputY = canvasRect.top + (GAME.HEIGHT / 2 - 10) * scaleY;

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
      border: 2px solid #00ffcc;
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
      this.nameInput.style.borderColor = '#00ffcc';
    });

    this.nameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.startGame();
      }
    });

    document.body.appendChild(this.nameInput);
  }

  private startGame(): void {
    const name = this.nameInput.value.trim().toUpperCase() || 'SPELER';
    localStorage.setItem('flappySnakePlayerName', name);

    soundManager.resume();
    this.nameInput.remove();
    this.scene.start('GameScene', { playerName: name });
  }
}
