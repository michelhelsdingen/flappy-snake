import Phaser from 'phaser';
import { GAME } from '../utils/constants';

export type PowerUpType = 'shield' | 'magnet' | 'ghost';

interface PowerUpConfig {
  emoji: string;
  color: number;
  duration: number;
}

const POWER_UP_CONFIGS: Record<PowerUpType, PowerUpConfig> = {
  shield: { emoji: '🛡️', color: 0x00ffff, duration: 5000 },
  magnet: { emoji: '🧲', color: 0xff6600, duration: 6000 },
  ghost: { emoji: '👻', color: 0xaaaaff, duration: 3000 },
};

export class PowerUp {
  private scene: Phaser.Scene;
  private sprite: Phaser.GameObjects.Text;
  private hitbox: Phaser.GameObjects.Arc & { body: Phaser.Physics.Arcade.Body };
  private glow: Phaser.GameObjects.Arc;
  private outerRing: Phaser.GameObjects.Arc;
  private collected: boolean = false;
  public readonly type: PowerUpType;
  public readonly duration: number;

  constructor(scene: Phaser.Scene, x: number, y: number, type: PowerUpType) {
    this.scene = scene;
    this.type = type;
    const config = POWER_UP_CONFIGS[type];
    this.duration = config.duration;

    // Outer spinning ring
    this.outerRing = scene.add.circle(x, y, 28, config.color, 0);
    this.outerRing.setStrokeStyle(3, config.color, 0.8);
    this.outerRing.setDepth(7);

    scene.tweens.add({
      targets: this.outerRing,
      angle: 360,
      duration: 2000,
      repeat: -1,
    });

    // Inner glow
    this.glow = scene.add.circle(x, y, 22, config.color, 0.3);
    this.glow.setDepth(8);

    scene.tweens.add({
      targets: this.glow,
      scaleX: 1.3,
      scaleY: 1.3,
      alpha: 0.1,
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    // Power-up emoji
    this.sprite = scene.add.text(x, y, config.emoji, {
      fontSize: '26px',
    });
    this.sprite.setOrigin(0.5);
    this.sprite.setDepth(10);

    // Floating animation
    scene.tweens.add({
      targets: [this.sprite, this.glow, this.outerRing],
      y: y - 10,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Invisible hitbox
    this.hitbox = scene.add.circle(x, y, 22, 0xffffff, 0) as Phaser.GameObjects.Arc & { body: Phaser.Physics.Arcade.Body };
    scene.physics.add.existing(this.hitbox, true);
  }

  update(speed: number): void {
    const delta = speed / 60;

    this.sprite.x -= delta;
    this.glow.x -= delta;
    this.outerRing.x -= delta;
    this.hitbox.x -= delta;

    (this.hitbox.body as Phaser.Physics.Arcade.Body).updateFromGameObject();
  }

  collect(): PowerUpType {
    if (this.collected) return this.type;
    this.collected = true;

    const config = POWER_UP_CONFIGS[this.type];

    // Explosion effect
    this.scene.tweens.add({
      targets: [this.sprite],
      scaleX: 2,
      scaleY: 2,
      alpha: 0,
      duration: 300,
      ease: 'Quad.easeOut',
    });

    this.scene.tweens.add({
      targets: [this.glow, this.outerRing],
      scaleX: 3,
      scaleY: 3,
      alpha: 0,
      duration: 400,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.destroy();
      },
    });

    // Particle burst with power-up color
    const particles = this.scene.add.particles(this.sprite.x, this.sprite.y, 'particle', {
      speed: { min: 80, max: 150 },
      scale: { start: 0.6, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 500,
      tint: config.color,
      blendMode: 'ADD',
    });
    particles.explode(15);

    return this.type;
  }

  isCollected(): boolean {
    return this.collected;
  }

  isOffScreen(): boolean {
    return this.sprite.x < -30;
  }

  getHitbox(): Phaser.GameObjects.Arc & { body: Phaser.Physics.Arcade.Body } {
    return this.hitbox;
  }

  destroy(): void {
    this.sprite.destroy();
    this.glow.destroy();
    this.outerRing.destroy();
    this.hitbox.destroy();
  }
}
