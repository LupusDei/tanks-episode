# Spec 008 — Viewport, Movement & Final Integration

**Created**: 2026-03-10
**Status**: Draft
**Depends On**: Specs 004, 005, 006, 007 (all must complete before this spec begins)
**Execution**: Parallel (3 tracks)
**Reference**: [Master Plan](../../tanks_plan.md)

---

## Goal

Final spec. Add canvas viewport management for large terrains, tank movement with fuel, wind/turn indicator components, visual wind particles, handle all remaining edge cases, and run a comprehensive integration test pass. After this spec, the game is **complete** — every feature from the Master Plan is implemented, tested, and polished.

**What this spec adds**:
- Canvas scrolling/panning for terrains larger than the viewport (FR-131)
- Auto-center camera on player tank each turn (FR-132)
- Tank movement with fuel system (FR-046)
- WindIndicator component (FR-080)
- TurnIndicator component (FR-093, FR-094)
- Wind particle visual effects
- All edge case handling
- Performance optimization for 11 simultaneous projectiles
- Full integration test pass

---

## Track Legend

| Track | Focus Area |
|-------|-----------|
| **A** | Viewport (scrolling, camera, panning) |
| **B** | Movement + Indicators |
| **C** | Edge Cases + Integration Testing |

---

## Tasks

### Phase 1 — Core Features (parallel)

#### T001 [A] — Canvas Viewport System
`src/components/Canvas.tsx` (major extension)

Implement canvas viewport for large terrains (FR-131, FR-132):

**Viewport concept**: The HTML canvas element stays at browser viewport size (e.g., 1024×768). The game world may be larger (e.g., Epic: 2100×2800). The viewport is a "camera" window into the world.

- **Viewport state**: Track camera position (viewportX, viewportY) — the world coordinate of the viewport's top-left corner.
- **Rendering offset**: All draw calls offset by (-viewportX, -viewportY) so only the visible portion of the world renders.
- **Auto-center on player** (FR-132): At the start of each turn, smoothly scroll to center the player's tank in the viewport. Use lerp (linear interpolation) for smooth camera movement over ~500ms.
- **Clamp to bounds**: viewportX clamped to [0, terrainWidth - viewportWidth]. viewportY clamped to [0, terrainHeight - viewportHeight].
- **Small terrains**: If terrain fits within viewport (e.g., Small 800×600 in a 1024×768 window), center the terrain and disable scrolling.
- **Mouse/keyboard panning** (optional): Allow arrow keys or mouse drag to manually pan the camera during the player's turn. Auto-center overrides manual pan at turn start.

Tests:
- Viewport clamps to terrain bounds
- Auto-center positions player tank at viewport center
- Small terrain doesn't scroll (centered instead)
- Rendering offset correctly positions terrain, tanks, projectiles
- Camera lerp smoothly transitions (not instant jump)

#### T002 [B] — Tank Movement System
`src/context/GameContext.tsx` + `src/components/Canvas.tsx`

Implement tank movement (FR-046):

- **Fuel system**: Each tank starts with a fuel budget per game. Fuel amount scales with terrain size:
  - Small: 100 fuel units
  - Medium: 150 fuel units
  - Large: 200 fuel units
  - Huge: 250 fuel units
  - Epic: 350 fuel units
- **Movement**: Q key moves tank left, E key moves tank right. Each keypress moves ~5px along the terrain surface, consuming 1 fuel unit per pixel moved.
- **Terrain following**: As the tank moves horizontally, its Y position updates to match the terrain height at the new X position. Tank "walks" along the terrain surface.
- **Boundary check**: Tank cannot move past X=0 or X=terrainWidth. Movement input ignored at boundaries.
- **Fuel display**: Show remaining fuel in the control panel (e.g., "FUEL: 127"). When fuel is 0, Q/E keys do nothing.
- **Movement during turn only**: Movement only allowed when it's the player's turn and not animating.
- **Visual feedback**: Tank smoothly slides to new position (not teleport). Update barrel and label positions with tank.

