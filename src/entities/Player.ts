import Phaser from 'phaser';
import { PHYSICS, GAME } from '../utils/constants';
import { skinManager } from '../utils/skins';

// Funny death messages
const DEATH_MESSAGES = [
  '💀 OEPS!',
  '🤡 FAIL!',
  '😵 BONK!',
  '🪦 RIP!',
  '💥 BOOM!',
  '🫠 SPLAT!',
  '😱 NOOOO!',
  '🤯 WASTED!',
];

export class Player {
  private scene: Phaser.Scene;
  private hitbox: Phaser.GameObjects.Arc & { body: Phaser.Physics.Arcade.Body };
  private avatar: Phaser.GameObjects.Text | null = null;
  private avatarSprite: Phaser.GameObjects.Image | null = null;
  private glowCircle: Phaser.GameObjects.Arc;
  private trail: Phaser.GameObjects.Particles.ParticleEmitter;
  private trailParticles: Phaser.GameObjects.Particles.ParticleEmitter;
  private rainbowTrail: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  private isRainbowMode: boolean = false;
  private isNyanCat: boolean = false;
  private isGhostMode: boolean = false;
  private ghostOverlay: Phaser.GameObjects.Arc | null = null;
  private originalEmoji: string;

  constructor(scene: Phaser.Scene, x: number, y: number, emoji: string = '🐍') {
    this.scene = scene;
    this.originalEmoji = emoji;

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

    // Check if Nyan Cat skin - use sprite instead of emoji
    const selectedSkin = skinManager.getSelectedSkin();
    this.isNyanCat = selectedSkin.id === 'nyancat';

    if (this.isNyanCat && scene.textures.exists('nyancat')) {
      // Use Nyan Cat sprite
      this.avatarSprite = scene.add.image(x, y, 'nyancat');
      this.avatarSprite.setScale(0.2); // Scale down the sprite
      this.avatarSprite.setOrigin(0.5);
      this.avatarSprite.setDepth(20);
    } else {
      // Avatar emoji - larger and more prominent
      this.avatar = scene.add.text(x, y, emoji, {
        fontSize: '42px',
      });
      this.avatar.setOrigin(0.5);
      this.avatar.setDepth(20);
    }

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

    // Create rainbow particle texture
    const rainbowGraphics = scene.make.graphics({ x: 0, y: 0 });
    rainbowGraphics.fillStyle(0xffffff, 1);
    rainbowGraphics.fillCircle(6, 6, 6);
    rainbowGraphics.generateTexture('rainbow', 12, 12);
    rainbowGraphics.destroy();

    // Enable Nyan Cat mode if selected (check already done above)
    if (this.isNyanCat) {
      this.enableNyanCatMode();
    }
  }

  private enableNyanCatMode(): void {
    // Create permanent rainbow trail for Nyan Cat
    this.rainbowTrail = this.scene.add.particles(this.hitbox.x, this.hitbox.y, 'rainbow', {
      speed: { min: 5, max: 15 },
      scale: { start: 0.8, end: 0 },
      alpha: { start: 1, end: 0.3 },
      lifespan: 600,
      frequency: 15,
      blendMode: 'ADD',
      follow: this.hitbox,
      followOffset: { x: -25, y: 0 },
      tint: [0xff0000, 0xff7700, 0xffff00, 0x00ff00, 0x0077ff, 0x9900ff],
    });
    this.rainbowTrail.setDepth(2);

    // Make glow pink for Nyan Cat
    this.glowCircle.setFillStyle(0xff77ff, 0.4);
  }

  flap(): void {
    this.hitbox.body.setVelocityY(PHYSICS.FLAP_VELOCITY);

    // Flap animation - quick scale bounce
    const target = this.avatarSprite || this.avatar;
    if (target) {
      this.scene.tweens.add({
        targets: target,
        scaleX: this.avatarSprite ? 0.26 : 1.3,
        scaleY: this.avatarSprite ? 0.16 : 0.8,
        duration: 80,
        yoyo: true,
        ease: 'Quad.easeOut',
      });
    }

    // Burst of particles on flap
    if (this.trail) {
      this.trail.explode(5, this.hitbox.x - 10, this.hitbox.y);
    }

    // Rainbow burst if in rainbow mode
    if (this.isRainbowMode && this.rainbowTrail) {
      this.rainbowTrail.explode(8, this.hitbox.x - 10, this.hitbox.y);
    }
  }

  update(): void {
    // Update avatar position to follow hitbox
    const visual = this.avatarSprite || this.avatar;
    if (visual) {
      visual.x = this.hitbox.x;
      visual.y = this.hitbox.y;

      // Tilt based on velocity
      const velocity = this.hitbox.body.velocity.y;
      const targetRotation = Phaser.Math.Clamp(velocity * 0.003, -0.5, 0.5);
      visual.rotation = Phaser.Math.Linear(visual.rotation, targetRotation, 0.2);
    }

    // Update glow position
    this.glowCircle.x = this.hitbox.x;
    this.glowCircle.y = this.hitbox.y;

    // Update ghost overlay position
    if (this.ghostOverlay) {
      this.ghostOverlay.x = this.hitbox.x;
      this.ghostOverlay.y = this.hitbox.y;
    }
  }

  getHitbox(): Phaser.GameObjects.Arc & { body: Phaser.Physics.Arcade.Body } {
    return this.hitbox;
  }

  getY(): number {
    return this.hitbox.y;
  }

