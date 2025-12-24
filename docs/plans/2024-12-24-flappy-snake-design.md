# Flappy Snake - Game Design Document

## Concept

Een slang vliegt horizontaal door het scherm. Tap om omhoog te gaan, loslaten = vallen. Ontwijkt verticale buizen met gaten. Elke gepasseerde buis = slang wordt langer = moeilijker.

## Core Gameplay

- **Controls:** Single tap = boost omhoog. Geen tap = vallen door gravity.
- **Doel:** Zo veel mogelijk buizen passeren
- **Groei:** Elke buis die je doorkomt = +1 segment aan je slang
- **Death:** Raakt buis, grond of plafond = game over
- **Score:** Aantal buizen gepasseerd

### De Twist

De slang wordt langer bij elke buis. Bij 1 segment is het makkelijk, bij 20 segmenten moet je hele lichaam door dat gat. Dit is de enige moeilijkheidscurve - buizen blijven gelijk.

## Visuele Stijl

**Thema:** Neon/Glow op donkere achtergrond

| Element | Stijl |
|---------|-------|
| Achtergrond | Donker paars/blauw (#0a0a1a), subtiele sterren/grid |
| Slang | Fel groen/cyaan glow, cirkels met soft glow, oogjes op kop |
| Buizen | Neon roze/magenta met glow edges |
| UI | Minimaal, wit met glow |

### Animaties & Juice

- Slang segmenten volgen kop met slight delay (wave-effect)
- Screen shake bij death
- Particles bij passeren buis
- Oogjes kijken naar bewegingsrichting

### Audio

- Swoosh bij tap
- Pling bij buis passeren
- Bass impact bij death
- Geen/optionele achtergrondmuziek

## Schermen

### Menu
- Titel "FLAPPY SNAKE" met neon glow
- "TAP TO START" knipperend
- Highscore onderaan

### Game
- Score groot bovenin
- Hele scherm is tap-zone
- Geen pauze knop

### Game Over
- Overlay op frozen game
- Score + "NEW BEST!" indicator
- "TAP TO RETRY"
- Tap gaat direct naar nieuwe game (niet menu)

## Technische Stack

- **Phaser 3** - Game engine
- **TypeScript** - Type safety
- **Vite** - Bundler
- **Capacitor** - iOS/Android wrapper

## Project Structuur

```
/src
  /scenes
    Boot.ts       # Asset loading
    Menu.ts       # Start scherm
    Game.ts       # Hoofdgame
    GameOver.ts   # Score + restart
  /entities
    Snake.ts      # Slang logica + rendering
    Pipe.ts       # Buis generator
  /utils
    constants.ts  # Game settings
  main.ts         # Phaser config
/assets
  /audio
  /images
```

## Physics

- Arcade physics voor gravity + collision
- Snake kop heeft hitbox
- Segmenten volgen path van kop (geen eigen physics)
- Buizen zijn static bodies

## Success Metrics

- Instant restart (<100ms)
- 60 FPS op mid-range devices
- <5MB initial load
- "Nog één keer" gevoel
