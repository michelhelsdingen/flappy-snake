import Phaser from 'phaser';
import { COLORS, PHYSICS, GAME } from '../utils/constants';

export class Pipe {
  private topPipe: Phaser.GameObjects.Rectangle & { body: Phaser.Physics.Arcade.Body };
  private bottomPipe: Phaser.GameObjects.Rectangle & { body: Phaser.Physics.Arcade.Body };
  private scoreZone: Phaser.GameObjects.Rectangle & { body: Phaser.Physics.Arcade.Body };
  private scored: boolean = false;

  constructor(scene: Phaser.Scene, x: number) {
    // Random gap position
    const minY = 100;
    const maxY = GAME.HEIGHT - 100 - PHYSICS.PIPE_GAP;
    const gapY = Phaser.Math.Between(minY, maxY);

    const pipeWidth = 60;

    // Top pipe
    const topHeight = gapY;
    this.topPipe = scene.add.rectangle(
      x,
      topHeight / 2,
      pipeWidth,
      topHeight,
      COLORS.PIPE
    ) as Phaser.GameObjects.Rectangle & { body: Phaser.Physics.Arcade.Body };
    this.topPipe.setStrokeStyle(3, COLORS.PIPE_GLOW, 0.6);
    scene.physics.add.existing(this.topPipe, true);

    // Bottom pipe
    const bottomY = gapY + PHYSICS.PIPE_GAP;
    const bottomHeight = GAME.HEIGHT - bottomY;
    this.bottomPipe = scene.add.rectangle(
      x,
      bottomY + bottomHeight / 2,
      pipeWidth,
      bottomHeight,
      COLORS.PIPE
    ) as Phaser.GameObjects.Rectangle & { body: Phaser.Physics.Arcade.Body };
    this.bottomPipe.setStrokeStyle(3, COLORS.PIPE_GLOW, 0.6);
    scene.physics.add.existing(this.bottomPipe, true);

    // Invisible score zone in the gap
    this.scoreZone = scene.add.rectangle(
      x + pipeWidth / 2 + 15,
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
    this.scoreZone.x -= delta;

    // Update physics bodies
    (this.topPipe.body as Phaser.Physics.Arcade.Body).updateFromGameObject();
    (this.bottomPipe.body as Phaser.Physics.Arcade.Body).updateFromGameObject();
    (this.scoreZone.body as Phaser.Physics.Arcade.Body).updateFromGameObject();
  }

  isOffScreen(): boolean {
    return this.topPipe.x < -50;
  }

  hasScored(): boolean {
    return this.scored;
  }

  markScored(): void {
    this.scored = true;
  }

  getTopPipe(): Phaser.GameObjects.Rectangle {
    return this.topPipe;
  }

  getBottomPipe(): Phaser.GameObjects.Rectangle {
    return this.bottomPipe;
  }

  getScoreZone(): Phaser.GameObjects.Rectangle {
    return this.scoreZone;
  }

  destroy(): void {
    this.topPipe.destroy();
    this.bottomPipe.destroy();
    this.scoreZone.destroy();
  }
}
