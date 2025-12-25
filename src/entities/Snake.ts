import Phaser from 'phaser';
import { COLORS, PHYSICS } from '../utils/constants';

interface PositionRecord {
  x: number;
  y: number;
}

export class Snake {
  private scene: Phaser.Scene;
  private head: Phaser.GameObjects.Arc & { body: Phaser.Physics.Arcade.Body };
  private avatarText: Phaser.GameObjects.Text | null = null;
  private segments: Phaser.GameObjects.Arc[] = [];
  private positionHistory: PositionRecord[] = [];
  private segmentCount: number = 3;
  private avatar: string;

  constructor(scene: Phaser.Scene, x: number, y: number, avatar: string = '🐍') {
    this.scene = scene;
    this.avatar = avatar;

    // Create head with physics (invisible circle for collision)
    this.head = scene.add.circle(x, y, 15, COLORS.SNAKE, 0) as Phaser.GameObjects.Arc & { body: Phaser.Physics.Arcade.Body };
    scene.physics.add.existing(this.head);
    this.head.body.setCircle(15);
    this.head.body.setCollideWorldBounds(false);

    // Add avatar emoji as head visual
    this.avatarText = scene.add.text(x, y, avatar, {
      fontSize: '32px',
    });
    this.avatarText.setOrigin(0.5);
    this.avatarText.setDepth(10);

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

    // Update avatar position to follow head
    if (this.avatarText) {
      this.avatarText.x = this.head.x;
      this.avatarText.y = this.head.y;

      // Tilt based on velocity
      const velocity = this.head.body.velocity.y;
      this.avatarText.setRotation(velocity * 0.002);
    }
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
    if (this.avatarText) {
      this.avatarText.destroy();
    }
  }
}