Tests:
- Movement decrements fuel
- Tank Y follows terrain height at new X
- Movement stops at terrain boundaries
- Movement stops when fuel is 0
- Movement disabled during animation
- Fuel budget scales with terrain size
- AI tanks do not move (AI movement not implemented)

#### T003 [B] — Wind & Turn Indicators
`src/components/WindIndicator.tsx` + `src/components/TurnIndicator.tsx`

Implement standalone indicator components (FR-080, FR-093, FR-094):

**WindIndicator**:
- Display numeric wind speed (1 decimal place, e.g., "12.4")
- Directional arrow: ← for negative wind (blowing left), → for positive (blowing right)
- Arrow size or color intensity proportional to wind strength:
  - 0–5 m/s: subtle/light
  - 5–15 m/s: moderate
  - 15–30 m/s: strong/bright warning color
- Positioned at top of viewport (fixed, doesn't scroll with canvas)
- Label: "WIND" in dim uppercase

**TurnIndicator**:
- Display current turn number (e.g., "TURN 7")
- Display "YOUR TURN" label when player can act
- Display "FIRING..." during projectile animation
- Positioned at top of viewport alongside WindIndicator

Both components styled with design system tokens (from Spec 005 if available, functional fallback otherwise).

#### T004 [C] — Wind Particle Effects
`src/components/Canvas.tsx` (extend)

Add subtle wind particles to the canvas:
- Small semi-transparent particles (dots or short lines) flowing horizontally across the screen
- Direction matches wind: positive wind = particles flow right, negative = left
- Speed proportional to wind strength
- ~20–30 particles visible at any time, randomly distributed vertically
- Particles wrap around screen edges (exit left, re-enter right, or vice versa)
- Very subtle — should not distract from gameplay, just provide ambient wind visualization
- Particles rendered above sky but below terrain/tanks in the draw order

---

### Phase 2 — Edge Cases & Polish

#### T005 [C] — Edge Case Handling
`src/context/GameContext.tsx` (extend)
**Depends on**: All Phase 1 tasks

Implement all remaining edge cases from Master Plan:

1. **Simultaneous player + AI death**: When both the player and the last AI die in the same volley, the player is favored — declare player the winner. Check: after applying all damage in a turn, if player is dead AND all AI are dead, winner = player.

2. **All AI destroyed in single volley**: If multiple explosions in one turn kill all remaining AI, the player wins immediately after explosion animations complete. Don't wait for next turn.

3. **Multi-tank blast damage**: A single explosion can damage multiple tanks within its blast radius. Verify `calculateDamage()` returns damage for ALL tanks in range, not just the nearest.

4. **Tank at terrain edge**: Movement (Q/E) is ignored when tank.x <= 0 or tank.x >= terrain.width. Projectiles at the edge work normally.

5. **Zero-credit shop**: When player has 0 credits, the weapon shop is still functional — all buy buttons are disabled, "Ready for Battle" works. Player proceeds with standard shell only.

6. **Maximum wind (30 m/s)**: Verify projectiles curve dramatically. Wind particles move fast. Wind indicator shows strong/warning state.

7. **Tank in terrain valley**: Shots aimed at a tank in a valley may hit terrain peaks between shooter and target. AI should still attempt the shot (may miss due to terrain obstacles — this is expected behavior, not a bug).

8. **Terrain cratered beneath tank**: After an explosion modifies terrain under a tank, the tank settles to the new height. If a tank is standing on terrain that gets cratered, it "falls" to the new surface level. Verify `settleTank()` is called for all alive tanks after every crater.

9. **Multiple overlapping craters**: Each explosion carves independently. Heights array handles cumulative modifications correctly.

10. **Win/loss with 0 kills**: Player can win without killing anyone (if AI destroys each other via friendly fire from simultaneous shooting). Player should still get win bonus.

Tests for each edge case listed above.

#### T006 [A] — Performance Optimization
`src/components/Canvas.tsx`
**Depends on**: T001 (viewport)

Ensure 60fps under worst-case conditions:
- Test with Epic terrain (2100×2800) and 10 AI enemies
- 11 simultaneous projectiles with trails
- Multiple active explosions with particles
- Wind particles active
- Optimize rendering:
  - Only draw objects within the viewport bounds (cull off-screen objects)
  - Limit trail length (keep last ~100 points, not infinite)
  - Limit particle count per explosion
  - Use integer coordinates for pixel operations where possible
  - Consider requestAnimationFrame timing to skip frames if behind

---

### Phase 3 — Final Integration

#### T007 [C] — Comprehensive Integration Test
**Depends on**: All tasks in Phase 1 and Phase 2

Run the full game through every feature and edge case. This is the final verification before the game is declared complete.

**Automated tests**:
```bash
npx vitest run && npx eslint . && npx tsc -b
```
All three must pass clean. Engine coverage >80%.

**Manual test protocol — 5 consecutive games**:

**Game 1 — Basic flow (Veteran, 3 enemies, Medium terrain)**:
- [ ] Config → Shop → Battle flows smoothly
- [ ] Win the game, verify earnings breakdown
- [ ] Balance increases correctly
- [ ] Stats update (games played, wins, kills)

**Game 2 — Economy check (buy weapons, verify balance)**:
- [ ] Starting balance = previous game's ending balance
- [ ] Buy 2 sniper shots (−400), 1 heavy (−250) if affordable
- [ ] Use sniper → one-hit kill, ammo decrements
- [ ] Use heavy → big explosion, big crater, damages tanks in radius
- [ ] Run out of ammo → weapon grayed out, select standard
- [ ] Crater visibly deforms terrain, tanks settle

**Game 3 — Difficulty spread**:
- [ ] Play Blind Fool with 1 enemy → AI misses constantly
- [ ] Play Primus with 1 enemy → AI is deadly accurate
- [ ] Earnings differ by difficulty multiplier

**Game 4 — Large terrain (Epic, 10 enemies)**:
- [ ] Canvas viewport scrolls/pans to show full terrain
- [ ] Camera centers on player tank each turn
- [ ] 11 simultaneous projectiles animate at 60fps
- [ ] Wind particles visible
- [ ] Game completes without performance issues
- [ ] Multiple craters accumulate, terrain becomes war-torn

**Game 5 — Edge cases & movement**:
- [ ] Tank movement (Q/E) works, fuel depletes, shown in control panel
- [ ] Tank follows terrain surface during movement
- [ ] Tank at edge can't move further
- [ ] Win with 0 credits → shop shows only standard shell
- [ ] Wind changes each turn, wind indicator updates
- [ ] Turn indicator shows turn number and status
- [ ] Refresh mid-session → stats from previous games in LocalStorage
- [ ] Simultaneous death scenario (if achievable) → player favored

---

## Final Checkpoint: Complete Game

```bash
npx vitest run && npx eslint . && npx tsc -b
```

### Final Go/No-Go:
- [ ] `npx vitest run` — all green, >80% engine coverage
- [ ] `npx eslint .` — clean
- [ ] `npx tsc -b` — clean
- [ ] 5 consecutive games played without errors or stuck states
- [ ] Economy accumulates correctly across all 5 games
- [ ] LocalStorage persists after browser restart
- [ ] All 3 weapons behave distinctly (speed, damage, blast, crater size)
- [ ] AI difficulty is perceptibly different across all 5 tiers
- [ ] Large terrain viewport works smoothly with scrolling
- [ ] Tank movement and fuel system functional
- [ ] Wind and turn indicators display correctly
- [ ] Wind particles provide ambient feedback
- [ ] Terrain craters accumulate and persist through the match
- [ ] Tanks settle correctly after explosions beneath them
- [ ] All edge cases handled without crashes
- [ ] Game looks and feels like Scorched Earth (dark, atmospheric, war-torn)

**The game is complete.**
