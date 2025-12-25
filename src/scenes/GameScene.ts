import Phaser from 'phaser';
import { GAME, PHYSICS } from '../utils/constants';
import { Player } from '../entities/Player';
import { Pipe } from '../entities/Pipe';
import { Coin } from '../entities/Coin';
import { Gift } from '../entities/Gift';
import { PowerUp, PowerUpType } from '../entities/PowerUp';
import { soundManager } from '../utils/sounds';
import { haptics } from '../utils/haptics';
import { achievements, Achievement } from '../utils/achievements';
import { addScore, getLeaderboard, getHighScore, fetchLeaderboard } from '../utils/leaderboard';

export class GameScene extends Phaser.Scene {
  private score: number = 0;
  private coins: number = 0;
  private scoreText!: Phaser.GameObjects.Text;
  private coinText!: Phaser.GameObjects.Text;
  private isGameOver: boolean = false;
  private player!: Player;
  private pipes: Pipe[] = [];
  private coinEntities: Coin[] = [];
  private giftEntities: Gift[] = [];
  private powerUpEntities: PowerUp[] = [];
  private pipeTimer!: Phaser.Time.TimerEvent;
  private coinTimer!: Phaser.Time.TimerEvent;
  private giftTimer!: Phaser.Time.TimerEvent;
  private powerUpTimer!: Phaser.Time.TimerEvent;
  private playerName: string = 'SPELER';
  private playerAvatar: string = '🐍';
  private backgroundStars: Phaser.GameObjects.Arc[] = [];
  private nebulae: Phaser.GameObjects.Ellipse[] = [];
  private snowflakes: Phaser.GameObjects.Text[] = [];
  private startTime: number = 0;
  private previousHighScore: number = 0;

  // Power-up state
  private hasShield: boolean = false;
  private shieldVisual: Phaser.GameObjects.Arc | null = null;
  private isInvincible: boolean = false;
  private isSlowMo: boolean = false;
  private hasMagnet: boolean = false;
  private magnetRange: number = 150;
  private powerUpIndicators: Map<PowerUpType, Phaser.GameObjects.Container> = new Map();
  private currentScrollSpeed: number = PHYSICS.SCROLL_SPEED;