  // Enable rainbow trail for high combos
  enableRainbowMode(): void {
    if (this.isRainbowMode) return;
    this.isRainbowMode = true;

    this.rainbowTrail = this.scene.add.particles(this.hitbox.x, this.hitbox.y, 'rainbow', {
      speed: { min: 20, max: 50 },
      scale: { start: 0.6, end: 0 },
      alpha: { start: 0.9, end: 0 },
      lifespan: 400,
      frequency: 20,
      blendMode: 'ADD',
      follow: this.hitbox,
      followOffset: { x: -20, y: 0 },
      tint: [0xff0000, 0xff7700, 0xffff00, 0x00ff00, 0x0077ff, 0x9900ff],
    });
    this.rainbowTrail.setDepth(2);

    // Make glow rainbow too
    this.scene.tweens.addCounter({
      from: 0,
      to: 360,
      duration: 1000,
      repeat: -1,
      onUpdate: (tween) => {
        const hue = tween.getValue() ?? 0;
        const color = Phaser.Display.Color.HSLToColor(hue / 360, 1, 0.5);
        this.glowCircle.setFillStyle(color.color, 0.4);
      },
    });
  }

  disableRainbowMode(): void {
    if (!this.isRainbowMode) return;
    this.isRainbowMode = false;

    // Don't remove rainbow trail if Nyan Cat (permanent rainbow)
    if (this.rainbowTrail && !this.isNyanCat) {
      this.rainbowTrail.destroy();
      this.rainbowTrail = null;
    }

    // Restore glow color (pink for Nyan Cat, red for others)
    if (this.isNyanCat) {
      this.glowCircle.setFillStyle(0xff77ff, 0.4);
    } else {
      this.glowCircle.setFillStyle(0xff3333, 0.3);
    }
  }

  // Ghost mode - can pass through pipes
  enableGhostMode(): void {
    if (this.isGhostMode) return;
    this.isGhostMode = true;

    // Make avatar semi-transparent and add ghost effect
    const visual = this.avatarSprite || this.avatar;
    if (visual) visual.setAlpha(0.6);

    this.ghostOverlay = this.scene.add.circle(this.hitbox.x, this.hitbox.y, 30, 0xaaaaff, 0.3);
    this.ghostOverlay.setDepth(19);

    this.scene.tweens.add({
      targets: this.ghostOverlay,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0.1,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });

    // Wobble effect
    if (visual) {
      this.scene.tweens.add({
        targets: visual,
        scaleX: this.avatarSprite ? 0.22 : 1.1,
        duration: 200,
        yoyo: true,
        repeat: -1,
      });
    }
  }

  disableGhostMode(): void {
    if (!this.isGhostMode) return;
    this.isGhostMode = false;

    const visual = this.avatarSprite || this.avatar;
    if (visual) {
      visual.setAlpha(1);
      this.scene.tweens.killTweensOf(visual);
      if (this.avatarSprite) {
        this.avatarSprite.setScale(0.2);
      } else if (this.avatar) {
        this.avatar.setScale(1);
      }
    }

    if (this.ghostOverlay) {
      this.ghostOverlay.destroy();
      this.ghostOverlay = null;
    }
  }

  isGhost(): boolean {
    return this.isGhostMode;
  }

  explode(): void {
    // Death explosion effect
    this.trail.explode(30, this.hitbox.x, this.hitbox.y);
    this.trailParticles.explode(20, this.hitbox.x, this.hitbox.y);

    // Funny death message
    const deathMsg = Phaser.Math.RND.pick(DEATH_MESSAGES);
    const msgText = this.scene.add.text(this.hitbox.x, this.hitbox.y - 50, deathMsg, {
      fontSize: '28px',
      fontFamily: 'Arial Black, Arial',
      color: '#ff0000',
      stroke: '#000000',
      strokeThickness: 4,
    });
    msgText.setOrigin(0.5);
    msgText.setDepth(300);

    this.scene.tweens.add({
      targets: msgText,
      y: msgText.y - 80,
      alpha: 0,
      scale: 1.5,
      duration: 1000,
      ease: 'Quad.easeOut',
      onComplete: () => msgText.destroy(),
    });

    // Avatar spin and shrink death animation
    const visual = this.avatarSprite || this.avatar;
    if (visual) {
      this.scene.tweens.add({
        targets: visual,
        rotation: Math.PI * 4,
        scaleX: 0,
        scaleY: 0,
        duration: 600,
        ease: 'Quad.easeIn',
      });
    }

    // Explosion particles in all directions
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const particle = this.scene.add.text(
        this.hitbox.x,
        this.hitbox.y,
        '✨',
        { fontSize: '20px' }
      );
      particle.setOrigin(0.5);
      particle.setDepth(250);

      this.scene.tweens.add({
        targets: particle,
        x: this.hitbox.x + Math.cos(angle) * 100,
        y: this.hitbox.y + Math.sin(angle) * 100,
        alpha: 0,
        rotation: Math.PI * 2,
        duration: 500,
        ease: 'Quad.easeOut',
        onComplete: () => particle.destroy(),
      });
    }
  }

  destroy(): void {
    this.hitbox.destroy();
    if (this.avatar) this.avatar.destroy();
    if (this.avatarSprite) this.avatarSprite.destroy();
    this.glowCircle.destroy();
    this.trail.destroy();
    this.trailParticles.destroy();
    if (this.rainbowTrail) this.rainbowTrail.destroy();
    if (this.ghostOverlay) this.ghostOverlay.destroy();
  }
}
