# Tank Battle — Master Plan

**Created**: 2026-03-10
**Status**: Draft — awaiting review

---

## Vision

A browser-based, turn-based artillery game inspired by the classic **Scorched Earth** (1991). A human player battles 1–10 AI tanks on destructible, procedurally-generated terrain. Players adjust barrel angle and shot power, accounting for wind, to destroy opponents. Explosions carve craters into the terrain, reshaping the battlefield as the match progresses. Features a pre-battle weapon shop, configurable difficulty tiers, simultaneous turn resolution, and a persistent credit economy.

The game will be built incrementally across **8 specs**, each deliverable as a working milestone. By the end of Spec 003, we have a basic playable Scorched Earth game. Subsequent specs layer on configuration, visual polish, weapons, economy, advanced AI, and final polish.

---

## Technology Stack

| Layer | Choice |
|-------|--------|
| Framework | React 18 + TypeScript (strict mode) |
| Build Tool | Vite |
| Rendering | HTML5 Canvas (2D context) |
| Testing | Vitest + React Testing Library |
| Styling | CSS (no UI framework) |
| State | React Context API |
| Persistence | Browser LocalStorage |

---

## Assumptions

1. The game is **single-player only** (1 human vs AI opponents). No multiplayer networking.
2. AI tanks use only the standard shell. Only the human player accesses the weapon shop.
3. No armor system. Tanks have flat 100 HP.
4. No tank movement fuel display is needed in the UI beyond the movement responding to Q/E keys.
5. Mobile responsiveness is not required (desktop-first).
6. No tutorial or help screen.
7. The player name entry is a simple text input, not a full account system.
8. **Terrain IS destructible** — explosions carve craters, tanks settle to new terrain height.
9. No advanced weapons beyond the initial three (no homing, cluster, bouncing, EMP, napalm, or bunker buster).
10. No campaign mode, sound effects, or animated loading screen.

---

## Architecture

### Directory Structure

```
src/
├── main.tsx                    # React entry point
├── App.tsx                     # Root component, phase routing
├── types/
│   └── game.ts                 # All TypeScript interfaces and enums
├── engine/                     # Pure game logic (NO React imports)
│   ├── physics.ts              # Trajectory, velocity, gravity
│   ├── physics.test.ts         # Physics unit tests
│   ├── terrain.ts              # Midpoint displacement, height lookup, crater carving
│   ├── terrain.test.ts         # Terrain unit tests
│   ├── ai.ts                   # AI targeting, difficulty variance
│   ├── ai.test.ts              # AI unit tests
│   ├── weapons.ts              # Weapon configs, damage calc
│   ├── weapons.test.ts         # Weapon unit tests
│   ├── projectile.ts           # Creation, collision detection
│   ├── projectile.test.ts      # Projectile unit tests
│   ├── explosion.ts            # State machine, particles
│   ├── explosion.test.ts       # Explosion unit tests
│   ├── tank.ts                 # Placement, rendering helpers
│   ├── tank.test.ts            # Tank unit tests
│   └── wind.ts                 # Generation, per-turn updates
├── context/
│   ├── GameContext.tsx          # Game state (phase, tanks, terrain, turns)
│   └── UserContext.tsx          # Player profile (balance, stats)
├── components/
│   ├── Canvas.tsx              # Main game canvas (rendering loop)
│   ├── ControlPanel.tsx        # Angle, power, fire, weapon selector
│   ├── WeaponSelectionPanel.tsx # In-battle weapon chooser
│   ├── PlayerNameEntry.tsx     # Name input screen
│   ├── GameConfigScreen.tsx    # Battle configuration
│   ├── WeaponShop.tsx          # Pre-battle weapon purchase
│   ├── GameOverScreen.tsx      # Winner + earnings
│   ├── TurnIndicator.tsx       # Turn number display
│   └── WindIndicator.tsx       # Wind speed + direction
├── services/
│   └── storage.ts              # LocalStorage CRUD
├── hooks/
│   └── useKeyboard.ts          # Keyboard event handler
└── styles/
    ├── theme.ts                # Design tokens (colors, fonts, spacing)
    └── *.css                   # Component styles
```

**Key constraint**: Engine files (`src/engine/`) must be pure TypeScript with zero React imports. All game logic (physics, AI, damage) lives here as pure functions for testability.

### Game Phase State Machine

```
[PlayerNameEntry] → [GameConfig] → [WeaponShop] → [Playing] → [GameOver]
                         ↑                                         │
                         └─────────────── "Play Again" ────────────┘
```

### Canvas Rendering Pipeline (per frame)

```
1. Clear canvas
2. Draw sky gradient background
3. Draw terrain (filled polygon from height array)
4. Draw all alive tanks (body, wheels, turret, barrel)
5. Draw tank labels (name, health bar)
6. Draw current-turn indicator (arrow above active tank)
7. Draw active projectiles (circle + dotted trail)
8. Draw active explosions (expanding circle + particles)
9. Draw destruction animations (debris + particles)
```

---

## Key Entities

```typescript
// Player profile — persisted in LocalStorage
Player {
  name: string                    // 1–20 characters
  balance: number                 // credits, starts at 500
  stats: {
    gamesPlayed: number
    gamesWon: number
    totalKills: number
  }
  weaponInventory: {
    sniper: number                // ammo count owned
    heavy: number                 // ammo count owned
  }
}

// In-game tank state
Tank {
  id: string
  name: string                    // player name or AI military name
  position: { x: number, y: number }
  barrelAngle: number             // UI angle: -120 to +120, 0 = up
  hp: number                      // current hit points
  maxHp: number                   // always 100
  color: string
  isPlayer: boolean
  isAlive: boolean
  fuel: number                    // movement fuel budget
  queuedShot: Shot | null         // pending shot for simultaneous resolution
}

// Terrain data
Terrain {
  heights: number[]               // height value at each X pixel
  width: number                   // canvas width in pixels
  height: number                  // canvas height in pixels
}

// Projectile in flight
Projectile {
  position: { x: number, y: number }
  velocity: { vx: number, vy: number }
  weaponType: WeaponType
  ownerTankId: string
  active: boolean
  trail: { x: number, y: number }[]  // trail points for dotted line
}

// Weapon definition
Weapon {
  type: WeaponType                // 'standard' | 'sniper' | 'heavy'
  name: string
  description: string
  damage: number                  // percentage of max HP (35, 100, 65)
  blastRadius: number             // pixels (20, 12, 35)
  cost: number                    // credits (0, 200, 250)
  ammo: number                    // current count (Infinity for standard)
  speedMultiplier: number         // projectile speed factor (1.0, 1.3, 0.8)
  explosionColor: {
    center: string
    outer: string
  }
}

// Wind state
Wind {
  speed: number                   // -30 to +30 m/s (positive = right, negative = left)
}

// Overall game state
GameState {
  phase: GamePhase                // 'nameEntry' | 'config' | 'shop' | 'playing' | 'gameOver'
  turnNumber: number
  tanks: Tank[]
  terrain: Terrain
  wind: Wind
  selectedWeapon: WeaponType
  winner: Tank | null
  projectiles: Projectile[]
  explosions: Explosion[]
}
```

