# Skyward — Flappy Bird ✨

A beautiful flappy-bird-style game with dynamic sky gradients, parallax clouds, particle effects, and collectible star coins.

[![CI](https://github.com/YOUR_USERNAME/skyward/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/skyward/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)

## How to Play

Tap or press **Space** to flap. Fly through the pipe gaps. Collect ★ coins for bonus points. Don't hit the pipes or ground!

### Controls

| Action | Input |
|---|---|
| Flap / Start / Restart | Tap (mobile) or Spacebar (desktop) |

## Features

- **Dynamic sky** — gradient colors shift through a sunset palette
- **Parallax clouds** — 3 depth layers for depth effect
- **Animated bird** — wing flaps, smooth rotation based on velocity
- **Golden pipes** — gradient green with gold-rimmed openings
- **Star coins** — collectible coins in pipe gaps for bonus score
- **Particle effects** — feathers on flap, sparkles on coin pickup, explosion on death
- **Screen shake** — feedback on collision
- **Score pop animation** — score bounces when increased
- **High score** — persists across sessions

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

## Build

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
├── main.ts           Entry point, canvas setup, game loop
├── game/
│   ├── flappy.ts     Bird, pipes, coins, particles, game state
│   └── background.ts Sky gradient, clouds, ground rendering
```

## Tech Stack

- TypeScript 5.7 (strict mode)
- Vite 6
- HTML5 Canvas
- No external dependencies

## License

MIT
