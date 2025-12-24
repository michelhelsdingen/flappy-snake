# Flappy Snake Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a playable Flappy Snake game with neon visuals that runs in browser and can be wrapped for mobile.

**Architecture:** Phaser 3 handles rendering, physics, and input. Game is split into scenes (Menu, Game, GameOver). Snake entity manages head physics + trailing segments. Pipes spawn off-screen and recycle.

**Tech Stack:** Phaser 3, TypeScript, Vite, Capacitor (later)

---

## Task 1: Project Setup

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `src/main.ts`

**Step 1: Initialize npm project**

Run:
```bash
cd /Users/michelhelsdingen/Documents/game
npm init -y
```

**Step 2: Install dependencies**

Run:
```bash
npm install phaser
npm install -D typescript vite @types/node
```

**Step 3: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

**Step 4: Create vite.config.ts**

```typescript
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
  },
});
```

**Step 5: Create index.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Flappy Snake</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #0a0a1a; overflow: hidden; }
    canvas { display: block; margin: 0 auto; }
  </style>
</head>
<body>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

**Step 6: Create src/main.ts with basic Phaser config**

```typescript
import Phaser from 'phaser';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 400,
  height: 600,
  backgroundColor: '#0a0a1a',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 800 },
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [],
};

new Phaser.Game(config);
```

**Step 7: Run dev server to verify**

Run:
```bash
npm run dev
```

Expected: Black screen at localhost:5173 with no errors in console.

**Step 8: Commit**

```bash
git add -A
git commit -m "feat: initialize project with Phaser 3 + Vite + TypeScript"
```

---

## Task 2: Constants & Game Config

**Files:**
- Create: `src/utils/constants.ts`

**Step 1: Create constants file**

```typescript
export const GAME = {
  WIDTH: 400,
  HEIGHT: 600,
} as const;

export const COLORS = {
  BACKGROUND: 0x0a0a1a,
  SNAKE: 0x00ffcc,
  SNAKE_GLOW: 0x00ff99,
  PIPE: 0xff00aa,
  PIPE_GLOW: 0xff66cc,
  TEXT: 0xffffff,
} as const;

export const PHYSICS = {
  GRAVITY: 800,
  FLAP_VELOCITY: -300,
  SCROLL_SPEED: 200,
  PIPE_GAP: 180,
  PIPE_SPAWN_INTERVAL: 1800,
  SEGMENT_DELAY: 80,
} as const;
```

**Step 2: Update main.ts to use constants**

```typescript
import Phaser from 'phaser';
import { GAME, COLORS, PHYSICS } from './utils/constants';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME.WIDTH,
  height: GAME.HEIGHT,
  backgroundColor: COLORS.BACKGROUND,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: PHYSICS.GRAVITY },
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [],
};

new Phaser.Game(config);
```

**Step 3: Verify it still runs**

Run: `npm run dev`

Expected: Same black screen, no errors.

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add game constants for colors and physics"
```

---

## Task 3: Menu Scene

**Files:**
- Create: `src/scenes/MenuScene.ts`
- Modify: `src/main.ts`

**Step 1: Create MenuScene**

```typescript
import Phaser from 'phaser';
import { GAME, COLORS } from '../utils/constants';

export class MenuScene extends Phaser.Scene {
  private highScore: number = 0;

  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    this.highScore = parseInt(localStorage.getItem('flappySnakeHighScore') || '0');

    // Title
    const title = this.add.text(GAME.WIDTH / 2, GAME.HEIGHT / 3, 'FLAPPY SNAKE', {
      fontSize: '36px',
      fontFamily: 'Arial Black',
      color: '#00ffcc',
    });
    title.setOrigin(0.5);

    // Tap to start (blinking)
    const startText = this.add.text(GAME.WIDTH / 2, GAME.HEIGHT / 2, 'TAP TO START', {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: '#ffffff',
    });
    startText.setOrigin(0.5);

    this.tweens.add({
      targets: startText,
      alpha: 0.2,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });

    // High score
    if (this.highScore > 0) {
      const highScoreText = this.add.text(GAME.WIDTH / 2, GAME.HEIGHT * 0.7, `BEST: ${this.highScore}`, {
        fontSize: '18px',
        fontFamily: 'Arial',
        color: '#888888',
      });
      highScoreText.setOrigin(0.5);
    }

    // Input
    this.input.on('pointerdown', () => {
      this.scene.start('GameScene');
    });
  }
}
```

**Step 2: Update main.ts to include MenuScene**

```typescript
import Phaser from 'phaser';
import { GAME, COLORS, PHYSICS } from './utils/constants';
import { MenuScene } from './scenes/MenuScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME.WIDTH,
  height: GAME.HEIGHT,
  backgroundColor: COLORS.BACKGROUND,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: PHYSICS.GRAVITY },
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [MenuScene],
};

new Phaser.Game(config);
```

**Step 3: Verify menu appears**

Run: `npm run dev`

Expected: "FLAPPY SNAKE" title with blinking "TAP TO START".

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add menu scene with title and start prompt"
```

---

## Task 4: Game Scene - Basic Setup

**Files:**
- Create: `src/scenes/GameScene.ts`
- Modify: `src/main.ts`

**Step 1: Create GameScene skeleton**

```typescript
import Phaser from 'phaser';
import { GAME, COLORS, PHYSICS } from '../utils/constants';

export class GameScene extends Phaser.Scene {
  private score: number = 0;
  private scoreText!: Phaser.GameObjects.Text;
  private isGameOver: boolean = false;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    this.score = 0;
    this.isGameOver = false;

    // Score display
    this.scoreText = this.add.text(GAME.WIDTH / 2, 50, '0', {
      fontSize: '48px',
      fontFamily: 'Arial Black',
      color: '#ffffff',
    });
    this.scoreText.setOrigin(0.5);
    this.scoreText.setDepth(100);

    // Input
    this.input.on('pointerdown', this.handleTap, this);
  }

  private handleTap(): void {
    if (this.isGameOver) {
      this.scene.restart();
      return;
    }
    // Will add flap logic here
  }

  update(): void {
    if (this.isGameOver) return;
    // Will add game logic here
  }

  private gameOver(): void {
    this.isGameOver = true;
    // Will add game over logic here
  }

  private incrementScore(): void {
    this.score++;
    this.scoreText.setText(this.score.toString());
  }
}
```

**Step 2: Update main.ts to include GameScene**

```typescript
import Phaser from 'phaser';
import { GAME, COLORS, PHYSICS } from './utils/constants';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME.WIDTH,
  height: GAME.HEIGHT,
  backgroundColor: COLORS.BACKGROUND,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: PHYSICS.GRAVITY },
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [MenuScene, GameScene],
};

new Phaser.Game(config);
```

**Step 3: Verify scene transition**

Run: `npm run dev`

Expected: Menu appears, tap takes you to game scene with "0" score.

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add game scene skeleton with score display"
```

---

## Task 5: Snake Entity - Head with Physics

**Files:**
- Create: `src/entities/Snake.ts`
- Modify: `src/scenes/GameScene.ts`

**Step 1: Create Snake class**

```typescript
import Phaser from 'phaser';
import { COLORS, PHYSICS, GAME } from '../utils/constants';

interface PositionRecord {
  x: number;
  y: number;
}

export class Snake {
  private scene: Phaser.Scene;
  private head: Phaser.GameObjects.Arc & { body: Phaser.Physics.Arcade.Body };
  private segments: Phaser.GameObjects.Arc[] = [];
  private positionHistory: PositionRecord[] = [];
  private segmentCount: number = 3;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;

    // Create head with physics
    this.head = scene.add.circle(x, y, 15, COLORS.SNAKE) as any;
    scene.physics.add.existing(this.head);
    this.head.body.setCircle(15);
    this.head.body.setCollideWorldBounds(false);

    // Add glow effect
    this.head.setStrokeStyle(4, COLORS.SNAKE_GLOW, 0.5);