  private readonly motivationTemplates: string[] = [
    'BIJNA {NAME}! VOLGENDE KEER BETER!',
    'JE BENT GOED BEZIG {NAME}!',
    '{NAME} GEEFT NOOIT OP!',
    'DAT WAS DICHTBIJ {NAME}!',
    'KEEP GOING {NAME}!',
    '{NAME} IS EEN HELD!',
    'NICE TRY {NAME}!',
    '{NAME} KAN DIT!',
    'JE GROEIT {NAME}!',
    'OEFENING BAART KUNST {NAME}!',
    '{NAME} GAAT DIT HALEN!',
    'NIET OPGEVEN {NAME}!',
    'TOP SCORE KOMT ERAAN {NAME}!',
    '{NAME} IS ON FIRE!',
    'GEWELDIGE POGING {NAME}!',
    '{NAME} WORDT STEEDS BETER!',
    'DAT WAS SICK {NAME}!',
    'GO {NAME} GO!',
    '{NAME} IS EEN LEGEND!',
    'NEXT LEVEL {NAME}!',
    '{NAME} MAAKT PROGRESS!',
    'LEKKER BEZIG {NAME}!',
    '{NAME} IS UNSTOPPABLE!',
    'YOU GOT THIS {NAME}!',
  ];

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: { playerName?: string; avatar?: string }): void {
    this.playerName = data.playerName || localStorage.getItem('flappySnakePlayerName') || 'SPELER';
    this.playerAvatar = data.avatar || localStorage.getItem('flappySnakeAvatar') || '🐍';
  }

  create(): void {
    this.score = 0;
    this.coins = 0;
    this.isGameOver = false;
    this.pipes = [];
    this.coinEntities = [];
    this.giftEntities = [];
    this.powerUpEntities = [];
    this.hasShield = false;
    this.isInvincible = false;
    this.isSlowMo = false;
    this.hasMagnet = false;
    this.currentScrollSpeed = PHYSICS.SCROLL_SPEED;
    this.startTime = Date.now();
    this.previousHighScore = getHighScore();
    this.powerUpIndicators.clear();
    this.backgroundStars = [];
    this.nebulae = [];
    this.snowflakes = [];

    // Resume physics (in case it was paused from previous game)
    this.physics.resume();

    // Start achievement session
    achievements.startSession();

    // Create layered background
    this.createBackground();

    // Create player
    this.player = new Player(this, 100, GAME.HEIGHT / 2, this.playerAvatar);

    // Score display with glow
    this.scoreText = this.add.text(GAME.WIDTH / 2, 50, '0', {
      fontSize: '64px',
      fontFamily: 'Arial Black, Arial',
      color: '#ffffff',
    });
    this.scoreText.setOrigin(0.5);
    this.scoreText.setDepth(100);
    this.scoreText.setShadow(0, 0, '#00ffcc', 20, true, true);

    // Coin counter (top left)
    const coinIcon = this.add.text(15, 15, '🪙', { fontSize: '24px' });
    coinIcon.setDepth(100);
    this.coinText = this.add.text(45, 15, '0', {
      fontSize: '20px',
      fontFamily: 'Arial Black, Arial',
      color: '#ffd700',
    });
    this.coinText.setDepth(100);
    this.coinText.setShadow(0, 0, '#ffd700', 8, true, true);

    // High score display from leaderboard
    const highScore = getHighScore();
    if (highScore > 0) {
      const highScoreText = this.add.text(GAME.WIDTH - 10, 10, `BEST: ${highScore}`, {
        fontSize: '18px',
        fontFamily: 'Arial Black, Arial',
        color: '#00ffcc',
      });
      highScoreText.setOrigin(1, 0);
      highScoreText.setDepth(100);
      highScoreText.setShadow(0, 0, '#00ffcc', 10, true, true);
    }

    // Spawn pipes
    this.pipeTimer = this.time.addEvent({
      delay: PHYSICS.PIPE_SPAWN_INTERVAL,
      callback: this.spawnPipe,
      callbackScope: this,
      loop: true,
    });

    // Spawn coins
    this.coinTimer = this.time.addEvent({
      delay: 800,
      callback: this.spawnCoin,
      callbackScope: this,
      loop: true,
    });

    // Spawn Christmas gifts (less frequent than coins, more valuable)
    this.giftTimer = this.time.addEvent({
      delay: 5000,
      callback: this.spawnGift,
      callbackScope: this,
      loop: true,
    });

    // Spawn power-ups
    this.powerUpTimer = this.time.addEvent({
      delay: 8000,
      callback: this.spawnPowerUp,
      callbackScope: this,
      loop: true,
    });

    // First pipe after short delay
    this.time.delayedCall(1000, this.spawnPipe, [], this);

    // Input
    this.input.on('pointerdown', this.handleTap, this);
  }

  private createBackground(): void {
    // Dark winter night background
    const bg = this.add.rectangle(GAME.WIDTH / 2, GAME.HEIGHT / 2, GAME.WIDTH, GAME.HEIGHT, 0x0a1a2a);
    bg.setDepth(-10);

    // Winter aurora clouds (Christmas colors)
    const nebulaColors = [0x2a5a3a, 0x5a2a2a, 0x3a2a5a, 0x1a5a4a];
    for (let i = 0; i < 4; i++) {
      const nebula = this.add.ellipse(
        Phaser.Math.Between(0, GAME.WIDTH),
        Phaser.Math.Between(0, GAME.HEIGHT),
        Phaser.Math.Between(200, 400),
        Phaser.Math.Between(100, 200),
        nebulaColors[i],
        0.15
      );
      nebula.setDepth(-8);
      this.nebulae.push(nebula);

      // Slow drift animation
      this.tweens.add({
        targets: nebula,
        x: nebula.x + Phaser.Math.Between(-50, 50),
        y: nebula.y + Phaser.Math.Between(-30, 30),
        alpha: Phaser.Math.FloatBetween(0.1, 0.2),
        duration: Phaser.Math.Between(8000, 15000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    // Falling snowflakes
    for (let i = 0; i < 40; i++) {
      const x = Phaser.Math.Between(0, GAME.WIDTH);
      const y = Phaser.Math.Between(-50, GAME.HEIGHT);
      const snowflake = this.add.text(x, y, '❄', {
        fontSize: `${Phaser.Math.Between(10, 20)}px`,
      });
      snowflake.setAlpha(Phaser.Math.FloatBetween(0.3, 0.7));
      snowflake.setDepth(-3);
      this.snowflakes.push(snowflake);
    }

    // Distant stars (small, dim) - like Christmas lights
    for (let i = 0; i < 30; i++) {
      const x = Phaser.Math.Between(0, GAME.WIDTH);
      const y = Phaser.Math.Between(0, GAME.HEIGHT);
      const colors = [0xff0000, 0x00ff00, 0xffd700, 0xffffff];
      const star = this.add.circle(x, y, 1, Phaser.Math.RND.pick(colors), Phaser.Math.FloatBetween(0.1, 0.3));
      star.setDepth(-7);
      this.backgroundStars.push(star);
    }

    // Medium Christmas lights
    for (let i = 0; i < 20; i++) {
      const x = Phaser.Math.Between(0, GAME.WIDTH);
      const y = Phaser.Math.Between(0, GAME.HEIGHT);
      const colors = [0xff0000, 0x00ff00, 0xffd700];
      const star = this.add.circle(x, y, 2, Phaser.Math.RND.pick(colors), Phaser.Math.FloatBetween(0.2, 0.5));
      star.setDepth(-6);
      this.backgroundStars.push(star);

      // Twinkle
      this.tweens.add({
        targets: star,
        alpha: Phaser.Math.FloatBetween(0.1, 0.3),
        duration: Phaser.Math.Between(500, 1500),
        yoyo: true,
        repeat: -1,
      });
    }

    // Bright stars with Christmas glow
    for (let i = 0; i < 8; i++) {
      const x = Phaser.Math.Between(0, GAME.WIDTH);
      const y = Phaser.Math.Between(0, GAME.HEIGHT);

      // Star with glow - Christmas green or red
      const glowColor = Phaser.Math.Between(0, 1) === 0 ? 0x00ff00 : 0xff0000;
      const glow = this.add.circle(x, y, 6, glowColor, 0.2);
      glow.setDepth(-5);

      const star = this.add.circle(x, y, 3, 0xffffff, 0.9);
      star.setDepth(-5);
      this.backgroundStars.push(star);

      // Pulse glow
      this.tweens.add({
        targets: glow,
        scaleX: 1.5,
        scaleY: 1.5,
        alpha: 0.05,
        duration: Phaser.Math.Between(2000, 4000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    // Shooting star occasionally (now with Christmas sparkle)
    this.time.addEvent({
      delay: 5000,
      callback: this.createShootingStar,
      callbackScope: this,
      loop: true,
    });
  }

  private createShootingStar(): void {
    if (Phaser.Math.Between(0, 100) > 30) return; // 30% chance

    const startX = Phaser.Math.Between(GAME.WIDTH * 0.3, GAME.WIDTH);
    const startY = Phaser.Math.Between(0, GAME.HEIGHT * 0.5);

    const star = this.add.circle(startX, startY, 2, 0xffffff, 1);
    star.setDepth(-4);

    // Trail
    const trail = this.add.rectangle(startX, startY, 30, 2, 0xffffff, 0.5);
    trail.setOrigin(1, 0.5);
    trail.setDepth(-4);

    this.tweens.add({
      targets: [star, trail],
      x: startX - 200,
      y: startY + 100,
      alpha: 0,
      duration: 800,
      ease: 'Quad.easeIn',
      onComplete: () => {
        star.destroy();
        trail.destroy();
      },
    });
  }

  private spawnPipe(): void {
    if (this.isGameOver) return;
    const pipe = new Pipe(this, GAME.WIDTH + 50);
    this.pipes.push(pipe);
  }

  private spawnCoin(): void {
    if (this.isGameOver) return;
    if (Phaser.Math.Between(0, 100) > 60) return; // 60% chance

    const x = GAME.WIDTH + 30;
    const y = Phaser.Math.Between(80, GAME.HEIGHT - 80);

    // 10% chance for diamond (worth 5)
    const value = Phaser.Math.Between(0, 100) < 10 ? 5 : 1;
    const coin = new Coin(this, x, y, value);
    this.coinEntities.push(coin);
  }

  private spawnGift(): void {
    if (this.isGameOver) return;
    if (Phaser.Math.Between(0, 100) > 40) return; // 40% chance when timer fires

    const x = GAME.WIDTH + 40;
    const y = Phaser.Math.Between(100, GAME.HEIGHT - 100);

    const gift = new Gift(this, x, y);
    this.giftEntities.push(gift);
  }

  private spawnPowerUp(): void {
    if (this.isGameOver) return;
    if (Phaser.Math.Between(0, 100) > 30) return; // 30% chance

    const x = GAME.WIDTH + 30;
    const y = Phaser.Math.Between(100, GAME.HEIGHT - 100);

    const types: PowerUpType[] = ['shield', 'slowmo', 'magnet'];
    const type = Phaser.Math.RND.pick(types);

    const powerUp = new PowerUp(this, x, y, type);
    this.powerUpEntities.push(powerUp);
  }

  private handleTap(): void {
    soundManager.resume();

    if (this.isGameOver) {
      this.scene.restart();
      return;
    }
    soundManager.playFlap();

    // Call flap with error handling for iOS debugging
    try {
      haptics.lightTap();
    } catch (e) {
      // Ignore haptics errors
    }

    try {
      this.player.flap();
    } catch (e) {
      console.error('Flap error:', e);
    }
  }

  update(): void {
    if (this.isGameOver) return;

    this.player.update();

    // Update shield visual position
    if (this.shieldVisual) {
      const hitbox = this.player.getHitbox();
      this.shieldVisual.x = hitbox.x;
      this.shieldVisual.y = hitbox.y;
    }

    // Parallax background movement
    this.backgroundStars.forEach((star, i) => {
      star.x -= 0.2 + (i % 3) * 0.1;
      if (star.x < -10) {
        star.x = GAME.WIDTH + 10;
        star.y = Phaser.Math.Between(0, GAME.HEIGHT);
      }
    });

    // Snowflake falling animation
    this.snowflakes.forEach((snowflake) => {
      snowflake.y += 0.5 + Math.sin(snowflake.x * 0.01) * 0.3;
      snowflake.x -= 0.3;
      if (snowflake.y > GAME.HEIGHT + 20) {
        snowflake.y = -20;
        snowflake.x = Phaser.Math.Between(0, GAME.WIDTH);
      }
      if (snowflake.x < -20) {
        snowflake.x = GAME.WIDTH + 20;
      }
    });

    // Check bounds
    const headY = this.player.getY();
    if (headY < -20 || headY > GAME.HEIGHT + 20) {
      this.gameOver();
      return;
    }

    // Update pipes and check collisions
    const hitbox = this.player.getHitbox();

    for (let i = this.pipes.length - 1; i >= 0; i--) {
      const pipe = this.pipes[i];
      pipe.update(this.currentScrollSpeed);

      // Check collision with pipes
      if (
        this.physics.overlap(hitbox, pipe.getTopPipe()) ||
        this.physics.overlap(hitbox, pipe.getBottomPipe())
      ) {
        if (this.isInvincible) {
          // Still invincible from shield break, ignore collision
        } else if (this.hasShield) {
          this.useShield();
        } else {
          this.gameOver();
          return;
        }
      }

      // Check score zone
      if (!pipe.hasScored() && this.physics.overlap(hitbox, pipe.getScoreZone())) {
        pipe.markScored();
        this.incrementScore();
      }

      // Remove off-screen pipes
      if (pipe.isOffScreen()) {
        pipe.destroy();
        this.pipes.splice(i, 1);
      }
    }

    // Update coins
    for (let i = this.coinEntities.length - 1; i >= 0; i--) {
      const coin = this.coinEntities[i];
      coin.update(this.currentScrollSpeed);

      // Magnet effect
      if (this.hasMagnet && !coin.isCollected()) {
        const coinHitbox = coin.getHitbox();
        const dx = hitbox.x - coinHitbox.x;
        const dy = hitbox.y - coinHitbox.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < this.magnetRange && dist > 0) {
          const force = (this.magnetRange - dist) / this.magnetRange;
          coinHitbox.x += dx * force * 0.1;
          coinHitbox.y += dy * force * 0.1;
        }
      }

      // Check coin collection
      if (!coin.isCollected() && this.physics.overlap(hitbox, coin.getHitbox())) {
        const value = coin.collect();
        this.collectCoin(value);
      }

      // Remove off-screen or collected coins
      if (coin.isOffScreen() || coin.isCollected()) {
        if (!coin.isCollected()) coin.destroy();
        this.coinEntities.splice(i, 1);
      }
    }

    // Update gifts
    for (let i = this.giftEntities.length - 1; i >= 0; i--) {
      const gift = this.giftEntities[i];
      gift.update(this.currentScrollSpeed);

      // Magnet effect for gifts too
      if (this.hasMagnet && !gift.isCollected()) {
        const giftHitbox = gift.getHitbox();
        const dx = hitbox.x - giftHitbox.x;
        const dy = hitbox.y - giftHitbox.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < this.magnetRange && dist > 0) {
          const force = (this.magnetRange - dist) / this.magnetRange;
          giftHitbox.x += dx * force * 0.1;
          giftHitbox.y += dy * force * 0.1;
        }
      }

      // Check gift collection
      if (!gift.isCollected() && this.physics.overlap(hitbox, gift.getHitbox())) {
        const value = gift.collect();
        this.collectGift(value);
      }

      // Remove off-screen or collected gifts
      if (gift.isOffScreen() || gift.isCollected()) {
        if (!gift.isCollected()) gift.destroy();
        this.giftEntities.splice(i, 1);
      }
    }

    // Update power-ups
    for (let i = this.powerUpEntities.length - 1; i >= 0; i--) {
      const powerUp = this.powerUpEntities[i];
      powerUp.update(this.currentScrollSpeed);

      // Check power-up collection
      if (!powerUp.isCollected() && this.physics.overlap(hitbox, powerUp.getHitbox())) {
        const type = powerUp.collect();
        this.activatePowerUp(type, powerUp.duration);
      }

      // Remove off-screen or collected power-ups
      if (powerUp.isOffScreen() || powerUp.isCollected()) {
        if (!powerUp.isCollected()) powerUp.destroy();
        this.powerUpEntities.splice(i, 1);
      }
    }

    // Check survival time achievement
    const survivalSeconds = (Date.now() - this.startTime) / 1000;
    const survivalAchievements = achievements.checkSurvivalTime(survivalSeconds);
    survivalAchievements.forEach(a => this.showAchievementPopup(a));
  }

  private collectCoin(value: number): void {
    this.coins += value;
    this.coinText.setText(this.coins.toString());

    haptics.mediumImpact();

    // Coin flash effect
    this.tweens.add({
      targets: this.coinText,
      scaleX: 1.4,
      scaleY: 1.4,
      duration: 80,
      yoyo: true,
    });

    // Check achievements
    const coinAchievements = achievements.checkCoins(this.coins);
    coinAchievements.forEach(a => this.showAchievementPopup(a));
  }

  private collectGift(value: number): void {
    this.coins += value;
    this.coinText.setText(this.coins.toString());

    haptics.celebration();
    soundManager.playScore();

    // Show festive "GIFT!" text
    const giftText = this.add.text(GAME.WIDTH / 2, GAME.HEIGHT / 2 - 50, '🎁 GIFT! 🎁', {
      fontSize: '32px',
      fontFamily: 'Arial Black, Arial',
      color: '#ffd700',
      stroke: '#8B0000',
      strokeThickness: 4,
    });
    giftText.setOrigin(0.5);
    giftText.setDepth(200);

    this.tweens.add({
      targets: giftText,
      y: giftText.y - 60,
      alpha: 0,
      scale: 1.5,
      duration: 800,
      ease: 'Quad.easeOut',
      onComplete: () => giftText.destroy(),
    });

    // Big coin text flash effect
    this.tweens.add({
      targets: this.coinText,
      scaleX: 1.8,
      scaleY: 1.8,
      duration: 150,
      yoyo: true,
    });

    // Camera flash with Christmas colors
    this.cameras.main.flash(150, 255, 215, 0, true);

    // Check achievements
    const coinAchievements = achievements.checkCoins(this.coins);
    coinAchievements.forEach(a => this.showAchievementPopup(a));
  }

  private activatePowerUp(type: PowerUpType, duration: number): void {
    haptics.heavyImpact();
    soundManager.playScore(); // Use score sound for now

    // Show power-up text
    const powerUpNames: Record<PowerUpType, string> = {
      shield: '🛡️ SHIELD!',
      slowmo: '⏱️ SLOW-MO!',
      magnet: '🧲 MAGNET!',
    };

    const text = this.add.text(GAME.WIDTH / 2, GAME.HEIGHT / 2 - 50, powerUpNames[type], {
      fontSize: '28px',
      fontFamily: 'Arial Black, Arial',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
    });
    text.setOrigin(0.5);
    text.setDepth(200);

    this.tweens.add({
      targets: text,
      y: text.y - 50,
      alpha: 0,
      scale: 1.5,
      duration: 800,
      ease: 'Quad.easeOut',
      onComplete: () => text.destroy(),
    });

    // Create indicator
    this.createPowerUpIndicator(type, duration);

    // Check achievements
    const powerUpAchievements = achievements.checkPowerUp(type);
    powerUpAchievements.forEach(a => this.showAchievementPopup(a));

    switch (type) {
      case 'shield':
        this.activateShield(duration);
        break;
      case 'slowmo':
        this.activateSlowMo(duration);
        break;
      case 'magnet':
        this.activateMagnet(duration);
        break;
    }
  }

  private createPowerUpIndicator(type: PowerUpType, duration: number): void {
    // Remove existing indicator of same type
    const existing = this.powerUpIndicators.get(type);
    if (existing) existing.destroy();

    const emojis: Record<PowerUpType, string> = {
      shield: '🛡️',
      slowmo: '⏱️',
      magnet: '🧲',
    };

    const y = 50 + this.powerUpIndicators.size * 35;

    const container = this.add.container(GAME.WIDTH - 15, y);
    container.setDepth(100);

    const emoji = this.add.text(0, 0, emojis[type], { fontSize: '24px' });
    emoji.setOrigin(1, 0.5);

    // Progress bar background
    const barBg = this.add.rectangle(-35, 0, 50, 8, 0x333333);
    barBg.setOrigin(1, 0.5);

    // Progress bar fill
    const barFill = this.add.rectangle(-35, 0, 50, 8, 0x00ffcc);
    barFill.setOrigin(1, 0.5);

    container.add([barBg, barFill, emoji]);
    this.powerUpIndicators.set(type, container);

    // Animate bar
    this.tweens.add({
      targets: barFill,
      scaleX: 0,
      duration: duration,
      ease: 'Linear',
      onComplete: () => {
        container.destroy();
        this.powerUpIndicators.delete(type);
      },
    });
  }

  private activateShield(duration: number): void {
    this.hasShield = true;

    // Create shield visual
    const hitbox = this.player.getHitbox();
    this.shieldVisual = this.add.circle(hitbox.x, hitbox.y, 35, 0x00ffff, 0.3);
    this.shieldVisual.setStrokeStyle(3, 0x00ffff, 0.8);
    this.shieldVisual.setDepth(15);

    // Pulse animation
    this.tweens.add({
      targets: this.shieldVisual,
      scaleX: 1.1,
      scaleY: 1.1,
      alpha: 0.2,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });

    // Deactivate after duration
    this.time.delayedCall(duration, () => {
      this.hasShield = false;
      if (this.shieldVisual) {
        this.tweens.add({
          targets: this.shieldVisual,
          alpha: 0,
          scale: 1.5,
          duration: 300,
          onComplete: () => {
            this.shieldVisual?.destroy();
            this.shieldVisual = null;
          },
        });
      }
    });
  }

  private useShield(): void {
    this.hasShield = false;
    this.isInvincible = true;

    // Give brief invincibility to escape the pipe
    this.time.delayedCall(500, () => {
      this.isInvincible = false;
    });

    // Shield break effect
    if (this.shieldVisual) {
      this.tweens.killTweensOf(this.shieldVisual);
      this.tweens.add({
        targets: this.shieldVisual,
        scale: 2,
        alpha: 0,
        duration: 200,
        onComplete: () => {
          this.shieldVisual?.destroy();
          this.shieldVisual = null;
        },
      });
    }

    // Remove indicator
    const indicator = this.powerUpIndicators.get('shield');
    if (indicator) {
      indicator.destroy();
      this.powerUpIndicators.delete('shield');
    }

    // Camera flash
    this.cameras.main.flash(100, 0, 255, 255);
    haptics.heavyImpact();

    // Check achievement
    const shieldAchievements = achievements.checkShieldSave();
    shieldAchievements.forEach(a => this.showAchievementPopup(a));
  }

  private activateSlowMo(duration: number): void {
    this.isSlowMo = true;
    this.currentScrollSpeed = PHYSICS.SCROLL_SPEED * 0.4;

    // Visual effect - overlay with blue tint
    const slowMoOverlay = this.add.rectangle(
      GAME.WIDTH / 2, GAME.HEIGHT / 2,
      GAME.WIDTH, GAME.HEIGHT,
      0x8888ff, 0.15
    );
    slowMoOverlay.setDepth(50);

    // Deactivate after duration
    this.time.delayedCall(duration, () => {
      this.isSlowMo = false;
      this.currentScrollSpeed = PHYSICS.SCROLL_SPEED;
      slowMoOverlay.destroy();
    });
  }

  private activateMagnet(duration: number): void {
    this.hasMagnet = true;

    // Deactivate after duration
    this.time.delayedCall(duration, () => {
      this.hasMagnet = false;
    });
  }

  private showAchievementPopup(achievement: Achievement): void {
    haptics.achievement();

    const container = this.add.container(GAME.WIDTH / 2, -60);
    container.setDepth(250);

    // Background
    const bg = this.add.rectangle(0, 0, 280, 50, 0x1a1a3e, 0.95);
    bg.setStrokeStyle(2, 0xffd700);

    // Emoji
    const emoji = this.add.text(-120, 0, achievement.emoji, { fontSize: '32px' });
    emoji.setOrigin(0.5);

    // Text
    const title = this.add.text(-85, -8, achievement.name, {
      fontSize: '14px',
      fontFamily: 'Arial Black, Arial',
      color: '#ffd700',
    });

    const desc = this.add.text(-85, 8, achievement.description, {
      fontSize: '10px',
      fontFamily: 'Arial',
      color: '#ffffff',
    });

    container.add([bg, emoji, title, desc]);

    // Animate in
    this.tweens.add({
      targets: container,
      y: 40,
      duration: 500,
      ease: 'Back.easeOut',
      onComplete: () => {
        // Hold then animate out
        this.tweens.add({
          targets: container,
          y: -60,
          duration: 400,
          delay: 2000,
          ease: 'Quad.easeIn',
          onComplete: () => container.destroy(),
        });
      },
    });
  }

  private async gameOver(): Promise<void> {
    this.isGameOver = true;
    this.physics.pause();
    this.pipeTimer.destroy();
    this.coinTimer.destroy();
    this.giftTimer.destroy();
    this.powerUpTimer.destroy();

    // Clear power-ups
    this.hasShield = false;
    this.isInvincible = false;
    this.isSlowMo = false;
    this.hasMagnet = false;
    if (this.shieldVisual) {
      this.shieldVisual.destroy();
      this.shieldVisual = null;
    }

    // Player death effect
    this.player.explode();

    // Screen shake
    this.cameras.main.shake(300, 0.03);

    // Flash effect
    this.cameras.main.flash(100, 255, 0, 100);

    // Death sound and haptics
    soundManager.playDeath();
    haptics.error();

    // Check minimalist achievement
    const minimalistAchievements = achievements.checkMinimalist(this.score, this.coins);
    minimalistAchievements.forEach(a => this.showAchievementPopup(a));

    // Add score to leaderboard and get rank
    const rank = this.score > 0 ? addScore(this.playerName, this.score, this.playerAvatar) : 0;
    const isNewBest = rank === 1;

    if (isNewBest && this.score > this.previousHighScore) {
      haptics.celebration();
    }

    // Wait for leaderboard to update
    await fetchLeaderboard();

    // Game over overlay with gradient
    const overlay = this.add.rectangle(GAME.WIDTH / 2, GAME.HEIGHT / 2, GAME.WIDTH, GAME.HEIGHT, 0x000000, 0.8);
    overlay.setDepth(99);

    // Game over text
    const gameOverText = this.add.text(GAME.WIDTH / 2, 70, 'GAME OVER', {
      fontSize: '36px',
      fontFamily: 'Arial Black, Arial',
      color: '#ff0066',
    });
    gameOverText.setOrigin(0.5);
    gameOverText.setDepth(100);
    gameOverText.setShadow(0, 0, '#ff0066', 15, true, true);

    // Animate game over text
    this.tweens.add({
      targets: gameOverText,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Stats container
    const statsY = 120;

    // Score with avatar
    const scoreContainer = this.add.container(GAME.WIDTH / 2, statsY);
    const avatarText = this.add.text(-70, 0, this.playerAvatar, { fontSize: '32px' });
    avatarText.setOrigin(0.5);
    const finalScore = this.add.text(-30, 0, `${this.score}`, {
      fontSize: '32px',
      fontFamily: 'Arial Black, Arial',
      color: '#ffffff',
    });
    finalScore.setOrigin(0, 0.5);

    // Coins collected
    const coinEmoji = this.add.text(50, 0, '🪙', { fontSize: '24px' });
    coinEmoji.setOrigin(0.5);
    const coinCount = this.add.text(70, 0, `${this.coins}`, {
      fontSize: '24px',
      fontFamily: 'Arial Black, Arial',
      color: '#ffd700',
    });
    coinCount.setOrigin(0, 0.5);

    scoreContainer.add([avatarText, finalScore, coinEmoji, coinCount]);
    scoreContainer.setDepth(100);

    if (isNewBest && this.score > 0) {
      soundManager.playNewBest();
      const newBestText = this.add.text(GAME.WIDTH / 2, statsY + 40, '★ NEW HIGH SCORE! ★', {
        fontSize: '18px',
        fontFamily: 'Arial Black, Arial',
        color: '#ffd700',
      });
      newBestText.setOrigin(0.5);
      newBestText.setDepth(100);
      newBestText.setShadow(0, 0, '#ffd700', 10, true, true);

      this.tweens.add({
        targets: newBestText,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 300,
        yoyo: true,
        repeat: -1,
      });
    } else if (rank > 0) {
      const rankText = this.add.text(GAME.WIDTH / 2, statsY + 40, `RANK #${rank}`, {
        fontSize: '18px',
        fontFamily: 'Arial Black, Arial',
        color: '#00ffcc',
      });
      rankText.setOrigin(0.5);
      rankText.setDepth(100);
    }

    // Show achievements count
    const { unlocked, total } = achievements.getUnlockedCount();
    const achievementText = this.add.text(GAME.WIDTH / 2, statsY + 70, `🏆 ${unlocked}/${total} ACHIEVEMENTS`, {
      fontSize: '14px',
      fontFamily: 'Arial',
      color: '#888888',
    });
    achievementText.setOrigin(0.5);
    achievementText.setDepth(100);

    // Show leaderboard
    this.showGameOverLeaderboard(statsY + 100);

    const retryText = this.add.text(GAME.WIDTH / 2, GAME.HEIGHT - 50, 'TAP TO RETRY', {
      fontSize: '20px',
      fontFamily: 'Arial Black, Arial',
      color: '#ffffff',
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

  private showGameOverLeaderboard(startY: number): void {
    const leaderboard = getLeaderboard();
    if (leaderboard.length === 0) return;

    // Leaderboard title
    const title = this.add.text(GAME.WIDTH / 2, startY, 'LEADERBOARD', {
      fontSize: '16px',
      fontFamily: 'Arial Black, Arial',
      color: '#00ffcc',
    });
    title.setOrigin(0.5);
    title.setDepth(100);
    title.setShadow(0, 0, '#00ffcc', 8, true, true);

    // Show top 5 scores
    const top5 = leaderboard.slice(0, 5);
    top5.forEach((entry, index) => {
      const y = startY + 35 + index * 32;
      const isCurrentPlayer = entry.name === this.playerName && entry.score === this.score;

      // Background bar for current player
      if (isCurrentPlayer) {
        const bar = this.add.rectangle(GAME.WIDTH / 2, y, GAME.WIDTH - 60, 28, 0xff00ff, 0.2);
        bar.setDepth(99);
      }

      // Avatar
      const avatar = this.add.text(GAME.WIDTH / 2 - 110, y, entry.avatar || '🐍', {
        fontSize: '18px',
      });
      avatar.setOrigin(0.5);
      avatar.setDepth(100);

      // Rank
      const rankColors = ['#ffd700', '#c0c0c0', '#cd7f32', '#888888', '#888888'];
      const rankText = this.add.text(GAME.WIDTH / 2 - 85, y, `${index + 1}`, {
        fontSize: '16px',
        fontFamily: 'Arial Black, Arial',
        color: rankColors[index],
      });
      rankText.setOrigin(0, 0.5);
      rankText.setDepth(100);

      // Name
      const nameText = this.add.text(GAME.WIDTH / 2 - 60, y, entry.name, {
        fontSize: '16px',
        fontFamily: 'Arial',
        color: isCurrentPlayer ? '#ff00ff' : '#ffffff',
      });
      nameText.setOrigin(0, 0.5);
      nameText.setDepth(100);

      // Score
      const scoreText = this.add.text(GAME.WIDTH / 2 + 100, y, entry.score.toString(), {
        fontSize: '16px',
        fontFamily: 'Arial Black, Arial',
        color: isCurrentPlayer ? '#ff00ff' : '#00ffcc',
      });
      scoreText.setOrigin(1, 0.5);
      scoreText.setDepth(100);

      // Highlight animation for current player
      if (isCurrentPlayer) {
        this.tweens.add({
          targets: [nameText, scoreText],
          alpha: 0.6,
          duration: 400,
          yoyo: true,
          repeat: -1,
        });
      }
    });
  }

  private incrementScore(): void {
    this.score++;
    this.scoreText.setText(this.score.toString());

    // Score sound and haptics
    soundManager.playScore();
    haptics.success();

    // Score flash effect
    this.tweens.add({
      targets: this.scoreText,
      scaleX: 1.4,
      scaleY: 1.4,
      duration: 80,
      yoyo: true,
      ease: 'Quad.easeOut',
    });

    // Color flash
    this.scoreText.setColor('#00ffcc');
    this.time.delayedCall(100, () => {
      this.scoreText.setColor('#ffffff');
    });

    // Check achievements
    const scoreAchievements = achievements.checkScore(this.score, this.previousHighScore);
    scoreAchievements.forEach(a => this.showAchievementPopup(a));

    // Motivation every 10 pipes passed
    if (this.score > 0 && this.score % 10 === 0) {
      this.showMotivation();
    }
  }

  private showMotivation(): void {
    const template = Phaser.Math.RND.pick(this.motivationTemplates);
    const motivation = template.replace('{NAME}', this.playerName);

    const motivationText = this.add.text(GAME.WIDTH / 2, GAME.HEIGHT / 2, motivation, {
      fontSize: '24px',
      fontFamily: 'Arial Black, Arial',
      color: '#00ff88',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center',
      wordWrap: { width: GAME.WIDTH - 40 },
    });
    motivationText.setOrigin(0.5);
    motivationText.setDepth(200);
    motivationText.setAlpha(0);
    motivationText.setScale(0.5);
    motivationText.setRotation(Phaser.Math.FloatBetween(-0.1, 0.1));
    motivationText.setShadow(0, 0, '#00ff88', 10, true, true);

    // Animate in
    this.tweens.add({
      targets: motivationText,
      alpha: 1,
      scale: 1.2,
      duration: 150,
      ease: 'Back.easeOut',
      onComplete: () => {
        // Hold and fade out
        this.tweens.add({
          targets: motivationText,
          alpha: 0,
          y: motivationText.y - 50,
          scale: 1.5,
          duration: 800,
          delay: 1500,
          ease: 'Power2',
          onComplete: () => {
            motivationText.destroy();
          },
        });
      },
    });
  }
}