---

## Architecture Reference

### Physics Model

```
Coordinate System:
  - World: Y=0 at bottom, Y increases upward (math convention)
  - Screen: Y=0 at top, Y increases downward (canvas convention)
  - Conversion: screenY = canvasHeight - worldY

Projectile Motion:
  - vx = power * POWER_SCALE * cos(physicsAngle)
  - vy = power * POWER_SCALE * sin(physicsAngle)
  - x(t) = x0 + vx*t + 0.5*windAccel*t^2
  - y(t) = y0 + vy*t - 0.5*gravity*t^2

Constants:
  - POWER_SCALE ≈ 1.12 (calibrated so 100% power at 70° ≈ terrain width)
  - gravity = 10 px/s²
  - windAccel = wind * 0.15 px/s² per m/s of wind

Angle Conversion:
  - UI angle: 0=up, positive=left, negative=right, range ±120°
  - Physics angle: 0=right, 90=up (standard math)
  - physicsAngle = 90 - uiAngle (in degrees, then convert to radians)

Animation:
  - Visual speed multiplier: 5× (makes projectiles visually faster without changing physics)
  - dt per frame: (1/60) * speedMultiplier
```

### Wind Model

```
Initial wind:
  normalRandom(mean=0, stdDev=10), clamped to ±30

Per-turn update:
  newWind = oldWind * 0.7 + normalRandom(mean=0, stdDev=5)
  Clamp to ±30 m/s
```

### AI Shot Calculation

```
1. Select target (prefer same target as last turn if still alive)
2. Calculate ideal angle and power to hit target:
   - Use iterative/analytical solution accounting for gravity and wind
   - Binary search or direct formula for angle given distance and height difference
3. Add random variance based on difficulty:
   - actualAngle = idealAngle + random(±angleVariance)
   - actualPower = idealPower + random(±powerVariance)
4. Clamp to valid ranges (angle: ±120°, power: 0-100%)
```

### AI Difficulty Variance Table

| Difficulty | Angle Variance | Power Variance |
|-----------|----------------|----------------|
| Blind Fool | ±30° | ±40 |
| Private | ±15° | ±25 |
| Veteran | ±8° | ±15 |
| Centurion | ±4° | ±8 |
| Primus | ±2° | ±4 |

### Damage Model

```
For each explosion at position (ex, ey) with weapon W:
  For each alive tank at position (tx, ty):
    distance = sqrt((ex-tx)^2 + (ey-ty)^2)
    if distance <= W.blastRadius:
      tank.hp -= W.damagePercent  (percentage of maxHP)
      if tank.hp <= 0:
        trigger destruction animation
        mark tank as dead
```

### Destructible Terrain Model

```
When an explosion occurs at position (ex, ey) with weapon W:
  For each X pixel in range [ex - blastRadius, ex + blastRadius]:
    dx = X - ex
    carveDepth = blastRadius - abs(dx)  (circular crater profile)
    terrain.heights[X] = min(terrain.heights[X], ey - carveDepth)
    Clamp terrain.heights[X] to >= 0

After terrain modification:
  For each alive tank:
    newTerrainY = terrain.heights[tank.position.x]
    if tank.position.y > newTerrainY:
      tank.position.y = newTerrainY  (tank settles to new ground level)
```

### Economy Model

```
Starting balance: 500 credits
Per kill: 200 * difficultyMultiplier
Win bonus: 250 * difficultyMultiplier
Loss consolation: 50 * difficultyMultiplier

Difficulty multipliers:
  Blind Fool: 0.5×
  Private: 0.75×
  Veteran: 1.0×
  Centurion: 1.25×
  Primus: 1.5×
```

### Weapon Configurations

```typescript
const WEAPONS = {
  standard: {
    name: "Standard Shell",
    damage: 35,            // percentage of max HP
    blastRadius: 20,       // pixels
    cost: 0,
    ammo: Infinity,
    speedMultiplier: 1.0,
    description: "Basic explosive shell. Reliable and free.",
    explosionColor: { center: "#FF4400", outer: "#FF8800" }
  },
  sniper: {
    name: "Sniper Shot",
    damage: 100,           // instant kill
    blastRadius: 12,       // very small — must be precise
    cost: 200,
    ammo: 0,               // must purchase
    speedMultiplier: 1.3,  // faster projectile
    description: "Precision round. One-shot kill but tiny blast radius.",
    explosionColor: { center: "#FFFFFF", outer: "#4488FF" }
  },
  heavy: {
    name: "Heavy Artillery",
    damage: 65,
    blastRadius: 35,       // large area
    cost: 250,
    ammo: 0,               // must purchase
    speedMultiplier: 0.8,  // slower, heavier
    description: "Massive blast radius. Doesn't need to be accurate.",
    explosionColor: { center: "#FF2200", outer: "#FF6600" }
  }
}
```

### LocalStorage Schema

```typescript
interface StoredPlayerProfile {
  name: string
  balance: number
  stats: {
    gamesPlayed: number
    gamesWon: number
    totalKills: number
  }
  weaponInventory: {
    sniper: number    // ammo count owned
    heavy: number     // ammo count owned
  }
}

// Storage key: "tank-battle-player"
// Serialization: JSON.stringify / JSON.parse
```

### Quantitative Constants Reference

