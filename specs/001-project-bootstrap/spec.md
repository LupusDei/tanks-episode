# Spec 001 — Project Bootstrap

**Created**: 2026-03-10
**Status**: Draft
**Depends On**: None
**Execution**: Serial (single agent)
**Reference**: [Master Plan](../../tanks_plan.md)

---

## Goal

Scaffold the project foundation: Vite + React + TypeScript, tooling, type definitions, and directory structure with placeholder files. This spec produces no visible UI or game logic — it exists solely to unblock parallel work in Specs 002 and 003.

**Exit Criteria**: `npx tsc -b && npx eslint . && npx vitest run` all pass clean (even if there are zero tests yet). Every file in the directory structure exists (even if empty/placeholder). All type definitions compile.

---

## Tasks

> All tasks are sequential — single agent, single track.

### T001 — Initialize Project

Initialize a Vite + React + TypeScript project in the repository root.

**Deliverables**:
- `package.json` with React 18, TypeScript, Vite, Vitest, React Testing Library, ESLint
- `tsconfig.json` with strict mode enabled, no `any` types (`noImplicitAny: true`)
- `vite.config.ts` configured for React
- `vitest.config.ts` or Vitest configured within `vite.config.ts`
- ESLint config with TypeScript support
- `.gitignore` updated for node_modules, dist, coverage
- `npm install` runs clean
- `npx tsc -b` compiles with zero errors
- `npx eslint .` passes clean
- Basic `src/main.tsx` entry point rendering a placeholder `<App />`
- Basic `src/App.tsx` with a placeholder div
- Basic `src/App.css` and `src/index.css`

### T002 — Define Type System

Define all TypeScript interfaces, types, and enums in `src/types/game.ts`.

**Must include** (see Master Plan → Key Entities for full property lists):

```typescript
// Enums
GamePhase       // 'nameEntry' | 'config' | 'shop' | 'playing' | 'gameOver'
WeaponType      // 'standard' | 'sniper' | 'heavy'
AIDifficulty    // 'blindFool' | 'private' | 'veteran' | 'centurion' | 'primus'
TerrainSize     // 'small' | 'medium' | 'large' | 'huge' | 'epic'

// Interfaces
Position        // { x: number, y: number }
Velocity        // { vx: number, vy: number }
TerrainConfig   // { width: number, height: number } — per TerrainSize
TerrainData     // { heights: number[], width: number, height: number }
TankState       // id, name, position, barrelAngle, hp, maxHp, color, isPlayer, isAlive, fuel, queuedShot
Shot            // angle, power, weaponType, ownerTankId
WeaponConfig    // type, name, description, damage, blastRadius, cost, ammo, speedMultiplier, explosionColor
ExplosionColor  // { center: string, outer: string }
ProjectileState // position, velocity, weaponType, ownerTankId, active, trail
ExplosionState  // position, radius, maxRadius, phase, particles, weaponType, timer
Particle        // position, velocity, color, life, maxLife
Wind            // { speed: number }
GameState       // phase, turnNumber, tanks, terrain, wind, selectedWeapon, winner, projectiles, explosions
StoredPlayerProfile // name, balance, stats, weaponInventory (see Master Plan → LocalStorage Schema)
PlayerStats     // gamesPlayed, gamesWon, totalKills
WeaponInventory // { sniper: number, heavy: number }
DifficultyConfig // { angleVariance: number, powerVariance: number, multiplier: number }
```

**Also define**:
- `TERRAIN_CONFIGS`: Record mapping TerrainSize → { width, height } (see Master Plan → Terrain Size Configurations)
- `DIFFICULTY_CONFIGS`: Record mapping AIDifficulty → DifficultyConfig (see Master Plan → AI Difficulty Variance Table)

**Acceptance**: `npx tsc -b` compiles with zero errors. All types are exported.

### T003 — Create Directory Structure

Create every file listed in the Master Plan → Architecture → Directory Structure. Files should be valid TypeScript with minimal placeholder content (export an empty object, a no-op function, or a stub React component as appropriate).

**Engine files** (`src/engine/*.ts`):
- `physics.ts` — export placeholder functions: `calculateVelocity`, `updateProjectilePosition`, `worldToScreen`, `screenToWorld`
- `terrain.ts` — export placeholder functions: `generateTerrain`, `getTerrainHeight`, `carveCrater`
- `ai.ts` — export placeholder functions: `calculateAIShot`, `selectTarget`
- `weapons.ts` — export placeholder: `WEAPON_CONFIGS`, `calculateDamage`
- `projectile.ts` — export placeholder functions: `createProjectile`, `updateProjectile`, `checkTerrainCollision`, `checkTankCollision`
- `explosion.ts` — export placeholder functions: `createExplosion`, `updateExplosion`
- `tank.ts` — export placeholder functions: `placeTanks`, `generateAINames`
- `wind.ts` — export placeholder functions: `generateInitialWind`, `updateWind`

**Test files** (`src/engine/*.test.ts`):
- One test file per engine module with a single placeholder `describe` block and a passing `it('placeholder', ...)` test.

**Context files** (`src/context/*.tsx`):
- `GameContext.tsx` — stub React context with default value
- `UserContext.tsx` — stub React context with default value

**Component files** (`src/components/*.tsx`):
- `Canvas.tsx`, `ControlPanel.tsx`, `WeaponSelectionPanel.tsx`, `PlayerNameEntry.tsx`, `GameConfigScreen.tsx`, `WeaponShop.tsx`, `GameOverScreen.tsx`, `TurnIndicator.tsx`, `WindIndicator.tsx` — each exports a stub component rendering a `<div>` with the component name.

**Service files** (`src/services/*.ts`):
- `storage.ts` — export placeholder functions: `saveProfile`, `loadProfile`, `clearProfile`

**Hook files** (`src/hooks/*.ts`):
- `useKeyboard.ts` — export a placeholder hook that returns void

**Style files** (`src/styles/*`):
- `theme.ts` — export empty design token objects (colors, fonts, spacing)

**Acceptance**: `npx tsc -b` compiles. `npx eslint .` passes. `npx vitest run` runs all placeholder tests green. No file is missing from the expected structure.

---

## Checkpoint

```bash
npx vitest run && npx eslint . && npx tsc -b
```

All three pass clean. The project is a compilable, lintable, testable skeleton ready for parallel engine development in Spec 002.
