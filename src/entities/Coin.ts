import Phaser from 'phaser';
import { GAME } from '../utils/constants';

export class Coin {
  private scene: Phaser.Scene;
  private sprite: Phaser.GameObjects.Text;
  private hitbox: Phaser.GameObjects.Arc & { body: Phaser.Physics.Arcade.Body };
  private glow: Phaser.GameObjects.Arc;
  private collected: boolean = false;
  private value: number;

  constructor(scene: Phaser.Scene, x: number, y: number, value: number = 1) {
    this.scene = scene;
    this.value = value;

    // Glow effect
    const glowColor = value >= 5 ? 0xffd700 : 0xffaa00;
    this.glow = scene.add.circle(x, y, 20, glowColor, 0.3);
    this.glow.setDepth(8);

    // Pulsing glow
    scene.tweens.add({
      targets: this.glow,
      scaleX: 1.4,
      scaleY: 1.4,
      alpha: 0.1,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Coin emoji - gold for regular, diamond for special
    const emoji = value >= 5 ? '💎' : '🪙';
    this.sprite = scene.add.text(x, y, emoji, {
      fontSize: value >= 5 ? '28px' : '24px',
    });
    this.sprite.setOrigin(0.5);
    this.sprite.setDepth(10);

    // Spinning animation
    scene.tweens.add({
      targets: this.sprite,
      scaleX: 0.3,
      duration: 400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Floating animation
    scene.tweens.add({
      targets: [this.sprite, this.glow],
      y: y - 8,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Invisible hitbox
    this.hitbox = scene.add.circle(x, y, 18, 0xffffff, 0) as Phaser.GameObjects.Arc & { body: Phaser.Physics.Arcade.Body };
    scene.physics.add.existing(this.hitbox, true);
  }

  update(speed: number): void {
    const delta = speed / 60;

    this.sprite.x -= delta;
    this.glow.x -= delta;
    this.hitbox.x -= delta;

    (this.hitbox.body as Phaser.Physics.Arcade.Body).updateFromGameObject();
  }

  collect(): number {
    if (this.collected) return 0;
    this.collected = true;

    // Collection animation
    this.scene.tweens.add({
      targets: [this.sprite, this.glow],
      y: this.sprite.y - 50,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0,
      duration: 300,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.destroy();
      },
    });

    // Particle burst
    const particles = this.scene.add.particles(this.sprite.x, this.sprite.y, 'particle', {
      speed: { min: 50, max: 100 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 400,
      tint: 0xffd700,
      blendMode: 'ADD',
    });
    particles.explode(8);

    return this.value;
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
    this.hitbox.destroy();
  }
}