| Constant | Value | Notes |
|----------|-------|-------|
| POWER_SCALE | 1.12 | Calibrated: 100% power at 70° ≈ terrain width |
| Gravity | 10 px/s² | Constant downward acceleration |
| Wind acceleration factor | 0.15 | windAccel = wind × 0.15 px/s² |
| Wind decay factor | 0.7 | Per-turn regression-to-mean multiplier |
| Wind initial stdDev | 10 | Normal distribution for first-turn wind |
| Wind per-turn stdDev | 5 | Normal distribution for wind change |
| Wind bounds | ±30 m/s | Hard clamp |
| Visual speed multiplier | 5× | Animation speed-up (no physics change) |
| Frame dt | (1/60) × speedMultiplier | Per-frame time step |
| Tank body width | ~50 px | Approximate rendering dimension |
| Tank body height | ~16 px | Approximate rendering dimension |
| Tank starting HP | 100 | Flat, no armor system |
| Angle range | -120° to +120° | 0 = straight up |
| Power range | 0% to 100% | Maps to velocity via POWER_SCALE |
| Shift modifier | 5× | Keyboard adjustment speed multiplier |
| Starting credits | 500 | Initial player balance |
| Kill reward | 200 | Before difficulty multiplier |
| Win bonus | 250 | Before difficulty multiplier |
| Loss consolation | 50 | Before difficulty multiplier |
| Standard Shell damage | 35% of max HP | 20px blast radius |
| Sniper Shot damage | 100% of max HP | 12px blast radius |
| Heavy Artillery damage | 65% of max HP | 35px blast radius |
| Explosion duration | 1–2 seconds | Growing → peak → fading → done |
| Destruction animation | ~2 seconds | Tank debris + particles |

### Terrain Size Configurations

| Size | Width (px) | Height (px) |
|------|-----------|-------------|
| Small | 800 | 600 |
| Medium | 1024 | 768 |
| Large | 1280 | 960 |
| Huge | 1600 | 1200 |
| Epic | 2100 | 2800 |

---

## Spec Sequence Overview

```
┌─────────────────────────────────────────────────────┐
│  001 — Project Bootstrap (Serial, single agent)     │
│  Setup Vite, TS, types, directory structure         │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  002 — Core Engine (parallel tracks)                │
│  Terrain, physics, wind, tanks, projectiles,        │
│  explosions, weapons — all with tests               │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────┐
│  003 — Minimal Playable Battle (parallel tracks)     │
│  Canvas, controls, AI, turns, win detection          │
│  ★ MILESTONE: Basic Scorched Earth is playable ★     │
└──────────────────────┬───────────────────────────────┘
                       │
       ┌───────┬───────┴───────┬───────┐
       ▼       ▼               ▼       ▼
   ┌──────┐┌──────┐       ┌──────┐┌──────┐
   │ 004  ││ 005  │       │ 006  ││ 007  │
   │Game  ││Design│       │Wpns &││ AI & │
   │Flow &││System│       │Econ  ││Diff  │
   │Config││& UI  │       │      ││Tiers │
   └──┬───┘└──┬───┘       └──┬───┘└──┬───┘
      │       │               │       │
      └───────┴───────┬───────┴───────┘
                      │
                      ▼
              ┌──────────────┐
              │ 008 — Final  │
              │ Polish &     │
              │ Integration  │
              └──────────────┘
```

### Dependency Rules

| Spec | Depends On | Can Parallel With |
|------|-----------|-------------------|
| 001 | — | — (serial) |
| 002 | 001 | — (must complete before 003) |
| 003 | 002 | — (must complete before 004–007) |
| 004 | 003 | 005, 006, 007 |
| 005 | 003 | 004, 006, 007 |
| 006 | 003 | 004, 005, 007 |
| 007 | 003 | 004, 005, 006 |
| 008 | 004, 005, 006, 007 | — (final integration) |

---

## Spec Summaries

### Spec 001 — Project Bootstrap
**Scope**: Serial, single agent. Scaffold Vite + React + TypeScript project. Configure Vitest, ESLint, tsconfig strict. Define all TypeScript interfaces and type enums in `src/types/game.ts`. Create directory structure with placeholder files for every engine module, component, context, service, and hook. Minimal — just enough to unblock parallel work.

### Spec 002 — Core Engine
**Scope**: All pure engine modules with full test coverage. No UI, no React. Includes:
- **Terrain**: Midpoint displacement generation with seeded RNG, height interpolation, terrain size configs, crater carving function (modifying height array within blast radius), tank settling after terrain destruction. Tests for: valid heights, interpolation accuracy, all 5 sizes, crater depth correctness, tank settling.
- **Physics**: Velocity from power/angle, projectile position at time t, coordinate conversion world↔screen, gravity constant, power scale calibration, angle conversion UI↔physics. Tests for: trajectory symmetry, known outcomes, coordinate round-trips.
- **Wind**: Initial generation from N(0,10), per-turn regression-to-mean update, ±30 clamping. Tests for: bounds enforcement, regression toward zero.
- **Tank**: Placement on terrain at even spacing, dimensions/rendering constants, AI name pool, color assignment avoiding player color. Tests for: correct terrain heights, even spacing, no duplicate colors.
- **Projectile**: Creation from tank+angle+power+weapon, animation step function, terrain collision (Y check), tank collision (proximity within blast radius), out-of-bounds detection. Tests for: collision at correct height, blast proximity, OOB.
- **Explosion**: State machine (growing → peak → fading → done), particle generation with physics, weapon-specific colors, destruction animation state with debris. Tests for: state transitions, duration timing, particle bounds.
- **Weapons**: Three weapon definitions with damage/blast/cost/speed/colors, damage calculation function, economy constants and difficulty multipliers. Tests for: correct damage values, blast checks, economy math.

### Spec 003 — Minimal Playable Battle
**Scope**: Bring the engine to screen. **By the end of this spec, you can play a basic Scorched Earth battle.** Includes:
- **Canvas**: requestAnimationFrame loop, sky gradient, terrain rendering (filled polygon from height array, re-rendered after crater carving), world-to-screen coordinate conversion, canvas sizing from terrain config.
- **Tank rendering**: Body, wheels, turret with rotation, barrel at current angle, colors, floating name labels, health bars with percentage fill, current-turn arrow indicator.
- **Player controls**: ControlPanel component (angle display+slider, power display+slider, Fire button, disabled when not player's turn). useKeyboard hook (W/S or ↑/↓ for angle ±1°, A/D or ←/→ for power ±1%, Shift for 5×, Space/Enter to fire, Q/E for movement, disabled when not player's turn).
- **Projectile rendering**: Animate projectile circle along trajectory, dotted trail, multiple simultaneous projectiles, remove on collision/OOB.
- **Explosion rendering**: Expanding circle with weapon-colored particles, tank destruction animation with debris.
- **Basic AI**: Single difficulty level (Veteran: ±8° angle, ±15 power). Selects target, calculates shot with wind, adds variance.
- **Turn system**: Player fires → queue AI shots → create all projectiles → animate simultaneously → detect collisions → apply damage → carve terrain craters → settle tanks → check for deaths → trigger explosions/destructions → check win condition → advance turn or end game.
- **Game context**: Minimal state management for battle phase — tanks, terrain, wind, turns, winner detection.
- **Minimal game flow**: Straight into battle with hardcoded defaults (Medium terrain, 3 AI, Veteran). Simple restart button on game over. No name entry, no config screen, no shop yet.

