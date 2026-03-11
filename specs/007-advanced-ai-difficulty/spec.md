# Spec 007 — Advanced AI & Difficulty Tiers

**Created**: 2026-03-10
**Status**: Draft
**Depends On**: Spec 003 (Minimal Playable Battle)
**Can Parallel With**: Specs 004, 005, 006
**Execution**: Parallel (2 tracks)
**Reference**: [Master Plan](../../tanks_plan.md) — AI Difficulty Variance Table, AI Shot Calculation

---

## Goal

Upgrade the AI from a single Veteran difficulty to five distinct tiers with perceptible behavioral differences. Blind Fool can barely hit the ground. Primus is a surgical killer. The AI system becomes a core part of the game's replayability — easy modes for casual fun, hard modes for real challenge.

**What this spec adds**:
- Five calibrated difficulty levels with distinct accuracy (FR-110, FR-111)
- Intelligent target selection with persistence (FR-112)
- Wind-aware ideal shot calculation (FR-114)
- AI weapon restriction enforcement (FR-113)
- Military-themed AI name pool (FR-037)
- Difficulty-appropriate behavior tuning

**What Spec 003 already provides** (foundation this builds on):
- Basic AI shot calculation (Veteran only)
- Basic target selection
- AI integration into turn resolution

**Note on parallel execution**: This spec modifies `src/engine/ai.ts` which was created in Spec 002 and lightly used in Spec 003. Since Specs 004, 005, 006 don't modify the AI engine, there are no merge conflicts when running in parallel.

---

## Track Legend

| Track | Focus Area |
|-------|-----------|
| **A** | AI Engine (shot calculation, targeting, difficulty) |
| **B** | AI Names + Integration Testing |

---

## Tasks

### Phase 1 — AI Engine Upgrade (parallel)

#### T001 [A] — Difficulty-Calibrated Shot Calculation
`src/engine/ai.ts + ai.test.ts`

Upgrade the AI shot calculation to support all five difficulty tiers:

**Ideal shot calculation** (FR-110, FR-114):
- Calculate the perfect angle and power to hit a target accounting for:
  - Horizontal distance between shooter and target
  - Height difference (target may be higher or lower on terrain)
  - Current wind speed and direction
  - Gravity constant (10 px/s²)
  - Wind acceleration (wind × 0.15 px/s²)
- Use iterative binary search or analytical ballistic formula
- The ideal shot should hit within 5px of the target center in simulation

**Difficulty variance** (FR-111):
- After computing the ideal shot, add random variance:

| Difficulty | Angle Variance | Power Variance | Behavior |
|-----------|----------------|----------------|----------|
| Blind Fool | ±30° | ±40 | Wildly inaccurate. Shots go everywhere. Comic relief. |
| Private | ±15° | ±25 | Poor aim. Occasionally lands nearby. Learning. |
| Veteran | ±8° | ±15 | Competent. Frequently close, sometimes direct hits. |
| Centurion | ±4° | ±8 | Skilled. Most shots land dangerously close. |
| Primus | ±2° | ±4 | Lethal. Nearly every shot is on or near target. |

- Variance applied as uniform random: actualAngle = idealAngle + random(-variance, +variance)
- Clamp results: angle to ±120°, power to 0–100%

Tests:
- Ideal shot (0 variance) hits target within 5px (simulate projectile with physics engine)
- Ideal shot accounts for wind (test with strong wind, verify hit)
- Ideal shot accounts for height difference (shooter higher/lower than target)
- Blind Fool variance: over 100 shots, average miss distance significantly larger than Primus
- Primus variance: over 100 shots, most land within 30px of target
- All difficulty variances match configured values
- Angle clamped to ±120° even with large variance
- Power clamped to 0–100% even with large variance

#### T002 [A] — Target Selection with Persistence
`src/engine/ai.ts + ai.test.ts`

Implement intelligent target selection (FR-112):
- **selectTarget(shooter, aliveTanks, lastTargetId)**: Returns the tank to fire at
- **Persistence**: If `lastTargetId` is provided and that tank is still alive, target it again. This creates the feel of focused aggression — an AI "has it out for you".
- **New target**: If last target is dead or null, select a new target from alive enemies. Prefer nearest enemy (by X distance) as a tiebreaker.
- **Never self-target**: Exclude shooter from candidate list
- Store lastTargetId per AI tank in TankState (or in GameContext)

