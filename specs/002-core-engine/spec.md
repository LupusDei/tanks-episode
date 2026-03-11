# Spec 002 — Core Engine

**Created**: 2026-03-10
**Status**: Draft
**Depends On**: Spec 001 (Project Bootstrap)
**Execution**: Parallel (4 tracks after T001 completes)
**Reference**: [Master Plan](../../tanks_plan.md) — Architecture Reference for all constants, formulas, and models

---

## Goal

Implement all pure engine modules with comprehensive test coverage. Every module lives in `src/engine/`, imports zero React, and exports pure functions. By the end of this spec, all game math — terrain, physics, wind, weapons, tanks, projectiles, explosions, damage, and crater carving — is implemented and tested. No UI exists yet.

**Exit Criteria**: `npx vitest run && npx eslint . && npx tsc -b` all pass. >80% coverage on engine modules. All physics constants calibrated. AI accuracy spread verified in tests.

---

## Track Legend

| Track | Focus Area |
|-------|-----------|
| **A** | Terrain + Tank Placement |
| **B** | Physics + Wind |
| **C** | Projectile + Explosion |
| **D** | Weapons + AI |

---

## Tasks

### Phase 1 — Independent Engine Modules (all tracks parallel)

All four tracks begin simultaneously. No cross-track dependencies in this phase.

#### T001 [A] — Terrain Generation & Crater Carving
`src/engine/terrain.ts + terrain.test.ts`

Implement:
- **generateTerrain(size: TerrainSize, seed?: number)**: Midpoint displacement algorithm with seeded RNG. Returns `TerrainData` with height array spanning full pixel width.
- **getTerrainHeight(terrain: TerrainData, x: number)**: Linear interpolation between height samples for sub-pixel accuracy.
- **carveCrater(terrain: TerrainData, impactX: number, impactY: number, blastRadius: number)**: Modify heights array in place. Circular crater profile: carve depth at each X = blastRadius - |dx|, clamped >= 0. See Master Plan → Destructible Terrain Model.
- Terrain size configs: Small (800×600), Medium (1024×768), Large (1280×960), Huge (1600×1200), Epic (2100×2800).

Tests:
- Generation produces valid heights (all values >= 0, length matches terrain width)
- Height interpolation returns values between adjacent samples
- All 5 terrain sizes generate correctly
- Crater carving reduces heights within blast radius
- Crater depth matches circular profile formula
- Craters clamp terrain to >= 0
- Multiple overlapping craters accumulate correctly
- Edge craters (near terrain boundary) don't go out of bounds

#### T002 [B] — Physics Engine
`src/engine/physics.ts + physics.test.ts`

Implement:
- **calculateVelocity(power: number, angle: number, speedMultiplier: number)**: Returns `Velocity`. Uses POWER_SCALE ≈ 1.12. Angle conversion: physicsAngle = 90 - uiAngle (degrees → radians). vx = power × POWER_SCALE × cos(physicsAngle) × speedMultiplier. vy = power × POWER_SCALE × sin(physicsAngle) × speedMultiplier.
- **updateProjectilePosition(pos: Position, vel: Velocity, wind: number, dt: number)**: Returns new Position and Velocity. Apply gravity (10 px/s²) and wind acceleration (wind × 0.15 px/s²). x += vx×dt + 0.5×windAccel×dt². y += vy×dt - 0.5×gravity×dt². vy -= gravity×dt. vx += windAccel×dt.
- **worldToScreen(worldPos: Position, canvasHeight: number)**: screenY = canvasHeight - worldY.
- **screenToWorld(screenPos: Position, canvasHeight: number)**: worldY = canvasHeight - screenY.
- **uiAngleToPhysics(uiAngle: number)**: Convert UI angle (0=up, ±120) to physics radians.

Tests:
- Trajectory symmetry: shot at angle A and -A in zero wind have symmetric horizontal displacement
- Known outcomes: 45° at 50% power in zero wind — verify landing distance
- 100% power at 70° ≈ terrain width (calibration check)
- Coordinate conversion round-trips: worldToScreen(screenToWorld(p)) === p
- Gravity pulls projectile downward over time
- Wind pushes projectile horizontally
- Edge: 0% power produces zero velocity
- Edge: straight up (0° UI) fires vertically

#### T003 [C] — Projectile System
`src/engine/projectile.ts + projectile.test.ts`