### Spec 004 — Game Flow & Configuration
**Scope**: Full game phase state machine and all non-battle screens. Includes:
- **Phase routing**: App.tsx renders correct component based on game phase. Wraps app in context providers.
- **PlayerNameEntry**: Text input (1–20 chars), "Start" button, calls phase transition.
- **GameConfigScreen**: Terrain size selector (5 options with pixel dimensions), enemy count selector (1–10 slider), difficulty dropdown (5 levels), color selection (8+ swatches). Defaults: Medium/3/Veteran. "Start Battle" button.
- **GameOverScreen**: Winner name display, "Play Again" button returning to config phase.
- **LocalStorage service**: Save/load/clear player profile, JSON serialization, handle missing/corrupted data. Storage key: `"tank-battle-player"`.
- **UserContext**: Player name, balance, stats, weapon inventory. Loads from storage on mount, saves on change.
- **Persistence**: Stats tracked — games played, games won, total kills. Load existing profile on return visits.

### Spec 005 — Scorched Earth Design System & Visual Polish
**Scope**: War-torn visual aesthetic inspired by the original Scorched Earth. Includes:
- **Design tokens**: Full color palette, typography scale, spacing system in `styles/theme.ts`.
- **Sky**: Gradient from deep black-blue (#0A0E1A) at top to dark indigo (#1A1A3E) at horizon.
- **Terrain visuals**: Gradient fill (olive green grass on top → earth brown below), subtle noise texture, crater visual detail (exposed dirt, darkened edges).
- **Tank visuals**: Refined body with angled front, visible treads/wheels, turret shadow, color fill with darker outline.
- **Explosion upgrade**: Radial gradient with weapon-specific colors, debris particles with gravity, brief screen flash on large explosions, lingering smoke particles.
- **UI panels**: Dark semi-transparent with 1px #3A3A3A border, subtle top highlight, 4px rounded corners.
- **Control panel**: Bottom-of-screen panel with military/industrial styling, monospace readouts for angle/power/wind.
- **Screen styling**: Centered card layouts, military amber accents, uppercase button text with hover glow, dark input fields with amber focus border.
- **Indicators**: Wind and turn indicators positioned at top of viewport, styled with design system.
- **Screen transitions**: Fade or slide transitions between game phases.
- **Tank name labels**: Small caps, letter-spaced, above health bar.
- **Health bar**: Thin strip, olive green → blood red gradient based on HP percentage.

### Spec 006 — Weapons & Economy
**Scope**: Three distinct weapon types with unique behaviors and visuals, plus the full credit economy. Includes:
- **Standard Shell**: Free, ∞ ammo, 35% damage, 20px blast, 1.0× speed, explosion color center #FF4400 / outer #FF8800.
- **Sniper Shot**: 200 credits, purchased ammo, 100% damage (instant kill), 12px blast, 1.3× speed, explosion color center #FFFFFF / outer #4488FF.
- **Heavy Artillery**: 250 credits, purchased ammo, 65% damage, 35px blast, 0.8× speed, explosion color center #FF2200 / outer #FF6600.
- **WeaponShop component**: Displays before each battle. Each listing shows name, description, damage, blast radius, cost per unit, buy button. Player balance prominently displayed. Buy button disabled when insufficient funds. "Ready for Battle" / "Skip" button to proceed.
- **WeaponSelectionPanel component**: In-battle weapon chooser showing owned weapons with ammo counts. Highlight selected weapon. Gray out weapons at 0 ammo (unselectable). Click to switch active weapon.
- **Ammo management**: Selecting non-standard weapon for shot. Firing decrements ammo by 1. At 0 ammo, weapon unselectable. Standard Shell always available with infinite ammo.
- **Economy system**: Starting balance 500 credits. Kill reward 200 × difficulty multiplier. Win bonus 250 × difficulty multiplier. Loss consolation 50 × difficulty multiplier. Multipliers: Blind Fool 0.5×, Private 0.75×, Veteran 1.0×, Centurion 1.25×, Primus 1.5×.
- **Earnings display**: GameOverScreen updated with earnings breakdown (kills count, kill earnings, win/loss bonus, difficulty multiplier applied, total earned, new balance).
- **Balance persistence**: Balance and weapon inventory persist in LocalStorage across sessions via UserContext.

### Spec 007 — Advanced AI & Difficulty Tiers
**Scope**: Five difficulty levels with calibrated accuracy, intelligent targeting, and wind-aware calculation. Includes:
- **Difficulty tiers with variance**:
  - Blind Fool: angle ±30°, power ±40 — comically inaccurate
  - Private: angle ±15°, power ±25 — novice, mostly misses
  - Veteran: angle ±8°, power ±15 — competent, lands shots nearby
  - Centurion: angle ±4°, power ±8 — skilled, frequently hits
  - Primus: angle ±2°, power ±4 — lethally precise
- **Ideal shot calculation**: Iterative/analytical solution for angle and power to hit target, accounting for gravity, wind, distance, and height difference. Binary search or direct formula.
- **Target selection**: Prefer same target as last turn if still alive. Select from alive enemy tanks. Reset persistence when target dies.
- **Wind-aware calculation**: AI factors current wind speed into its ideal trajectory computation before adding variance.
- **AI weapon restriction**: AI uses standard shell only (does not access shop or special weapons).
- **AI name generation**: Pool of military-themed names assigned randomly to AI tanks.
- **Perceptible spread**: Over a 10-turn game, Primus should hit targets noticeably more often than Blind Fool. Difficulty difference must be obvious to the player.

### Spec 008 — Viewport, Movement & Final Integration
**Scope**: Canvas viewport management, tank movement, indicators, edge cases, and final integration testing. Includes:
- **Canvas viewport**: Scrolling/panning for terrains larger than the browser viewport. Auto-center on player tank at the start of each turn. Smooth camera transitions. Clamp to terrain bounds.
- **Tank movement**: Q/E keys move tank left/right along terrain surface. Fuel consumption per movement. Fuel budget per game, scaling with terrain size. Tank Y position tracks terrain height during movement. Prevent moving off terrain edges.
- **WindIndicator component**: Numeric wind speed value, directional arrow (left/right), color intensity proportional to wind strength.
- **TurnIndicator component**: Current turn number, "Your Turn" label.
- **Wind particle effects**: Subtle particles flowing across canvas in wind direction. Speed proportional to wind strength. Visual feedback for wind without reading the number.
- **Edge case handling**:
  - Simultaneous player + AI death → player favored (player wins)
  - All AI destroyed in single volley → immediate win
  - Damage to multiple tanks within single blast radius
  - Tank at terrain edge → cannot move further in that direction
  - 0-credit weapon shop experience → proceed with standard shell only
  - Maximum wind (30 m/s) → dramatic horizontal drift, visually obvious
  - Tank in terrain valley → shots may hit nearby terrain peaks
  - Terrain cratered beneath a tank → tank settles to new height
- **Performance optimization**: 60fps maintained with up to 11 simultaneous projectiles (1 player + 10 AI) on standard hardware.
- **Full integration test pass**: Build, lint, all unit tests. Manual play-through of 5 consecutive games verifying: no stuck states, correct winner every time, economy accumulates properly, stats increment correctly, terrain craters persist through the match, tanks settle correctly after explosions.

---

## User Stories & Acceptance Scenarios

### US-1 — Play a Complete Battle (P1)

A player opens the game, enters their name, configures a battle, optionally buys weapons, then plays turn-based artillery combat against AI tanks on destructible terrain until one side wins. The player sees a game-over screen and can start a new game.

**Why P1**: This is the entire core game loop. Without this, there is no game.

**Acceptance Scenarios**:
1. **Given** the app is loaded, **When** the player enters their name and clicks "Start", **Then** they see the battle configuration screen.
2. **Given** the config screen is shown, **When** the player selects terrain size, enemy count, difficulty, and color, **Then** they can proceed to the weapon shop.
3. **Given** the weapon shop is shown, **When** the player buys weapons (or skips), **Then** the battle begins with all tanks placed on terrain.
4. **Given** it is the player's turn, **When** they adjust angle and power and press Fire, **Then** a projectile launches following physics (gravity + wind), and the turn resolves for all tanks simultaneously.
5. **Given** a projectile hits terrain, **When** the explosion resolves, **Then** a crater is carved into the terrain and nearby tanks settle to the new ground level.
6. **Given** a projectile hits a tank, **When** damage is applied, **Then** the tank's health decreases and the health bar updates visually.
7. **Given** a tank's health reaches 0, **When** destruction occurs, **Then** the tank is visually destroyed and removed from play.
8. **Given** only one tank remains alive, **When** the battle ends, **Then** a game-over screen shows the winner and offers "Play Again".

### US-2 — Configure Battle Settings (P1)

The player customizes their battle experience by choosing terrain size, number of enemies, AI difficulty level, and their tank color before entering combat.

**Why P1**: Configuration is integral to the core game loop and determines the battle parameters.

**Acceptance Scenarios**:
1. **Given** the config screen, **When** the player selects a terrain size (Small/Medium/Large/Huge/Epic), **Then** the terrain generates at that resolution.
2. **Given** the config screen, **When** the player selects enemy count (1–10), **Then** exactly that many AI tanks spawn.
3. **Given** the config screen, **When** the player selects difficulty (Blind Fool/Private/Veteran/Centurion/Primus), **Then** AI accuracy and behavior match that level.
4. **Given** the config screen, **When** the player picks a tank color, **Then** their tank renders in that color and AI tanks use different colors.

### US-3 — Purchase Weapons Before Battle (P2)

The player visits a weapon shop before each battle where they can spend credits to buy sniper shots and heavy artillery rounds, or proceed with only the free standard shell.

**Why P2**: The weapon shop adds strategic depth but the game is playable with just the standard shell.

**Acceptance Scenarios**:
1. **Given** the weapon shop, **When** the player views weapons, **Then** they see Standard Shell (free, unlimited), Sniper Shot (200 credits), and Heavy Artillery (250 credits) with descriptions.
2. **Given** the player has sufficient credits, **When** they purchase a weapon, **Then** the ammo count increases by 1 and their balance decreases.
3. **Given** the player has insufficient credits, **When** they try to purchase, **Then** the buy button is disabled or shows an error.
4. **Given** weapons are purchased, **When** battle begins, **Then** the weapon selector shows all owned weapons with ammo counts.
5. **Given** a weapon has 0 ammo remaining during battle, **When** viewing the weapon selector, **Then** that weapon is grayed out and unselectable.

### US-4 — Control Tank During Battle (P1)

During the player's turn, they can adjust barrel angle (±120°), set shot power (0–100%), select a weapon, optionally move their tank left/right, and fire. Controls work via keyboard and on-screen UI.

**Why P1**: Without player controls, there is no interactivity.

**Acceptance Scenarios**:
1. **Given** it is the player's turn, **When** they press W/S or Up/Down arrows, **Then** the barrel angle adjusts by 1 degree (5 degrees with Shift held).
2. **Given** it is the player's turn, **When** they press A/D or Left/Right arrows, **Then** shot power adjusts by 1% (5% with Shift held).
3. **Given** it is the player's turn, **When** they press Q or E, **Then** the tank moves left or right on the terrain, consuming fuel.
4. **Given** it is the player's turn, **When** they press Space or Enter, **Then** the shot fires with current angle, power, and selected weapon.
5. **Given** the player has multiple weapons, **When** they click a weapon in the selector panel, **Then** that weapon becomes active for the next shot.
6. **Given** it is NOT the player's turn, **When** they try to input controls, **Then** nothing happens (controls are locked).

### US-5 — AI Takes Its Turn (P1)

AI tanks calculate and execute their shots with accuracy determined by difficulty level. All tanks fire simultaneously after the player confirms their shot, then projectiles animate and resolve.

**Why P1**: AI opponents are required for single-player gameplay.

**Acceptance Scenarios**:
1. **Given** the player fires, **When** AI tanks calculate shots, **Then** each AI picks a target and calculates angle/power with difficulty-appropriate random variance.
2. **Given** AI difficulty is "Blind Fool", **When** it fires, **Then** angle varies by up to ±30° and power by ±40 from ideal.
3. **Given** AI difficulty is "Primus", **When** it fires, **Then** angle varies by only ±2° and power by ±4 from ideal.
4. **Given** all shots are queued, **When** simultaneous fire resolves, **Then** all projectiles animate across the screen at the same time.
5. **Given** an AI tank is destroyed, **When** turns cycle, **Then** destroyed AI tanks are skipped.

### US-6 — Physics-Based Projectile Motion (P1)

Projectiles follow realistic ballistic trajectories affected by gravity and wind. Wind changes each turn. Projectiles collide with terrain (carving craters) and tanks.

**Why P1**: Physics is the core mechanic that makes gameplay skill-based and satisfying.

**Acceptance Scenarios**:
1. **Given** a shot is fired, **When** the projectile travels, **Then** it follows a parabolic arc affected by gravity (constant downward acceleration).
2. **Given** wind is blowing, **When** a projectile is in flight, **Then** it curves horizontally in the wind direction proportional to wind speed.
3. **Given** a projectile hits terrain, **When** collision is detected, **Then** an explosion occurs at the impact point and a crater is carved into the terrain.
4. **Given** a projectile hits a tank, **When** collision is detected, **Then** the tank takes damage based on the weapon type.
5. **Given** a projectile leaves the canvas bounds, **When** out-of-bounds is detected, **Then** the projectile is removed with no damage dealt.
6. **Given** a new turn starts, **When** wind updates, **Then** the wind indicator shows the new wind speed and direction.

### US-7 — Earn Credits and Track Progress (P2)

The player earns credits for kills and wins. Their balance persists across games via LocalStorage. Stats are tracked and visible.

**Why P2**: Economy and persistence add replayability but aren't required for a single playable battle.

**Acceptance Scenarios**:
1. **Given** the player destroys an enemy tank, **When** credits are awarded, **Then** they earn 200 credits per kill (modified by difficulty multiplier).
2. **Given** the player wins a battle, **When** the game ends, **Then** they earn a 250-credit win bonus.
3. **Given** the player loses, **When** the game ends, **Then** they earn a 50-credit consolation.
4. **Given** credits are earned, **When** the game-over screen shows, **Then** the earnings breakdown is displayed.
5. **Given** the player closes and reopens the browser, **When** they return, **Then** their balance and stats are preserved.

---

## Functional Requirements

### Game Flow

- **FR-001**: The game MUST progress through phases in this order: Player Name Entry → Battle Configuration → Weapon Shop → Battle → Game Over, then loop back to Configuration.
- **FR-002**: The Player Name Entry screen MUST accept a text input for the player's name (1–20 characters) with a "Start" button.
- **FR-003**: The Game Over screen MUST display the winner's name, an earnings summary, and a "Play Again" button that returns to Battle Configuration.

### Battle Configuration

- **FR-010**: The configuration screen MUST allow selection of terrain size from: Small (800×600), Medium (1024×768), Large (1280×960), Huge (1600×1200), Epic (2100×2800).
- **FR-011**: The configuration screen MUST allow selection of enemy count from 1 to 10 via a slider or selector.
- **FR-012**: The configuration screen MUST allow selection of AI difficulty from: Blind Fool, Private, Veteran, Centurion, Primus.
- **FR-013**: The configuration screen MUST allow selection of player tank color from at least 8 distinct colors.
- **FR-014**: The configuration screen MUST have a "Start Battle" button that initializes the game with selected parameters.
- **FR-015**: Default configuration values MUST be: Medium terrain, 3 enemies, Veteran difficulty.

### Terrain

- **FR-020**: Terrain MUST be procedurally generated using a midpoint displacement algorithm with random seed.
- **FR-021**: Terrain MUST be rendered as a filled polygon on the canvas with a ground color.
- **FR-022**: Terrain height MUST support linear interpolation for sub-pixel accuracy in collision detection.
- **FR-023**: Each terrain size MUST define canvas dimensions: width and height in pixels (see Terrain Size Configurations table).
- **FR-024**: Terrain MUST be destructible — explosions carve craters by modifying the terrain height array within the blast radius.
- **FR-025**: After terrain is modified by an explosion, any tank standing on the affected area MUST settle (fall) to the new terrain height.
- **FR-026**: Crater carving MUST use a circular profile: carve depth at each X pixel = blastRadius - |dx from impact center|, clamped to >= 0.

### Tanks

- **FR-030**: Tanks MUST be placed on top of the terrain at evenly spaced horizontal positions, with Y position matching terrain height.
- **FR-031**: Each tank MUST have: a body (rectangular, ~50px wide, ~16px tall), a rotating turret/barrel, interleaved wheels, and a color.
- **FR-032**: Each tank MUST display a floating name label above it.
- **FR-033**: Each tank MUST display a health bar above the name showing current HP as a percentage.
- **FR-034**: The current-turn tank MUST be visually indicated (e.g., arrow or highlight).
- **FR-035**: Tanks MUST start with 100 HP.
- **FR-036**: AI tanks MUST be assigned distinct colors that differ from the player's chosen color.
- **FR-037**: AI tanks MUST be assigned randomized names from a pool of military-themed names.

### Controls

- **FR-040**: The control panel MUST display: current angle (degrees), current power (%), weapon selector, and a Fire button.
- **FR-041**: Angle MUST be adjustable from -120 to +120 degrees, where 0 is straight up, positive is left, negative is right.
- **FR-042**: Power MUST be adjustable from 0% to 100%.
- **FR-043**: Keyboard controls MUST be supported: W/S or Up/Down for angle, A/D or Left/Right for power, Space/Enter to fire, Q/E to move tank.
- **FR-044**: Holding Shift with angle/power keys MUST increase adjustment speed by 5×.
- **FR-045**: Controls MUST be disabled when it is not the player's turn.
- **FR-046**: Tank movement MUST consume fuel. Each tank starts with a fuel budget per game. Movement distance scales with terrain size.

### Weapons

- **FR-050**: Three weapons MUST be available:
  - **Standard Shell**: Free, unlimited ammo, 35% damage, 20px blast radius, 1.0× speed multiplier.
  - **Sniper Shot**: 200 credits, purchased ammo, 100% damage (instant kill), 12px blast radius, 1.3× speed multiplier.
  - **Heavy Artillery**: 250 credits, purchased ammo, 65% damage, 35px blast radius, 0.8× speed multiplier.
- **FR-051**: The weapon selector panel MUST show all owned weapons with remaining ammo counts.
- **FR-052**: Selecting a weapon MUST change the active weapon for the next shot.
- **FR-053**: Firing a non-standard weapon MUST decrement its ammo by 1.
- **FR-054**: When ammo reaches 0 for a weapon, it MUST be unselectable until more is purchased.
- **FR-055**: Standard Shell MUST always be available with infinite ammo.

### Weapon Shop

- **FR-060**: The weapon shop MUST display before each battle, showing all purchasable weapons.
- **FR-061**: Each weapon listing MUST show: name, description, damage, blast radius, cost per unit, and a buy button.
- **FR-062**: The player's current balance MUST be displayed prominently.
- **FR-063**: Purchasing a weapon MUST deduct the cost from the player's balance and add 1 ammo.
- **FR-064**: The buy button MUST be disabled if the player cannot afford the weapon.
- **FR-065**: A "Ready for Battle" / "Skip" button MUST allow proceeding without purchasing.

### Physics & Projectiles

- **FR-070**: Projectile motion MUST use standard ballistic equations: horizontal velocity = v×cos(angle), vertical velocity = v×sin(angle), with constant gravitational acceleration downward.
- **FR-071**: Wind MUST apply a horizontal acceleration to projectiles proportional to wind speed (windAccel = wind × 0.15 px/s²).
- **FR-072**: Power (0–100%) MUST map to projectile velocity using a calibrated scale (POWER_SCALE ≈ 1.12) such that 100% power at ~70° covers approximately the terrain width.
- **FR-073**: Projectiles MUST animate visually across the canvas, showing a trail (dotted line) of their path.
- **FR-074**: Projectile collision with terrain MUST be detected by checking if the projectile Y position is at or below the terrain height at its X position.
- **FR-075**: Projectile collision with a tank MUST be detected by checking proximity to tank center within the blast radius.
- **FR-076**: Projectiles that leave the canvas bounds MUST be removed without effect.
- **FR-077**: Gravity constant MUST be approximately 10 px/s² (tunable for game feel).

### Wind System

- **FR-080**: Wind speed MUST be displayed as a numeric value with direction indicator (arrow or text showing left/right).
- **FR-081**: Wind MUST change each turn, using a regression-to-mean model: newWind = oldWind × 0.7 + normalRandom(mean=0, stdDev=5).
- **FR-082**: Wind speed MUST be bounded within -30 to +30 m/s.
- **FR-083**: Initial wind MUST be generated from a normal distribution centered on 0, stdDev=10.

### Turn System

- **FR-090**: The game MUST use a simultaneous-fire turn system: the player sets their shot, then all alive tanks (player + AI) fire at the same time.
- **FR-091**: After all projectiles resolve (collisions detected, damage applied, terrain cratered, tanks settled), the turn advances and the player takes their next shot.
- **FR-092**: Destroyed tanks MUST be skipped in the turn order.
- **FR-093**: The game MUST display whose turn it is (always the player in this model, since fire is simultaneous).
- **FR-094**: A turn indicator MUST show the current turn number.

### Explosions & Damage

- **FR-100**: When a projectile impacts, an explosion animation MUST play at the impact point.
- **FR-101**: Explosion MUST render as an expanding circle with particles, colored by weapon type (see Weapon Configurations for colors).
- **FR-102**: Explosion duration MUST be approximately 1–2 seconds.
- **FR-103**: Damage MUST be applied to any tank within the weapon's blast radius of the impact point.
- **FR-104**: Damage amount MUST equal the weapon's damage percentage of the tank's max HP.
- **FR-105**: When a tank's HP reaches 0, a destruction animation MUST play (tank breaking apart with debris and particles).
- **FR-106**: Destruction animation MUST last approximately 2 seconds.
- **FR-107**: When an explosion impacts terrain, the terrain height array MUST be modified to create a crater (see Destructible Terrain Model).

### AI System

- **FR-110**: AI tanks MUST calculate shots by determining the ideal angle and power to hit a target, then adding random variance based on difficulty.
- **FR-111**: AI difficulty MUST control accuracy variance (see AI Difficulty Variance Table).
- **FR-112**: AI MUST select a target from alive enemy tanks, preferring consistent targeting of the same opponent. Preference resets when the current target is destroyed.
- **FR-113**: AI MUST fire using the standard shell only (AI does not use the shop or special weapons).
- **FR-114**: AI shot calculation MUST account for wind in its ideal trajectory computation.

### Economy

- **FR-120**: The player MUST start with a balance of 500 credits.
- **FR-121**: Kill reward MUST be 200 credits per enemy destroyed.
- **FR-122**: Win bonus MUST be 250 credits.
- **FR-123**: Loss consolation MUST be 50 credits.
- **FR-124**: Difficulty multiplier MUST apply to all earnings (kill, win, loss): Blind Fool 0.5×, Private 0.75×, Veteran 1.0×, Centurion 1.25×, Primus 1.5×.
- **FR-125**: Balance MUST persist across games via LocalStorage.

### Canvas Rendering

- **FR-130**: The entire game MUST render on an HTML5 Canvas element.
- **FR-131**: The canvas MUST support scrolling/panning when terrain is larger than the viewport.
- **FR-132**: The canvas MUST auto-center on the current player's tank at the start of their turn.
- **FR-133**: Rendering MUST use requestAnimationFrame for 60fps animation.
- **FR-134**: The coordinate system MUST use world coordinates (Y=0 at bottom, up is positive) internally, converted to screen coordinates (Y=0 at top) for canvas rendering. Conversion: screenY = canvasHeight - worldY.

### Persistence

- **FR-140**: Player profile (name, balance, stats, weapon inventory) MUST be stored in LocalStorage under key `"tank-battle-player"` using JSON serialization.
- **FR-141**: Stats tracked MUST include: games played, games won, total kills, and win rate.
- **FR-142**: The game MUST load the player's existing profile on return visits.

---

## Non-Functional Requirements

- **NFR-001**: The game MUST run in modern browsers (Chrome, Firefox, Safari, Edge) without plugins.
- **NFR-002**: The game MUST maintain 60fps during projectile animation on standard hardware.
- **NFR-003**: The game MUST be playable on desktop screens (minimum 1024×768 viewport).
- **NFR-004**: All game logic (physics, AI, damage, terrain modification) MUST be in pure functions separated from React components (`engine/` vs `components/` architecture).
- **NFR-005**: The codebase MUST use TypeScript strict mode with no `any` types.
- **NFR-006**: Critical game engine functions (physics, terrain, AI, damage, projectile, explosion, wind, weapons) MUST have unit tests with >80% coverage on engine modules.

---

## Success Criteria

1. **SC-001**: A player can complete a full game (config → shop → battle → game over) in under 10 minutes against 3 AI opponents.
2. **SC-002**: Projectile trajectories visually match expected ballistic curves — a 45-degree shot at 50% power in zero wind lands roughly at the midpoint of expected range.
3. **SC-003**: AI difficulty is perceptibly different — Primus AI hits targets noticeably more often than Blind Fool AI over 10 turns.
4. **SC-004**: The game runs at 60fps with no visible stutter during projectile animation with up to 11 simultaneous projectiles (1 player + 10 AI).
5. **SC-005**: Player balance and stats persist correctly across browser sessions (close tab, reopen, data intact).
6. **SC-006**: All 3 weapons (Standard Shell, Sniper Shot, Heavy Artillery) produce visually distinct explosions and deal correct damage.
7. **SC-007**: Wind visibly affects projectile trajectory — a strong wind (20+ m/s) causes a noticeable horizontal drift in projectile path.
8. **SC-008**: The game correctly ends when only one tank remains, declaring the correct winner every time.
9. **SC-009**: All unit tests pass with >80% coverage on engine modules (physics, terrain, AI, damage, projectile, explosion, wind, weapons).
10. **SC-010**: The player can play 5 consecutive games without encountering errors, crashes, or stuck states.
11. **SC-011**: Explosions visibly carve craters into the terrain, and tanks settle to the new ground level after terrain is destroyed beneath them.

---

## Edge Cases

- **All AI destroyed in single volley**: Player wins immediately — game-over screen triggers after explosion animations complete.
- **Player and last AI destroy each other simultaneously**: Player is favored — player wins. (Simultaneous death resolves in player's favor.)
- **Projectile lands between two tanks**: Only tanks within the blast radius take damage. Tanks outside the radius are unaffected.
- **Tank at terrain edge**: The tank cannot move further in that direction. Movement input is ignored at boundaries.
- **0 credits in weapon shop**: Player proceeds with only the free standard shell. No error state — shop is functional, just nothing affordable.
- **Maximum wind (30 m/s)**: Projectiles curve dramatically. The wind indicator should show strong wind visually (color intensity, large arrow).
- **Tank in terrain valley**: Shots may hit nearby terrain peaks before reaching the target. The player must adjust arc height to clear obstacles.
- **Terrain cratered beneath a tank**: Tank settles (falls) to the new terrain height. Tank remains alive and functional at new position.
- **Multiple craters overlap**: Terrain height array handles cumulative carving — each explosion further modifies the already-modified heights.

---

## Critical Implementation Notes

- **Separation of concerns**: Engine files MUST NOT import React. Components import from engine.
- **Pure functions**: All physics, AI, damage, and terrain modification calculations must be pure functions (input → output, no side effects) so they are easily testable.
- **Refs for animation**: Use React refs (not state) for values that change every frame (projectile position, explosion state) to avoid excessive re-renders.
- **Game loop**: The Canvas component runs a `requestAnimationFrame` loop. Game logic updates happen in the animation callback, not in React state updates.
- **Simultaneous fire**: When the player fires, immediately queue AI shots too. Then animate all projectiles together. After all resolve, apply damage, carve terrain, settle tanks, check for deaths, advance turn.
- **Coordinate conversion**: Be meticulous about world-to-screen coordinate conversion. Off-by-one errors here cause tanks to float or sink into terrain.
- **Terrain re-rendering**: After crater carving modifies the height array, the terrain polygon must be re-rendered on the next frame. The filled polygon is rebuilt from the updated heights array each frame.

---

## Design Direction: Scorched Earth Aesthetic

The visual design draws from the original **Scorched Earth** (1991) — updated for modern screens but preserving the dark, war-torn atmosphere.

### Color Palette

| Role | Color | Hex |
|------|-------|-----|
| Sky (top) | Deep black-blue | `#0A0E1A` |
| Sky (horizon) | Dark indigo | `#1A1A3E` |
| Terrain fill | Earth brown | `#4A3728` |
| Terrain grass | Olive green | `#3D5A1E` |
| Terrain dirt | Dark sienna | `#6B3A2A` |
| Crater interior | Exposed rock | `#3A2A1E` |
| UI background | Charcoal | `#1C1C1C` |
| UI panel | Dark gunmetal | `#2A2D32` |
| UI accent | Military amber | `#C89B3C` |
| UI text | Off-white | `#E8E0D0` |
| UI text dim | Muted khaki | `#8B8370` |
| Health bar full | Olive green | `#5A8A2F` |
| Health bar low | Blood red | `#8B1A1A` |
| Danger/fire | Burnt orange | `#CC4400` |
| Success | Tactical green | `#2D8B4E` |

### Typography

- **Headings**: Bold, condensed sans-serif (e.g., system `Impact`, `Arial Narrow Bold`, or a military stencil web font)
- **Body/UI**: Clean sans-serif (`system-ui`, `-apple-system`)
- **Data/numbers**: Monospace for angle, power, wind readouts (technical instrument feel)
- **Tank names**: Small caps or uppercase, letter-spaced

### UI Panels

- Dark semi-transparent panels with 1px border in `#3A3A3A`
- Subtle inner glow or top highlight for depth
- Rounded corners (small, 4px) — industrial but not harsh
- Control panel at bottom of screen, weapon selector on side
- Indicators (wind, turn) positioned top of viewport

### Tank Design

- Rectangular body (~50px wide, ~16px tall) with angled front
- Visible treads/wheels underneath
- Rotating turret on top with protruding barrel
- Color fill with darker outline
- Name label above in small caps
- Health bar as thin colored strip above name

### Explosions

- Expanding circle with radial gradient (weapon-colored center → transparent edge)
- Standard Shell: center #FF4400 → outer #FF8800
- Sniper Shot: center #FFFFFF → outer #4488FF
- Heavy Artillery: center #FF2200 → outer #FF6600
- Debris particles flying outward with gravity
- Brief screen flash on large explosions
- Smoke particles that linger and fade
- Crater left behind in terrain after explosion clears

### Terrain

- Filled polygon with gradient: grass green on top fading to earth brown below
- Subtle noise texture on terrain surface
- Sky gradient from deep black at top to dark indigo at horizon
- Craters show exposed dirt/rock (darker brown, #3A2A1E) where grass layer is blown away
- Cumulative destruction visible as match progresses — war-torn landscape

### Screens (Non-Battle)

- Centered card layout on dark background
- Subtle military insignia or crosshair watermarks
- Buttons: filled with accent color, uppercase text, hover glow
- Input fields: dark background, amber border on focus
- War-worn but clean — not cluttered
