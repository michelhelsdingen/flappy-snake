import Phaser from 'phaser';
import { COLORS, PHYSICS } from '../utils/constants';

interface PositionRecord {
  x: number;
  y: number;
}

export class Snake {
  private scene: Phaser.Scene;
  private head: Phaser.GameObjects.Arc & { body: Phaser.Physics.Arcade.Body };
  private segments: Phaser.GameObjects.Arc[] = [];
  private eyes: Phaser.GameObjects.Arc[] = [];
  private positionHistory: PositionRecord[] = [];
  private segmentCount: number = 3;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;

    // Create head with physics
    this.head = scene.add.circle(x, y, 15, COLORS.SNAKE) as Phaser.GameObjects.Arc & { body: Phaser.Physics.Arcade.Body };
    scene.physics.add.existing(this.head);
    this.head.body.setCircle(15);
    this.head.body.setCollideWorldBounds(false);

    // Add glow effect
    this.head.setStrokeStyle(4, COLORS.SNAKE_GLOW, 0.5);

    // Add eyes
    const eyeOffset = 6;
    const eyeSize = 4;
    const leftEye = scene.add.circle(x + eyeOffset, y - 5, eyeSize, 0xffffff);
    const rightEye = scene.add.circle(x + eyeOffset, y + 5, eyeSize, 0xffffff);
    const leftPupil = scene.add.circle(x + eyeOffset + 2, y - 5, 2, 0x000000);
    const rightPupil = scene.add.circle(x + eyeOffset + 2, y + 5, 2, 0x000000);
    this.eyes = [leftEye, rightEye, leftPupil, rightPupil];

    // Create initial segments
    for (let i = 0; i < this.segmentCount; i++) {
      this.createSegment(x - (i + 1) * 20, y);
    }
  }

  private createSegment(x: number, y: number): void {
    const segment = this.scene.add.circle(x, y, 12, COLORS.SNAKE);
    segment.setStrokeStyle(3, COLORS.SNAKE_GLOW, 0.3);
    segment.setAlpha(0.8 - this.segments.length * 0.03);
    this.segments.push(segment);
  }

  flap(): void {
    this.head.body.setVelocityY(PHYSICS.FLAP_VELOCITY);
  }

  grow(): void {
    const lastSegment = this.segments[this.segments.length - 1];
    this.createSegment(lastSegment.x - 20, lastSegment.y);
    this.segmentCount++;
  }

  update(): void {
    // Record head position
    this.positionHistory.unshift({ x: this.head.x, y: this.head.y });

    // Keep history limited
    const maxHistory = this.segmentCount * PHYSICS.SEGMENT_DELAY;
    if (this.positionHistory.length > maxHistory) {
      this.positionHistory.length = maxHistory;
    }

    // Update segment positions
    for (let i = 0; i < this.segments.length; i++) {
      const historyIndex = (i + 1) * Math.floor(PHYSICS.SEGMENT_DELAY / 5);
      if (historyIndex < this.positionHistory.length) {
        const pos = this.positionHistory[historyIndex];
        this.segments[i].x = pos.x;
        this.segments[i].y = pos.y;
      }
    }

    // Update eyes position
    this.eyes.forEach((eye, i) => {
      const offsetX = i < 2 ? 6 : 8;
      const offsetY = i % 2 === 0 ? -5 : 5;
      eye.x = this.head.x + offsetX;
      eye.y = this.head.y + offsetY;
    });
  }

  getHead(): Phaser.GameObjects.Arc & { body: Phaser.Physics.Arcade.Body } {
    return this.head;
  }

  getHeadY(): number {
    return this.head.y;
  }

  destroy(): void {
    this.head.destroy();
    this.segments.forEach(s => s.destroy());
    this.eyes.forEach(e => e.destroy());
  }
}