Implement:
- **createProjectile(tank: TankState, angle: number, power: number, weaponType: WeaponType)**: Returns `ProjectileState` with initial position at barrel tip, calculated velocity, empty trail.
- **updateProjectile(proj: ProjectileState, wind: number, dt: number)**: Update position using physics, append to trail, return updated projectile.
- **checkTerrainCollision(proj: ProjectileState, terrain: TerrainData)**: Returns true if projectile Y <= terrain height at projectile X.
- **checkTankCollision(proj: ProjectileState, tanks: TankState[], blastRadius: number)**: Returns collided TankState or null. Check proximity: distance from projectile to tank center <= blastRadius.
- **isOutOfBounds(proj: ProjectileState, terrain: TerrainData)**: Returns true if projectile X < 0 or X > terrain width or Y < -500 (well below ground).

Tests:
- Projectile created at correct barrel-tip position
- Collision detected when projectile Y <= terrain height
- Collision NOT detected when projectile above terrain
- Tank collision detected within blast radius
- Tank collision NOT detected outside blast radius
- Out-of-bounds detected at terrain edges
- Trail accumulates points over time

#### T004 [D] — Weapon Configs & Damage Calculation
`src/engine/weapons.ts + weapons.test.ts`

Implement:
- **WEAPON_CONFIGS**: Record<WeaponType, WeaponConfig> with all three weapons. See Master Plan → Weapon Configurations for exact values (damage, blastRadius, cost, speedMultiplier, explosionColors).
- **calculateDamage(impactPos: Position, tanks: TankState[], weapon: WeaponConfig)**: For each alive tank, calculate distance. If distance <= blastRadius, apply damage (weapon.damage % of maxHP). Return array of { tankId, damage, killed } results.
- **ECONOMY**: Object with constants — startingBalance (500), killReward (200), winBonus (250), lossConsolation (50).
- **DIFFICULTY_MULTIPLIERS**: Record<AIDifficulty, number> — Blind Fool 0.5, Private 0.75, Veteran 1.0, Centurion 1.25, Primus 1.5.
- **calculateEarnings(kills: number, won: boolean, difficulty: AIDifficulty)**: Returns total credits earned.

Tests:
- Standard Shell: 35% damage, 20px blast, cost 0
- Sniper Shot: 100% damage (instant kill), 12px blast, cost 200
- Heavy Artillery: 65% damage, 35px blast, cost 250
- Damage applied only to tanks within blast radius
- Damage NOT applied to tanks outside blast radius
- Multiple tanks in blast radius all take damage
- Dead tanks don't take additional damage
- Economy math: kills × 200 × multiplier + bonus
- Each difficulty multiplier correct

---

### Phase 2 — Modules With Cross-Dependencies

These tasks depend on Phase 1 modules.

#### T005 [A] — Tank Placement & Names
`src/engine/tank.ts + tank.test.ts`
**Depends on**: T001 (terrain)

Implement:
- **placeTanks(terrain: TerrainData, playerName: string, playerColor: string, enemyCount: number)**: Place tanks at evenly spaced horizontal positions. Player tank placed first. Y position = terrain height at that X. AI tanks get distinct colors (avoiding player color) and random military names. Returns TankState[].
- **AI_NAME_POOL**: Array of military-themed names (at least 20: e.g., "Viper", "Ironside", "Blitz", "Havoc", "Ghost", "Cobra", "Reaper", "Phoenix", "Hammer", "Storm", "Shadow", "Titan", "Falcon", "Rogue", "Saber", "Wolf", "Diesel", "Knox", "Tank", "Magnus").
- **TANK_COLORS**: Array of 8+ distinct color hex values for selection.
- **settleTank(tank: TankState, terrain: TerrainData)**: Update tank Y to match current terrain height at tank X. Used after crater carving.

Tests:
- Correct number of tanks placed (1 player + N enemies)
- Tanks at even horizontal spacing
- Tank Y matches terrain height at its X position
- No duplicate colors
- Player color not reused by AI
- AI names drawn from pool, no duplicates in a single game
- settleTank updates Y to new terrain height

#### T006 [B] — Wind System
`src/engine/wind.ts + wind.test.ts`
**Depends on**: T002 (physics — uses wind in trajectory calculations)