Tests:
- Returns last target if still alive
- Picks new target when last target is dead
- Picks new target when lastTargetId is null (first turn)
- Never returns the shooter itself
- Returns null or throws when no valid targets exist
- Prefers nearest tank when selecting a new target

#### T003 [B] — AI Name Pool
`src/engine/tank.ts` (extend)

Expand the military-themed name pool (FR-037):
- At least 30 names to avoid repetition with 10 AI tanks
- Names should feel military/callsign: "Viper", "Ironside", "Blitz", "Havoc", "Ghost", "Cobra", "Reaper", "Phoenix", "Hammer", "Storm", "Shadow", "Titan", "Falcon", "Rogue", "Saber", "Wolf", "Diesel", "Knox", "Magnus", "Spectre", "Valkyrie", "Arsenal", "Warden", "Nomad", "Patriot", "Sentinel", "Raptor", "Bulldog", "Spartan", "Javelin"
- Shuffle and assign without duplicates per game
- Ensure names display well in the tank label rendering

Tests:
- No duplicate names assigned in a single game (up to 10 AI)
- Names drawn from the pool (not random strings)
- Pool has at least 30 entries

---

### Phase 2 — Integration & Calibration

#### T004 [A] — AI Integration into Game Context
`src/context/GameContext.tsx` (extend)
**Depends on**: T001, T002

Update the turn resolution to use upgraded AI:
- When queuing AI shots, pass the game's current difficulty level to `calculateAIShot()`
- Store and pass `lastTargetId` per AI tank between turns
- Update `lastTargetId` after target selection each turn
- On target death, the AI tank will auto-select a new target next turn

#### T005 [B] — Difficulty Calibration & Testing
**Depends on**: T004

Verify that difficulty differences are **perceptible to the player**:

**Automated tests**:
- Simulate 50 turns at each difficulty against a stationary target
- Measure hit rate (shots landing within blast radius of target)
- Expected approximate hit rates:
  - Blind Fool: < 10%
  - Private: ~15–25%
  - Veteran: ~35–50%
  - Centurion: ~55–70%
  - Primus: ~80–95%
- Verify the ordering is strictly monotonic: Primus > Centurion > Veteran > Private > Blind Fool

**Manual testing**:
- Play 1v1 against Blind Fool → AI misses constantly, player wins easily
- Play 1v1 against Primus → AI hits almost every shot, player is under serious pressure
- Play against 5 Veteran enemies → AI provides moderate challenge
- Verify AI targets persist (same AI keeps shooting at you across turns)
- Verify AI selects new target when current target dies

---

## Checkpoint: AI & Difficulty

```bash
npx vitest run && npx eslint . && npx tsc -b
```

### What to test:
1. **Blind Fool**: 1v1 — AI shots go wildly off target. Easy win.
2. **Private**: 1v1 — AI occasionally lands nearby. Still easy.
3. **Veteran**: 1v1 — AI competent. Some direct hits. Fair fight.
4. **Centurion**: 1v1 — AI dangerous. Frequent close hits. Challenging.
5. **Primus**: 1v1 — AI surgical. Almost every shot on target. Very hard.
6. **Target persistence**: Same AI keeps targeting you across multiple turns (unless you die).
7. **Target switching**: When AI's target dies, it picks a new one next turn.
8. **Wind handling**: AI adjusts for wind (shots don't systematically miss in one direction).
9. **10 enemies**: All AI tanks fire with appropriate difficulty. No crashes, no infinite loops.
10. **Names**: AI tanks have unique military callsign names.

### Go/No-Go:
- [ ] All 5 difficulties have perceptibly different accuracy
- [ ] Hit rate ordering is strictly monotonic across difficulties
- [ ] Target selection with persistence works correctly
- [ ] AI accounts for wind in shot calculation
- [ ] No AI shoots at itself or dead tanks
- [ ] Works with 1–10 enemies without issues
- [ ] All tests pass, lint clean, build clean
