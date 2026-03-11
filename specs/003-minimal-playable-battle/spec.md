# Spec 003 — Minimal Playable Battle

**Created**: 2026-03-10
**Status**: Draft
**Depends On**: Spec 002 (Core Engine)
**Execution**: Parallel (4 tracks)
**Reference**: [Master Plan](../../tanks_plan.md)

---

## Goal

Bring the engine to screen and make the game **playable**. By the end of this spec, a player can fire at AI tanks on procedurally-generated destructible terrain, watch projectiles fly and explode, see craters form, and win or lose. This is the **critical milestone** — a basic Scorched Earth game.

**What this spec does NOT include** (deferred to later specs):
- No name entry screen (hardcoded player name "Player")
- No configuration screen (hardcoded: Medium terrain, 3 enemies, Veteran AI)
- No weapon shop (standard shell only)
- No economy/credits
- No design polish (functional styling only)
- No viewport scrolling (canvas = terrain size, fits in viewport for Medium)
- No tank movement (Q/E deferred)
- No wind/turn indicator components (values shown in control panel text)

**Exit Criteria**: `npx vitest run && npx eslint . && npx tsc -b` all pass. A player can complete a full battle (fire, hit tanks, take damage, win/lose) and restart.

---

## Track Legend

| Track | Focus Area |
|-------|-----------|
| **A** | Canvas Foundation + Projectile Rendering |
| **B** | Tank Rendering + Explosion Rendering |
| **C** | Game Context + Turn Resolution |
| **D** | Controls (Keyboard + UI Panel) |

---

## Tasks

### Phase 1 — Foundation (parallel, no cross-dependencies)

#### T001 [C] — Game Context (Battle State)
`src/context/GameContext.tsx`

Implement minimal game state management for the battle phase only:
- Initialize game: generate terrain (Medium), place tanks (1 player + 3 AI, Veteran), generate initial wind
- Track: tanks[], terrain, wind, turnNumber, projectiles[], explosions[], winner, current phase (playing/gameOver only for now)
- Phase transitions: startBattle() (initializes everything), restartBattle() (re-initializes)
- Turn state: isPlayerTurn, isAnimating (projectiles in flight)
- Provide functions: setPlayerAngle, setPlayerPower, firePlayerShot, advanceTurn
- Winner detection: check if only one side remains alive after damage resolution

**Note**: Hardcode defaults — no config screen yet. Player name = "Player", color = first from TANK_COLORS.

#### T002 [D] — Keyboard Hook
`src/hooks/useKeyboard.ts`

Implement keyboard controls:
- W/S or Up/Down: adjust angle ±1° (±5° with Shift)
- A/D or Left/Right: adjust power ±1% (±5% with Shift)
- Space or Enter: fire
- Disabled when `isPlayerTurn` is false or `isAnimating` is true
- Calls GameContext functions (setPlayerAngle, setPlayerPower, firePlayerShot)

#### T003 [A] — Canvas Foundation
`src/components/Canvas.tsx`

Implement the base canvas component:
- Sized to terrain dimensions (width × height from TerrainData)
- requestAnimationFrame loop at 60fps
- Sky gradient background: simple dark gradient (top darker, bottom lighter)
- Terrain rendering: filled polygon from terrain.heights array. Rebuild polygon each frame (needed for crater updates).
- World-to-screen coordinate conversion applied to all rendering
- Canvas ref for 2D context access

#### T004 [B] — Tank Rendering
`src/components/Canvas.tsx` (extend T003)

**Depends on**: T003 (canvas exists)

Add tank rendering to the canvas draw loop:
- Tank body: filled rectangle (~50×16px) in tank color
- Turret: small circle on top of body
- Barrel: line extending from turret at current angle, rotated correctly
- Wheels: small circles/rectangles under body
- Name label: text above tank (white, centered)
- Health bar: thin rectangle above name, width proportional to HP%, green→red gradient
- Current-turn indicator: small downward arrow above the player's tank

---

### Phase 2 — Interactivity (cross-track dependencies)

#### T005 [D] — Control Panel
`src/components/ControlPanel.tsx`
**Depends on**: T001 (GameContext for state/callbacks)