    // Create initial segments
    for (let i = 0; i < this.segmentCount; i++) {
      this.createSegment(x - (i + 1) * 20, y);
    }
  }

  private createSegment(x: number, y: number): void {
    const segment = this.scene.add.circle(x, y, 12, COLORS.SNAKE);
    segment.setStrokeStyle(3, COLORS.SNAKE_GLOW, 0.3);
    segment.setAlpha(0.8 - this.segments.length * 0.05);
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
  }
}
```

**Step 2: Update GameScene to use Snake**

```typescript
import Phaser from 'phaser';
import { GAME, COLORS, PHYSICS } from '../utils/constants';
import { Snake } from '../entities/Snake';

export class GameScene extends Phaser.Scene {
  private score: number = 0;
  private scoreText!: Phaser.GameObjects.Text;
  private isGameOver: boolean = false;
  private snake!: Snake;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    this.score = 0;
    this.isGameOver = false;

    // Create snake
    this.snake = new Snake(this, 100, GAME.HEIGHT / 2);

    // Score display
    this.scoreText = this.add.text(GAME.WIDTH / 2, 50, '0', {
      fontSize: '48px',
      fontFamily: 'Arial Black',
      color: '#ffffff',
    });
    this.scoreText.setOrigin(0.5);
    this.scoreText.setDepth(100);

    // Input
    this.input.on('pointerdown', this.handleTap, this);
  }

  private handleTap(): void {
    if (this.isGameOver) {
      this.scene.restart();
      return;
    }
    this.snake.flap();
  }

  update(): void {
    if (this.isGameOver) return;

    this.snake.update();

    // Check bounds
    const headY = this.snake.getHeadY();
    if (headY < 0 || headY > GAME.HEIGHT) {
      this.gameOver();
    }
  }

  private gameOver(): void {
    this.isGameOver = true;
    this.physics.pause();

    // Save high score
    const highScore = parseInt(localStorage.getItem('flappySnakeHighScore') || '0');
    if (this.score > highScore) {
      localStorage.setItem('flappySnakeHighScore', this.score.toString());
    }

    // Game over text
    const gameOverText = this.add.text(GAME.WIDTH / 2, GAME.HEIGHT / 2 - 50, 'GAME OVER', {
      fontSize: '32px',
      fontFamily: 'Arial Black',
      color: '#ff0066',
    });
    gameOverText.setOrigin(0.5);

    const retryText = this.add.text(GAME.WIDTH / 2, GAME.HEIGHT / 2 + 20, 'TAP TO RETRY', {
      fontSize: '18px',
      fontFamily: 'Arial',
      color: '#ffffff',
    });
    retryText.setOrigin(0.5);
  }

  private incrementScore(): void {
    this.score++;
    this.scoreText.setText(this.score.toString());
    this.snake.grow();
  }
}
```

**Step 3: Verify snake physics**

Run: `npm run dev`

Expected: Snake falls with gravity, tapping makes it flap up, segments follow the head.

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add snake entity with physics and trailing segments"
```

---

## Task 6: Pipes

**Files:**
- Create: `src/entities/Pipe.ts`
- Modify: `src/scenes/GameScene.ts`

**Step 1: Create Pipe class**

```typescript
import Phaser from 'phaser';
import { COLORS, PHYSICS, GAME } from '../utils/constants';

export class Pipe {
  private scene: Phaser.Scene;
  private topPipe: Phaser.GameObjects.Rectangle & { body: Phaser.Physics.Arcade.Body };
  private bottomPipe: Phaser.GameObjects.Rectangle & { body: Phaser.Physics.Arcade.Body };
  private scoreZone: Phaser.GameObjects.Rectangle & { body: Phaser.Physics.Arcade.Body };
  private scored: boolean = false;

  constructor(scene: Phaser.Scene, x: number) {
    this.scene = scene;

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
    ) as any;
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
    ) as any;
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
    ) as any;
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
```

**Step 2: Update GameScene with pipes and collision**

