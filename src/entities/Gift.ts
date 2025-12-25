import Phaser from 'phaser';

const GIFT_EMOJIS = ['🎁', '🎀', '🧸', '🎄'];

export class Gift {
  private scene: Phaser.Scene;
  private sprite: Phaser.GameObjects.Text;
  private hitbox: Phaser.GameObjects.Arc & { body: Phaser.Physics.Arcade.Body };
  private glow: Phaser.GameObjects.Arc;
  private sparkles: Phaser.GameObjects.Text[] = [];
  private collected: boolean = false;
  readonly value: number;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.value = Phaser.Math.Between(5, 10); // Worth 5-10 coins

    // Christmas glow effect (red/green alternating)
    const glowColor = Phaser.Math.Between(0, 1) === 0 ? 0xff3333 : 0x00ff00;
    this.glow = scene.add.circle(x, y, 30, glowColor, 0.4);
    this.glow.setDepth(8);

    // Pulsing glow animation
    scene.tweens.add({
      targets: this.glow,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0.1,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Random gift emoji
    const emoji = Phaser.Math.RND.pick(GIFT_EMOJIS);
    this.sprite = scene.add.text(x, y, emoji, {
      fontSize: '36px',
    });
    this.sprite.setOrigin(0.5);
    this.sprite.setDepth(10);

    // Wobble animation (gifts are more exciting than coins!)
    scene.tweens.add({
      targets: this.sprite,
      angle: -10,
      duration: 200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Floating animation
    scene.tweens.add({
      targets: [this.sprite, this.glow],
      y: y - 12,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Add sparkles around the gift
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const sparkleX = x + Math.cos(angle) * 25;
      const sparkleY = y + Math.sin(angle) * 25;
      const sparkle = scene.add.text(sparkleX, sparkleY, '✨', {
        fontSize: '12px',
      });
      sparkle.setOrigin(0.5);
      sparkle.setDepth(9);
      sparkle.setAlpha(0);
      this.sparkles.push(sparkle);

      // Sparkle animation
      scene.tweens.add({
        targets: sparkle,
        alpha: 1,
        duration: 300,
        delay: i * 150,
        yoyo: true,
        repeat: -1,
      });
    }

    // Invisible hitbox
    this.hitbox = scene.add.circle(x, y, 22, 0xffffff, 0) as Phaser.GameObjects.Arc & { body: Phaser.Physics.Arcade.Body };
    scene.physics.add.existing(this.hitbox, true);
  }

  update(speed: number): void {
    const delta = speed / 60;

    this.sprite.x -= delta;
    this.glow.x -= delta;
    this.hitbox.x -= delta;

    // Update sparkles position
    this.sparkles.forEach((sparkle, i) => {
      const angle = (i / 4) * Math.PI * 2;
      sparkle.x = this.sprite.x + Math.cos(angle) * 25;
      sparkle.y = this.sprite.y + Math.sin(angle) * 25;
    });

    (this.hitbox.body as Phaser.Physics.Arcade.Body).updateFromGameObject();
  }

  collect(): number {
    if (this.collected) return 0;
    this.collected = true;

    // Show value text
    const valueText = this.scene.add.text(this.sprite.x, this.sprite.y - 30, `+${this.value}`, {
      fontSize: '28px',
      fontFamily: 'Arial Black, Arial',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 3,
    });
    valueText.setOrigin(0.5);
    valueText.setDepth(200);

    this.scene.tweens.add({
      targets: valueText,
      y: valueText.y - 60,
      alpha: 0,
      scale: 1.5,
      duration: 800,
      ease: 'Quad.easeOut',
      onComplete: () => valueText.destroy(),
    });

    // Explosion collection animation
    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: 2,
      scaleY: 2,
      alpha: 0,
      angle: 360,
      duration: 400,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.destroy();
      },
    });

    this.scene.tweens.add({
      targets: this.glow,
      scale: 3,
      alpha: 0,
      duration: 400,
      ease: 'Quad.easeOut',
    });

    // Fade out sparkles
    this.sparkles.forEach((sparkle) => {
      this.scene.tweens.add({
        targets: sparkle,
        alpha: 0,
        scale: 2,
        duration: 300,
      });
    });

    // Festive particle burst (red and green!)
    const redParticles = this.scene.add.particles(this.sprite.x, this.sprite.y, 'particle', {
      speed: { min: 80, max: 150 },
      scale: { start: 0.6, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 500,
      tint: 0xff3333,
      blendMode: 'ADD',
    });
    redParticles.explode(10);

    const greenParticles = this.scene.add.particles(this.sprite.x, this.sprite.y, 'sparkle', {
      speed: { min: 60, max: 120 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 600,
      tint: 0x00ff00,
      blendMode: 'ADD',
    });
    greenParticles.explode(8);

    return this.value;
  }

  isCollected(): boolean {
    return this.collected;
  }

  isOffScreen(): boolean {
    return this.sprite.x < -40;
  }

  getHitbox(): Phaser.GameObjects.Arc & { body: Phaser.Physics.Arcade.Body } {
    return this.hitbox;
  }

  destroy(): void {
    this.sprite.destroy();
    this.glow.destroy();
    this.hitbox.destroy();
    this.sparkles.forEach((s) => s.destroy());
  }
}