Implement:
- **generateInitialWind()**: Returns Wind with speed from normalRandom(mean=0, stdDev=10), clamped ±30.
- **updateWind(current: Wind)**: Returns new Wind. newSpeed = current.speed × 0.7 + normalRandom(mean=0, stdDev=5), clamped ±30.
- **normalRandom(mean: number, stdDev: number)**: Box-Muller or equivalent for normal distribution.

Tests:
- Initial wind within ±30 bounds (run 1000 iterations)
- Updated wind within ±30 bounds (run 1000 iterations)
- Wind regresses toward zero over many updates (average of 100 sequential updates closer to 0 than initial)
- normalRandom produces expected distribution (mean ≈ 0, stdDev ≈ target over 10000 samples)

#### T007 [C] — Explosion System
`src/engine/explosion.ts + explosion.test.ts`
**Depends on**: T004 (weapon configs for explosion colors)

Implement:
- **createExplosion(position: Position, weaponType: WeaponType)**: Returns `ExplosionState` with initial radius 0, phase 'growing', particles generated outward with random velocities, weapon-specific colors.
- **updateExplosion(explosion: ExplosionState, dt: number)**: Advance state machine: growing (radius expands to max ~1s) → peak (brief hold) → fading (alpha decreases ~0.5s) → done. Update particle positions with gravity. Return updated state.
- **createDestructionEffect(tank: TankState)**: Returns debris particles (hull fragments, turret pieces) with outward velocities and gravity. ~2 second animation.
- **isExplosionComplete(explosion: ExplosionState)**: Returns true when phase is 'done'.

Tests:
- Explosion starts at phase 'growing' with radius 0
- Explosion grows over time
- Explosion transitions through all phases: growing → peak → fading → done
- Total duration approximately 1–2 seconds
- Particles have outward velocity and are pulled by gravity
- Particle count within reasonable bounds (10–50)
- Weapon-specific colors applied (Standard: #FF4400/#FF8800, Sniper: #FFFFFF/#4488FF, Heavy: #FF2200/#FF6600)
- Destruction effect creates debris particles
- Destruction animation lasts ~2 seconds

#### T008 [D] — AI System (Basic)
`src/engine/ai.ts + ai.test.ts`
**Depends on**: T002 (physics), T001 (terrain)

Implement:
- **calculateIdealShot(shooter: TankState, target: TankState, wind: Wind, terrain: TerrainData)**: Returns { angle, power } that would ideally hit the target, accounting for gravity, wind, distance, and height difference. Use iterative binary search or analytical solution.
- **calculateAIShot(shooter: TankState, target: TankState, wind: Wind, terrain: TerrainData, difficulty: AIDifficulty)**: Calls calculateIdealShot, then adds random variance from difficulty table (see Master Plan → AI Difficulty Variance Table). Clamp angle to ±120°, power to 0–100%.
- **selectTarget(shooter: TankState, tanks: TankState[], lastTargetId: string | null)**: Returns target tank. Prefer last target if still alive. Otherwise pick random alive enemy.

Tests:
- Ideal shot at zero wind hits target (verify projectile simulation lands within 5px of target)
- Ideal shot with wind still hits target
- Variance increases with lower difficulty (Blind Fool has wider spread than Primus)
- Difficulty variance values match table: Blind Fool ±30°/±40, Private ±15°/±25, Veteran ±8°/±15, Centurion ±4°/±8, Primus ±2°/±4
- All results clamped to valid ranges
- Target selection prefers last target if alive
- Target selection picks new target when last target is dead
- Shooter never targets itself

---

## Checkpoint: Engine Verification

```bash
npx vitest run && npx eslint . && npx tsc -b
```

### What to verify:
- All tests green across: terrain, physics, wind, weapons, tank, ai, projectile, explosion
- Coverage >80% on all engine modules
- Build compiles without errors
- Lint passes clean

### Calibration checks (inspect test output):
- 100% power at 70° in zero wind ≈ terrain width (Medium: ~1024px)
- Primus AI hits target significantly more often than Blind Fool over simulated turns
- Crater carving produces visible depth changes in terrain height array
- Explosion state machine completes in 1–2 seconds of simulated time
- Wind stays bounded after 1000 sequential updates

### Go/No-Go:
- [ ] All engine tests pass
- [ ] >80% coverage on engine modules
- [ ] Build succeeds
- [ ] Lint passes
- [ ] Physics constants feel calibrated
- [ ] AI difficulty spread is perceptible in test output