```typescript
import Phaser from 'phaser';
import { GAME, COLORS, PHYSICS } from '../utils/constants';
import { Snake } from '../entities/Snake';
import { Pipe } from '../entities/Pipe';

export class GameScene extends Phaser.Scene {
  private score: number = 0;
  private scoreText!: Phaser.GameObjects.Text;
  private isGameOver: boolean = false;
  private snake!: Snake;
  private pipes: Pipe[] = [];
  private pipeTimer!: Phaser.Time.TimerEvent;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    this.score = 0;
    this.isGameOver = false;
    this.pipes = [];

    // Create snake
    this.snake = new Snake(this, 100, GAME.HEIGHT / 2);

    // Score display
    this.scoreText = this.add.text(GAME.WIDTH / 2, 50, '0', {
      fontSize: '48px',
      fontFamily: 'Arial Black',
      color: '#ffffff',
    });
    this.scoreText.setOrigin(0.5);
    this.scoreText.setDepth(100);

    // Spawn pipes
    this.pipeTimer = this.time.addEvent({
      delay: PHYSICS.PIPE_SPAWN_INTERVAL,
      callback: this.spawnPipe,
      callbackScope: this,
      loop: true,
    });

    // First pipe after short delay
    this.time.delayedCall(1000, this.spawnPipe, [], this);

    // Input
    this.input.on('pointerdown', this.handleTap, this);
  }

  private spawnPipe(): void {
    if (this.isGameOver) return;
    const pipe = new Pipe(this, GAME.WIDTH + 30);
    this.pipes.push(pipe);
  }

  private handleTap(): void {
    if (this.isGameOver) {
      this.scene.restart();
      return;
    }
    this.snake.flap();
  }

  update(): void {
    if (this.isGameOver) return;

    this.snake.update();

    // Check bounds
    const headY = this.snake.getHeadY();
    if (headY < 0 || headY > GAME.HEIGHT) {
      this.gameOver();
      return;
    }

    // Update pipes and check collisions
    const head = this.snake.getHead();

    for (let i = this.pipes.length - 1; i >= 0; i--) {
      const pipe = this.pipes[i];
      pipe.update(PHYSICS.SCROLL_SPEED);

      // Check collision with pipes
      if (
        this.physics.overlap(head, pipe.getTopPipe()) ||
        this.physics.overlap(head, pipe.getBottomPipe())
      ) {
        this.gameOver();
        return;
      }

      // Check score zone
      if (!pipe.hasScored() && this.physics.overlap(head, pipe.getScoreZone())) {
        pipe.markScored();
        this.incrementScore();
      }

      // Remove off-screen pipes
      if (pipe.isOffScreen()) {
        pipe.destroy();
        this.pipes.splice(i, 1);
      }
    }
  }

  private gameOver(): void {
    this.isGameOver = true;
    this.physics.pause();
    this.pipeTimer.destroy();

    // Save high score
    const highScore = parseInt(localStorage.getItem('flappySnakeHighScore') || '0');
    if (this.score > highScore) {
      localStorage.setItem('flappySnakeHighScore', this.score.toString());
    }

    // Game over text
    const gameOverText = this.add.text(GAME.WIDTH / 2, GAME.HEIGHT / 2 - 50, 'GAME OVER', {
      fontSize: '32px',
      fontFamily: 'Arial Black',
      color: '#ff0066',
    });
    gameOverText.setOrigin(0.5);

    const finalScore = this.add.text(GAME.WIDTH / 2, GAME.HEIGHT / 2, `SCORE: ${this.score}`, {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#ffffff',
    });
    finalScore.setOrigin(0.5);

    const retryText = this.add.text(GAME.WIDTH / 2, GAME.HEIGHT / 2 + 50, 'TAP TO RETRY', {
      fontSize: '18px',
      fontFamily: 'Arial',
      color: '#888888',
    });
    retryText.setOrigin(0.5);
  }

  private incrementScore(): void {
    this.score++;
    this.scoreText.setText(this.score.toString());
    this.snake.grow();
  }
}
```

**Step 3: Verify full gameplay loop**

Run: `npm run dev`