Implement the on-screen control panel:
- Display current angle (degrees) with up/down buttons
- Display current power (%) with up/down buttons
- Fire button (disabled when not player's turn or animating)
- Display current wind speed and direction as text (e.g., "Wind: 5.2 → ")
- Display current turn number as text (e.g., "Turn 3")
- Display selected weapon name (just "Standard Shell" for now)
- Functional but minimal styling — readable, not polished

#### T006 [A] — Projectile Animation
`src/components/Canvas.tsx` (extend)
**Depends on**: T003 (canvas), T001 (GameContext for projectile state)

Add projectile rendering to the canvas draw loop:
- Animate each active projectile as a small filled circle (weapon-colored)
- Draw dotted trail behind each projectile (trail points from ProjectileState)
- Handle multiple simultaneous projectiles (up to 4 for this spec: 1 player + 3 AI)
- Visual speed multiplier: 5× (see Master Plan → Physics Model → Animation)
- Remove projectile visually when collision detected or OOB

#### T007 [B] — Explosion & Destruction Rendering
`src/components/Canvas.tsx` (extend)
**Depends on**: T004 (tank rendering), T001 (GameContext for explosion state)

Add explosion/destruction rendering to the canvas draw loop:
- Explosion: expanding filled circle with radial gradient (weapon-colored center → transparent edge)
- Particles: small circles flying outward from impact, pulled down by gravity, fading over time
- Tank destruction: when a tank dies, render debris (rectangle fragments flying outward, gravity-affected, ~2s duration)
- After explosion completes, terrain should show the crater (already handled by terrain re-rendering from T003)

#### T008 [C] — Turn Resolution Engine
`src/context/GameContext.tsx` (extend T001)
**Depends on**: T001 (GameContext), uses engine modules from Spec 002

Implement the full turn resolution loop:

1. **Player fires**: Player presses fire → queue player's shot (current angle, power, standard shell)
2. **AI fires**: For each alive AI tank, call `calculateAIShot()` (Veteran difficulty) → queue their shots
3. **Create projectiles**: Convert all queued shots to ProjectileState objects
4. **Animate**: Set `isAnimating = true`. Each animation frame: update all projectile positions via `updateProjectile()`. Check collisions (terrain, tanks, OOB) each frame.
5. **On collision**:
   - Call `calculateDamage()` to apply damage to tanks in blast radius
   - Call `carveCrater()` to modify terrain
   - Call `settleTank()` for any tanks on modified terrain
   - Create explosion via `createExplosion()`
   - If tank HP <= 0, create destruction effect, mark tank dead
6. **Resolution**: When all projectiles resolved and all explosions complete, set `isAnimating = false`
7. **Win check**: If only one side alive, set winner and phase = gameOver
8. **Advance turn**: If no winner, update wind via `updateWind()`, increment turn number, return control to player

---

### Phase 3 — Game Loop Completion

#### T009 [A] — App Integration
`src/App.tsx`
**Depends on**: T001, T003, T005, T008

Wire everything together:
- Wrap App in GameContext provider
- Render Canvas + ControlPanel during 'playing' phase
- On game over: render simple overlay with winner name and "Play Again" button
- "Play Again" calls restartBattle() and resets to playing phase
- On initial load: auto-start a battle (skip name/config — hardcoded defaults)

#### T010 [D] — Integration Testing & Tuning
**Depends on**: T009 (everything wired)

Manual + automated verification:
- Play a complete battle start to finish
- Verify: projectiles follow arcs, wind affects trajectory, explosions appear at impact
- Verify: craters form in terrain after explosions
- Verify: tanks settle when ground beneath them is destroyed
- Verify: AI fires back, hits sometimes (Veteran accuracy)
- Verify: health bars update, tanks die with destruction animation
- Verify: game ends when one side wins, restart works
- Tune physics constants if needed (POWER_SCALE, gravity, wind factor)
- Ensure 60fps with 4 simultaneous projectiles on Medium terrain
- All tests pass, lint clean, build clean

---

## Checkpoint: Playable Game

```bash
npx vitest run && npx eslint . && npx tsc -b
```

Then `npx vite dev` and play:

### What to test:
1. App loads → battle starts immediately (Medium terrain, 3 AI, Veteran)
2. Terrain renders as filled polygon with hills
3. Player + 3 AI tanks sit on terrain at correct heights, correct colors, name labels, health bars
4. Adjust angle (W/S keys or UI buttons) → see barrel rotate
5. Adjust power (A/D keys or UI buttons) → see value change in control panel
6. Fire (Space) → player projectile launches with visible trail, follows parabolic arc
7. AI tanks fire simultaneously → multiple projectiles visible
8. Wind affects trajectories (check wind display in control panel)
9. Projectile hits terrain → explosion animation → crater carved in terrain
10. Projectile hits tank → explosion + damage → health bar decreases
11. Tank at 0 HP → destruction animation → removed from play
12. Crater beneath a tank → tank settles to new ground level
13. Last side standing → game over overlay with winner name
14. "Play Again" → fresh battle

### Go/No-Go:
- [ ] Full battle completes without crashes
- [ ] Physics feel right (arcs, wind, range)
- [ ] Craters visibly deform terrain
- [ ] Tanks settle after terrain destruction
- [ ] AI fires back with reasonable accuracy
- [ ] Win detection works every time
- [ ] Can play 3 consecutive battles without issues
- [ ] All tests pass, lint clean, build clean
