# BurnUp-Generator

Sprint-based burnup chart generator. Visualize scope, completed work, and the ideal reference line across sprints.

## Features

- Interactive burnup chart with Scope, Completed, and Ideal lines
- Per-line customization: line type (linear/step), area fill, and color
- Settings apply on explicit confirmation (draft pattern)
- URL-persisted state — share charts via link
- Snapshot history (session-only)
- Dark/light theme with system preference detection
- GitHub Pages deployment ready

## Getting Started

```bash
pnpm install
pnpm dev
```

## Deploy to GitHub Pages

```bash
pnpm deploy
```

This builds the project and pushes the `dist/` folder to the `gh-pages` branch.

## Tech Stack

- React 19 + Vite
- Recharts
- pako (URL compression)
- html-to-image (chart export)
