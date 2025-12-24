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
