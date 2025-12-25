# Flappy Snake - Project Status

## Version
**v1.1.0**

## Live URLs
- **Production:** https://flappy.helsdingen.com
- **Cloudflare Pages:** https://flappy-snake.pages.dev
- **GitHub:** https://github.com/michelhelsdingen/flappy-snake

## Deployment
- **Platform:** Cloudflare Pages
- **Auto-deploy:** Bij elke `git push` naar `main`
- **Build command:** `npm run build`
- **Output directory:** `dist`

## Features
- 🎄 Christmas theme (snowflakes, festive colors, holiday avatars)
- 🎁 Christmas gift collectibles (5-10 coins per gift)
- 🪙 Coins & diamonds
- 🛡️ Power-ups: Shield, Slow-mo, Magnet
- 🏆 Leaderboard (Cloudflare D1 + Workers)
- 📱 Mobile-friendly met touch controls
- ✨ Particle effects en animaties
- 🏷️ Version number in menu

## Tech Stack
- **Framework:** Phaser 3
- **Build tool:** Vite
- **Language:** TypeScript
- **Backend:** Cloudflare D1 + Workers (leaderboard API)
- **Hosting:** Cloudflare Pages

## API Endpoints
- **Base URL:** https://flappy-snake-api.michel-91a.workers.dev/api
- `GET /leaderboard` - Top 10 scores
- `POST /scores` - Add new score
- `GET /highscore` - Highest score

## Development
```bash
npm run dev    # Start dev server op localhost:5173
npm run build  # Build naar dist/
```

## Changelog

### v1.1.0 (2025-12-25)
- Migratie van lokale SQLite naar Cloudflare D1
- Cloudflare Worker API voor leaderboard
- Versienummer toegevoegd aan menu scherm
- .gitignore toegevoegd

### v1.0.0 (2025-12-25)
- Initial release
- Cloudflare Pages deployment + custom domain