Expected: Pipes spawn and scroll, collision kills you, passing through gap increases score and grows snake.

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add pipes with collision and scoring"
```

---

## Task 7: Visual Polish - Glow Effects & Particles

**Files:**
- Modify: `src/scenes/GameScene.ts`
- Modify: `src/entities/Snake.ts`

**Step 1: Add particle effect on score in GameScene**

Add to `incrementScore()`:

```typescript
private incrementScore(): void {
  this.score++;
  this.scoreText.setText(this.score.toString());
  this.snake.grow();

  // Score flash effect
  this.tweens.add({
    targets: this.scoreText,
    scaleX: 1.3,
    scaleY: 1.3,
    duration: 100,
    yoyo: true,
  });
}
```

**Step 2: Add screen shake on death**

Update `gameOver()` method, add at the start:

```typescript
private gameOver(): void {
  this.isGameOver = true;

  // Screen shake
  this.cameras.main.shake(200, 0.02);

  // ... rest of method
}
```

**Step 3: Add eyes to snake head in Snake.ts**

Update constructor after head creation:

```typescript
// Add eyes
const eyeOffset = 6;
const eyeSize = 4;
const leftEye = scene.add.circle(x + eyeOffset, y - 5, eyeSize, 0xffffff);
const rightEye = scene.add.circle(x + eyeOffset, y + 5, eyeSize, 0xffffff);
const leftPupil = scene.add.circle(x + eyeOffset + 2, y - 5, 2, 0x000000);
const rightPupil = scene.add.circle(x + eyeOffset + 2, y + 5, 2, 0x000000);

this.eyes = [leftEye, rightEye, leftPupil, rightPupil];
```

Add eyes property and update in update():

```typescript
private eyes: Phaser.GameObjects.Arc[] = [];

// In update(), after position history:
this.eyes.forEach((eye, i) => {
  const offsetX = i < 2 ? 6 : 8;
  const offsetY = i % 2 === 0 ? -5 : 5;
  eye.x = this.head.x + offsetX;
  eye.y = this.head.y + offsetY;
});
```

Update destroy():

```typescript
destroy(): void {
  this.head.destroy();
  this.segments.forEach(s => s.destroy());
  this.eyes.forEach(e => e.destroy());
}
```

**Step 4: Verify visual polish**

Run: `npm run dev`

Expected: Snake has eyes, score pulses on increment, screen shakes on death.

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add visual polish - eyes, score pulse, screen shake"
```

---

## Task 8: Background Stars

**Files:**
- Modify: `src/scenes/GameScene.ts`

**Step 1: Add starfield background**

Add to `create()` before snake creation:

```typescript
// Starfield background
for (let i = 0; i < 50; i++) {
  const x = Phaser.Math.Between(0, GAME.WIDTH);
  const y = Phaser.Math.Between(0, GAME.HEIGHT);
  const size = Phaser.Math.Between(1, 3);
  const star = this.add.circle(x, y, size, 0xffffff, Phaser.Math.FloatBetween(0.1, 0.5));
  star.setDepth(-1);

  // Twinkle effect
  this.tweens.add({
    targets: star,
    alpha: Phaser.Math.FloatBetween(0.1, 0.3),
    duration: Phaser.Math.Between(1000, 3000),
    yoyo: true,
    repeat: -1,
  });
}
```

**Step 2: Verify starfield**

Run: `npm run dev`

Expected: Twinkling stars in background.

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: add twinkling starfield background"
```

---

## Task 9: Final Testing & Tuning

**Step 1: Playtest and adjust constants**

Test the game and adjust these values in `constants.ts` for best feel:
- `FLAP_VELOCITY`: How strong the flap is (-300 default)
- `GRAVITY`: How fast you fall (800 default)
- `PIPE_GAP`: Gap size (180 default)
- `SCROLL_SPEED`: Game speed (200 default)
- `PIPE_SPAWN_INTERVAL`: Time between pipes (1800ms default)

**Step 2: Add npm scripts to package.json**

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  }
}
```

**Step 3: Build production version**

Run:
```bash
npm run build
```

Expected: `dist/` folder with production build.

**Step 4: Final commit**

```bash
git add -A
git commit -m "chore: finalize game tuning and build config"
```

---

## Summary

After completing all tasks you will have:
- Playable Flappy Snake game in browser
- Neon visual style with glow effects
- Score tracking with local high score
- Smooth snake physics with trailing segments
- Production build ready for Capacitor wrapping

**Next steps (not in this plan):**
- Add audio effects
- Add Capacitor for iOS/Android
- Deploy to web hosting
