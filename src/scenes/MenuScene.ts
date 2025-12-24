import Phaser from 'phaser';
import { GAME } from '../utils/constants';

export class MenuScene extends Phaser.Scene {
  private highScore: number = 0;

  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    this.highScore = parseInt(localStorage.getItem('flappySnakeHighScore') || '0');

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
    const title = this.add.text(GAME.WIDTH / 2, GAME.HEIGHT / 3, 'FLAPPY\nSNAKE', {
      fontSize: '48px',
      fontFamily: 'Arial Black, Arial',
      color: '#00ffcc',
      align: 'center',
    });
    title.setOrigin(0.5);
    title.setShadow(0, 0, '#00ffcc', 15, true, true);

    // Tap to start (blinking)
    const startText = this.add.text(GAME.WIDTH / 2, GAME.HEIGHT / 2 + 50, 'TAP TO START', {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: '#ffffff',
    });
    startText.setOrigin(0.5);

    this.tweens.add({
      targets: startText,
      alpha: 0.2,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });

    // High score
    if (this.highScore > 0) {
      const highScoreText = this.add.text(GAME.WIDTH / 2, GAME.HEIGHT * 0.75, `BEST: ${this.highScore}`, {
        fontSize: '18px',
        fontFamily: 'Arial',
        color: '#888888',
      });
      highScoreText.setOrigin(0.5);
    }

    // Input
    this.input.on('pointerdown', () => {
      this.scene.start('GameScene');
    });
  }
}
