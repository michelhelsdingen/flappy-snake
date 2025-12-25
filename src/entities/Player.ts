import Phaser from 'phaser';
import { PHYSICS } from '../utils/constants';

export class Player {
  private scene: Phaser.Scene;
  private hitbox: Phaser.GameObjects.Arc & { body: Phaser.Physics.Arcade.Body };
  private avatar: Phaser.GameObjects.Text;
  private glowCircle: Phaser.GameObjects.Arc;
  private trail: Phaser.GameObjects.Particles.ParticleEmitter;
  private trailParticles: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor(scene: Phaser.Scene, x: number, y: number, emoji: string = '🐍') {
    this.scene = scene;

    // Create hitbox with physics - EXACTLY like Snake class
    this.hitbox = scene.add.circle(x, y, 16, 0xffffff, 0) as Phaser.GameObjects.Arc & { body: Phaser.Physics.Arcade.Body };
    scene.physics.add.existing(this.hitbox);
    this.hitbox.body.setCircle(16);
    this.hitbox.body.setCollideWorldBounds(false);

    // Christmas glow effect behind avatar
    this.glowCircle = scene.add.circle(x, y, 25, 0xff3333, 0.3);
    this.glowCircle.setDepth(5);

    // Pulsing glow animation
    scene.tweens.add({
      targets: this.glowCircle,
      scaleX: 1.3,
      scaleY: 1.3,
      alpha: 0.1,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Avatar emoji - larger and more prominent
    this.avatar = scene.add.text(x, y, emoji, {
      fontSize: '42px',
    });
    this.avatar.setOrigin(0.5);
    this.avatar.setDepth(20);

    // Create Christmas red particle texture
    const particleGraphics = scene.make.graphics({ x: 0, y: 0 });
    particleGraphics.fillStyle(0xff3333, 1);
    particleGraphics.fillCircle(8, 8, 8);
    particleGraphics.generateTexture('particle', 16, 16);
    particleGraphics.destroy();

    this.trail = scene.add.particles(x, y, 'particle', {
      speed: { min: 10, max: 30 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.5, end: 0 },
      lifespan: 300,
      frequency: 40,
      blendMode: 'ADD',
      follow: this.hitbox,
      followOffset: { x: -15, y: 0 },
    });
    this.trail.setDepth(1);

    // Christmas sparkle trail (green)
    const sparkleGraphics = scene.make.graphics({ x: 0, y: 0 });
    sparkleGraphics.fillStyle(0x00ff00, 1);
    sparkleGraphics.fillCircle(4, 4, 4);
    sparkleGraphics.generateTexture('sparkle', 8, 8);
    sparkleGraphics.destroy();

    this.trailParticles = scene.add.particles(x, y, 'sparkle', {
      speed: { min: 5, max: 20 },
      scale: { start: 0.3, end: 0 },
      alpha: { start: 0.8, end: 0 },
      lifespan: 200,
      frequency: 80,
      blendMode: 'ADD',
      follow: this.hitbox,
      followOffset: { x: -20, y: 0 },
    });
    this.trailParticles.setDepth(1);
  }

  flap(): void {
    this.hitbox.body.setVelocityY(PHYSICS.FLAP_VELOCITY);

    // Flap animation - quick scale bounce
    this.scene.tweens.add({
      targets: this.avatar,
      scaleX: 1.3,
      scaleY: 0.8,
      duration: 80,
      yoyo: true,
      ease: 'Quad.easeOut',
    });

    // Burst of particles on flap
    if (this.trail) {
      this.trail.explode(5, this.hitbox.x - 10, this.hitbox.y);
    }
  }

  update(): void {
    // Update avatar position to follow hitbox
    this.avatar.x = this.hitbox.x;
    this.avatar.y = this.hitbox.y;

    // Update glow position
    this.glowCircle.x = this.hitbox.x;
    this.glowCircle.y = this.hitbox.y;

    // Tilt based on velocity
    const velocity = this.hitbox.body.velocity.y;
    const targetRotation = Phaser.Math.Clamp(velocity * 0.003, -0.5, 0.5);
    this.avatar.rotation = Phaser.Math.Linear(this.avatar.rotation, targetRotation, 0.2);
  }

  getHitbox(): Phaser.GameObjects.Arc & { body: Phaser.Physics.Arcade.Body } {
    return this.hitbox;
  }

  getY(): number {
    return this.hitbox.y;
  }

  explode(): void {
    // Death explosion effect
    this.trail.explode(20, this.hitbox.x, this.hitbox.y);
    this.trailParticles.explode(15, this.hitbox.x, this.hitbox.y);

    // Shake avatar
    this.scene.tweens.add({
      targets: this.avatar,
      x: this.avatar.x + Phaser.Math.Between(-5, 5),
      y: this.avatar.y + Phaser.Math.Between(-5, 5),
      duration: 50,
      repeat: 5,
      yoyo: true,
    });
  }

  destroy(): void {
    this.hitbox.destroy();
    this.avatar.destroy();
    this.glowCircle.destroy();
    this.trail.destroy();
    this.trailParticles.destroy();
  }
}
