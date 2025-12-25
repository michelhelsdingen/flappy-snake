import Phaser from 'phaser';
import { COLORS, PHYSICS, GAME } from '../utils/constants';

export class Pipe {
  private scene: Phaser.Scene;
  private topPipe: Phaser.GameObjects.Container;
  private bottomPipe: Phaser.GameObjects.Container;
  private topHitbox: Phaser.GameObjects.Rectangle & { body: Phaser.Physics.Arcade.Body };
  private bottomHitbox: Phaser.GameObjects.Rectangle & { body: Phaser.Physics.Arcade.Body };
  private scoreZone: Phaser.GameObjects.Rectangle & { body: Phaser.Physics.Arcade.Body };
  private scored: boolean = false;
  private gapGlow: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene, x: number) {
    this.scene = scene;

    // Random gap position
    const minY = 120;
    const maxY = GAME.HEIGHT - 120 - PHYSICS.PIPE_GAP;
    const gapY = Phaser.Math.Between(minY, maxY);

    const pipeWidth = 70;
    const capHeight = 25;
    const capWidth = 85;

    // Create top pipe container
    const topHeight = gapY;
    this.topPipe = scene.add.container(x, 0);

    // Top pipe body (gradient effect with multiple rectangles)
    const topBody = scene.add.rectangle(0, topHeight / 2, pipeWidth, topHeight, 0x1a1a3e);
    topBody.setStrokeStyle(2, 0x00ffcc, 0.4);

    // Top pipe inner highlight
    const topHighlight = scene.add.rectangle(-10, topHeight / 2, 8, topHeight, 0x00ffcc, 0.15);

    // Top pipe cap (bottom of top pipe)
    const topCap = scene.add.rectangle(0, topHeight - capHeight / 2, capWidth, capHeight, 0x2a2a4e);
    topCap.setStrokeStyle(3, 0x00ffcc, 0.6);

    // Neon edge on cap
    const topCapGlow = scene.add.rectangle(0, topHeight, capWidth - 10, 4, 0x00ffcc, 0.8);

    this.topPipe.add([topBody, topHighlight, topCap, topCapGlow]);

    // Create bottom pipe container
    const bottomY = gapY + PHYSICS.PIPE_GAP;
    const bottomHeight = GAME.HEIGHT - bottomY;
    this.bottomPipe = scene.add.container(x, bottomY);

    // Bottom pipe body
    const bottomBody = scene.add.rectangle(0, bottomHeight / 2, pipeWidth, bottomHeight, 0x1a1a3e);
    bottomBody.setStrokeStyle(2, 0x00ffcc, 0.4);

    // Bottom pipe inner highlight
    const bottomHighlight = scene.add.rectangle(-10, bottomHeight / 2, 8, bottomHeight, 0x00ffcc, 0.15);

    // Bottom pipe cap (top of bottom pipe)
    const bottomCap = scene.add.rectangle(0, capHeight / 2, capWidth, capHeight, 0x2a2a4e);
    bottomCap.setStrokeStyle(3, 0x00ffcc, 0.6);

    // Neon edge on cap
    const bottomCapGlow = scene.add.rectangle(0, 0, capWidth - 10, 4, 0x00ffcc, 0.8);

    this.bottomPipe.add([bottomBody, bottomHighlight, bottomCap, bottomCapGlow]);

    // Gap glow effect
    this.gapGlow = scene.add.rectangle(
      x,
      gapY + PHYSICS.PIPE_GAP / 2,
      pipeWidth + 20,
      PHYSICS.PIPE_GAP - 20,
      0x00ffcc,
      0.05
    );
    this.gapGlow.setDepth(-1);

    // Hitboxes (invisible)
    this.topHitbox = scene.add.rectangle(
      x, topHeight / 2, pipeWidth, topHeight, 0xffffff, 0
    ) as Phaser.GameObjects.Rectangle & { body: Phaser.Physics.Arcade.Body };
    scene.physics.add.existing(this.topHitbox, true);

    this.bottomHitbox = scene.add.rectangle(
      x, bottomY + bottomHeight / 2, pipeWidth, bottomHeight, 0xffffff, 0
    ) as Phaser.GameObjects.Rectangle & { body: Phaser.Physics.Arcade.Body };
    scene.physics.add.existing(this.bottomHitbox, true);

    // Invisible score zone in the gap
    this.scoreZone = scene.add.rectangle(
      x + pipeWidth / 2 + 20,
      gapY + PHYSICS.PIPE_GAP / 2,
      10,
      PHYSICS.PIPE_GAP,
      0x000000,
      0
    ) as Phaser.GameObjects.Rectangle & { body: Phaser.Physics.Arcade.Body };
    scene.physics.add.existing(this.scoreZone, true);
  }

  update(speed: number): void {
    const delta = speed / 60;

    this.topPipe.x -= delta;
    this.bottomPipe.x -= delta;
    this.topHitbox.x -= delta;
    this.bottomHitbox.x -= delta;
    this.scoreZone.x -= delta;
    this.gapGlow.x -= delta;

    // Update physics bodies
    (this.topHitbox.body as Phaser.Physics.Arcade.Body).updateFromGameObject();
    (this.bottomHitbox.body as Phaser.Physics.Arcade.Body).updateFromGameObject();
    (this.scoreZone.body as Phaser.Physics.Arcade.Body).updateFromGameObject();
  }

  isOffScreen(): boolean {
    return this.topPipe.x < -60;
  }

  hasScored(): boolean {
    return this.scored;
  }

  markScored(): void {
    this.scored = true;

    // Flash the gap glow
    this.scene.tweens.add({
      targets: this.gapGlow,
      alpha: 0.4,
      duration: 100,
      yoyo: true,
    });
  }

  getTopPipe(): Phaser.GameObjects.Rectangle {
    return this.topHitbox;
  }

  getBottomPipe(): Phaser.GameObjects.Rectangle {
    return this.bottomHitbox;
  }

  getScoreZone(): Phaser.GameObjects.Rectangle {
    return this.scoreZone;
  }

  destroy(): void {
    this.topPipe.destroy();
    this.bottomPipe.destroy();
    this.topHitbox.destroy();
    this.bottomHitbox.destroy();
    this.scoreZone.destroy();
    this.gapGlow.destroy();
  }
}
