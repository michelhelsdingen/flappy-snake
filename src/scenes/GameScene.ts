import Phaser from 'phaser';
import { GAME, PHYSICS } from '../utils/constants';
import { Snake } from '../entities/Snake';
import { Pipe } from '../entities/Pipe';
import { soundManager } from '../utils/sounds';

export class GameScene extends Phaser.Scene {
  private score: number = 0;
  private scoreText!: Phaser.GameObjects.Text;
  private isGameOver: boolean = false;
  private snake!: Snake;
  private pipes: Pipe[] = [];
  private pipeTimer!: Phaser.Time.TimerEvent;
  private playerName: string = 'SPELER';

  private readonly insultTemplates: string[] = [
    '{NAME} IS GAY',
    '{NAME} IS HOMO',
    '{NAME} IS EEN SUKKEL',
    '{NAME} IS EEN TRUT',
    '{NAME} RUIKT NAAR KAAS',
    '{NAME} HEEFT GEEN VRIENDEN',
    '{NAME} IS EEN LOSER',
    '{NAME} WOONT NOG BIJ MAMA',
    '{NAME} KAN NIET FIETSEN',
    '{NAME} DRAAGT CROCS',
    '{NAME} IS BANGER DAN JIJ',
    '{NAME} SNURKT',
    '{NAME} HEEFT EEN NOKIA',
    '{NAME} EET ANANAS OP PIZZA',
    '{NAME} IS ALTIJD TE LAAT',
    '{NAME} LIEGT OVER ZIJN LENGTE',
    '{NAME} KIJKT TEMPTATION ISLAND',
    '{NAME} ZEGT "CIAO" BIJ HET AFSCHEID',
    '{NAME} HEEFT GEEN RIZZ',
    '{NAME} IS NPC ENERGY',
    '{NAME} SKIPT LEG DAY',
    '{NAME} DRINKT MELK MET IJS',
    '{NAME} HEEFT EEN FIDGET SPINNER',
    '{NAME} IS EEN MEME',
  ];

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: { playerName?: string }): void {
    this.playerName = data.playerName || localStorage.getItem('flappySnakePlayerName') || 'SPELER';
  }

  create(): void {
    this.score = 0;
    this.isGameOver = false;
    this.pipes = [];

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

    // Create snake
    this.snake = new Snake(this, 100, GAME.HEIGHT / 2);

    // Score display
    this.scoreText = this.add.text(GAME.WIDTH / 2, 50, '0', {
      fontSize: '48px',
      fontFamily: 'Arial Black, Arial',
      color: '#ffffff',
    });
    this.scoreText.setOrigin(0.5);
    this.scoreText.setDepth(100);
    this.scoreText.setShadow(0, 0, '#ffffff', 10, true, true);

    // Spawn pipes
    this.pipeTimer = this.time.addEvent({
      delay: PHYSICS.PIPE_SPAWN_INTERVAL,
      callback: this.spawnPipe,
      callbackScope: this,
      loop: true,
    });

    // First pipe after short delay
    this.time.delayedCall(1000, this.spawnPipe, [], this);

    // Input
    this.input.on('pointerdown', this.handleTap, this);
  }

  private spawnPipe(): void {
    if (this.isGameOver) return;
    const pipe = new Pipe(this, GAME.WIDTH + 30);
    this.pipes.push(pipe);
  }

  private handleTap(): void {
    soundManager.resume(); // Required for mobile audio

    if (this.isGameOver) {
      this.scene.restart();
      return;
    }
    soundManager.playFlap();
    this.snake.flap();
  }

  update(): void {
    if (this.isGameOver) return;

    this.snake.update();

    // Check bounds
    const headY = this.snake.getHeadY();
    if (headY < 0 || headY > GAME.HEIGHT) {
      this.gameOver();
      return;
    }

    // Update pipes and check collisions
    const head = this.snake.getHead();

    for (let i = this.pipes.length - 1; i >= 0; i--) {
      const pipe = this.pipes[i];
      pipe.update(PHYSICS.SCROLL_SPEED);

      // Check collision with pipes
      if (
        this.physics.overlap(head, pipe.getTopPipe()) ||
        this.physics.overlap(head, pipe.getBottomPipe())
      ) {
        this.gameOver();
        return;
      }

      // Check score zone
      if (!pipe.hasScored() && this.physics.overlap(head, pipe.getScoreZone())) {
        pipe.markScored();
        this.incrementScore();
      }

      // Remove off-screen pipes
      if (pipe.isOffScreen()) {
        pipe.destroy();
        this.pipes.splice(i, 1);
      }
    }
  }

  private gameOver(): void {
    this.isGameOver = true;
    this.physics.pause();
    this.pipeTimer.destroy();

    // Screen shake
    this.cameras.main.shake(200, 0.02);

    // Death sound
    soundManager.playDeath();

    // Save high score
    const highScore = parseInt(localStorage.getItem('flappySnakeHighScore') || '0');
    const isNewBest = this.score > highScore;
    if (isNewBest) {
      localStorage.setItem('flappySnakeHighScore', this.score.toString());
    }

    // Game over overlay
    const overlay = this.add.rectangle(GAME.WIDTH / 2, GAME.HEIGHT / 2, GAME.WIDTH, GAME.HEIGHT, 0x000000, 0.5);
    overlay.setDepth(99);

    // Game over text
    const gameOverText = this.add.text(GAME.WIDTH / 2, GAME.HEIGHT / 2 - 60, 'GAME OVER', {
      fontSize: '32px',
      fontFamily: 'Arial Black, Arial',
      color: '#ff0066',
    });
    gameOverText.setOrigin(0.5);
    gameOverText.setDepth(100);
    gameOverText.setShadow(0, 0, '#ff0066', 10, true, true);

    const finalScore = this.add.text(GAME.WIDTH / 2, GAME.HEIGHT / 2, `SCORE: ${this.score}`, {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#ffffff',
    });
    finalScore.setOrigin(0.5);
    finalScore.setDepth(100);

    if (isNewBest && this.score > 0) {
      soundManager.playNewBest();
      const newBestText = this.add.text(GAME.WIDTH / 2, GAME.HEIGHT / 2 + 35, 'NEW BEST!', {
        fontSize: '20px',
        fontFamily: 'Arial Black, Arial',
        color: '#00ffcc',
      });
      newBestText.setOrigin(0.5);
      newBestText.setDepth(100);

      this.tweens.add({
        targets: newBestText,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 300,
        yoyo: true,
        repeat: -1,
      });
    }

    const retryText = this.add.text(GAME.WIDTH / 2, GAME.HEIGHT / 2 + 80, 'TAP TO RETRY', {
      fontSize: '18px',
      fontFamily: 'Arial',
      color: '#888888',
    });
    retryText.setOrigin(0.5);
    retryText.setDepth(100);

    this.tweens.add({
      targets: retryText,
      alpha: 0.3,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });
  }

  private incrementScore(): void {
    this.score++;
    this.scoreText.setText(this.score.toString());
    this.snake.grow();

    // Score sound
    soundManager.playScore();

    // Score flash effect
    this.tweens.add({
      targets: this.scoreText,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 100,
      yoyo: true,
    });

    // Insult every 10 points
    if (this.score % 10 === 0) {
      this.showInsult();
    }
  }

  private showInsult(): void {
    const template = Phaser.Math.RND.pick(this.insultTemplates);
    const insult = template.replace('{NAME}', this.playerName);

    const insultText = this.add.text(GAME.WIDTH / 2, GAME.HEIGHT / 2, insult, {
      fontSize: '24px',
      fontFamily: 'Arial Black, Arial',
      color: '#ff00ff',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center',
      wordWrap: { width: GAME.WIDTH - 40 },
    });
    insultText.setOrigin(0.5);
    insultText.setDepth(200);
    insultText.setAlpha(0);
    insultText.setScale(0.5);
    insultText.setRotation(Phaser.Math.FloatBetween(-0.1, 0.1));

    // Animate in
    this.tweens.add({
      targets: insultText,
      alpha: 1,
      scale: 1.2,
      duration: 150,
      ease: 'Back.easeOut',
      onComplete: () => {
        // Hold and fade out
        this.tweens.add({
          targets: insultText,
          alpha: 0,
          y: insultText.y - 50,
          scale: 1.5,
          duration: 800,
          delay: 1500,
          ease: 'Power2',
          onComplete: () => {
            insultText.destroy();
          },
        });
      },
    });
  }
}
