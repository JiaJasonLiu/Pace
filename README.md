# Pace

Pace is a personal budgeting app: track spending and recurring transactions, manage wallets and categories, set lifestyle goals, and adjust preferences in one place. Data is stored locally in the browser (IndexedDB via Dexie) for a fast, private workflow.

## Features

- **Spending** — Transactions, recurring items, and categories
- **Wallets** — Multiple wallets and balances
- **Lifestyle** — Goals and lifestyle settings tied to your plan
- **Settings** — Categories, currency, and app configuration

## Stack

React 19, Vite, TypeScript, Tailwind CSS, Dexie, and PWA support via `vite-plugin-pwa`.

## Run locally

**Prerequisites:** Node.js (LTS recommended)

1. Install dependencies:

   ```bash
   npm install
   ```
   
3. Start the dev server:

   ```bash
   npm run dev
   ```

   The app is served on port **3000** by default.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview the production build |
| `npm run lint` / `npm run lint:fix` | Lint with Biome |
| `npm run format` / `npm run format:fix` | Format with Biome |
| `npm run typecheck` | TypeScript (`tsc --noEmit`) |
