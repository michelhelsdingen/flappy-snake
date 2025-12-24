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
