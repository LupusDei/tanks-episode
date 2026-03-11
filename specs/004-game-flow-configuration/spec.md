# Spec 004 — Game Flow & Configuration

**Created**: 2026-03-10
**Status**: Draft
**Depends On**: Spec 003 (Minimal Playable Battle)
**Can Parallel With**: Specs 005, 006, 007
**Execution**: Parallel (3 tracks)
**Reference**: [Master Plan](../../tanks_plan.md)

---

## Goal

Add the full game phase state machine and all non-battle screens. After this spec, the player experiences the complete flow: enter name → configure battle → (weapon shop placeholder) → play → game over → play again. Player profile persists in LocalStorage across sessions.

**What this spec adds on top of Spec 003**:
- Player name entry screen (FR-002)
- Battle configuration screen with terrain size, enemy count, difficulty, color picker (FR-010 through FR-015)
- Game over screen with winner display and play again (FR-003)
- Full phase state machine routing (FR-001)
- LocalStorage persistence for player profile (FR-140, FR-141, FR-142)
- Configurable terrain sizes, enemy counts, and difficulty levels now functional

**What this spec does NOT include** (deferred):
- Weapon shop UI (Spec 006 — placeholder "skip" screen for now)
- Economy/credits (Spec 006)
- Design polish (Spec 005)

---

## Track Legend

| Track | Focus Area |
|-------|-----------|
| **A** | Storage Service + User Context |
| **B** | Screen Components (Name, Config, GameOver) |
| **C** | Phase State Machine + App Routing |

---

## Tasks

### Phase 1 — Persistence & State (parallel)

#### T001 [A] — LocalStorage Service
`src/services/storage.ts`

Implement:
- **saveProfile(profile: StoredPlayerProfile)**: JSON.stringify and save to localStorage key `"tank-battle-player"`.
- **loadProfile(): StoredPlayerProfile | null**: Load and JSON.parse. Return null if missing. Handle corrupted data gracefully (return null on parse error).
- **clearProfile()**: Remove the key.
- **getDefaultProfile(name: string): StoredPlayerProfile**: Returns profile with name, balance 500, zeroed stats, empty inventory.

Tests:
- Save/load round-trip preserves all fields
- Load returns null when no data stored
- Load returns null on corrupted JSON
- clearProfile removes data
- Default profile has correct starting values (500 credits, 0 stats)

#### T002 [A] — User Context
`src/context/UserContext.tsx`
**Depends on**: T001

Implement:
- React context providing: playerName, balance, stats, weaponInventory
- On mount: load profile from storage. If none, stay in "no profile" state.
- **setPlayerName(name: string)**: Create or update profile, save to storage.
- **updateBalance(delta: number)**: Add/subtract credits, save.
- **updateStats(gamesPlayed?: number, gamesWon?: number, totalKills?: number)**: Increment stats, save.
- **updateWeaponInventory(inventory: WeaponInventory)**: Update and save.
- Auto-save on every state change.
- Expose `hasProfile: boolean` for routing (name entry vs config).

#### T003 [C] — Game Context Phase Machine
`src/context/GameContext.tsx` (extend from Spec 003)

Extend the existing GameContext to support full phase routing:
- Add all phases: 'nameEntry', 'config', 'shop', 'playing', 'gameOver'
- **goToConfig()**: Transition to config phase.
- **startBattle(config: { terrainSize, enemyCount, difficulty, playerColor })**: Generate terrain at selected size, place tanks with selected count/color, set AI difficulty. Transition to playing.
- **endGame(winner: TankState)**: Set winner, transition to gameOver.
- **playAgain()**: Transition back to config.
- Remove hardcoded defaults — all battle params come from config.
- Initial phase: 'nameEntry' if no profile, 'config' if profile exists.
- Add placeholder 'shop' phase that auto-advances to 'playing' (shop UI comes in Spec 006).

### Phase 2 — Screen Components (depends on Phase 1)

#### T004 [B] — Player Name Entry Screen
`src/components/PlayerNameEntry.tsx`
**Depends on**: T002 (UserContext)

Implement (FR-002):
- Text input for player name (1–20 characters)
- Validation: disable "Start" button when name is empty or > 20 chars
- On submit: call UserContext.setPlayerName(), then transition to config phase
- If profile already exists (return visit), skip this screen (handled by phase logic in T003)
- Functional styling — centered form, readable

#### T005 [B] — Battle Configuration Screen
`src/components/GameConfigScreen.tsx`
**Depends on**: T003 (GameContext phase machine)

Implement (FR-010 through FR-015):
- **Terrain Size Selector**: 5 options displayed as buttons or radio group. Show name and dimensions: Small (800×600), Medium (1024×768), Large (1280×960), Huge (1600×1200), Epic (2100×2800). Default: Medium.
- **Enemy Count Selector**: Slider or number input, range 1–10. Display current value. Default: 3.
- **Difficulty Selector**: Dropdown or button group with 5 levels: Blind Fool, Private, Veteran, Centurion, Primus. Default: Veteran.
- **Color Picker**: 8+ color swatches. Player clicks to select. Show selected state. Default: first color.
- **"Start Battle" button**: Calls GameContext.startBattle() with selected config.
- Display player name (from UserContext) as greeting.

#### T006 [B] — Game Over Screen
`src/components/GameOverScreen.tsx`
**Depends on**: T003 (GameContext)

Implement (FR-003):
- Display winner's name prominently
- Display "Victory!" or "Defeat!" based on whether player won
- "Play Again" button → calls GameContext.playAgain() → returns to config
- Placeholder area for earnings breakdown (will be populated by Spec 006)
- Display player stats from UserContext (games played, wins, kills)
- Update stats on mount: increment gamesPlayed, conditionally increment gamesWon, add kills

#### T007 [C] — App Phase Router
`src/App.tsx` (rewrite from Spec 003)
**Depends on**: T002, T003, T004, T005, T006

Rewrite App.tsx:
- Wrap in UserContext.Provider and GameContext.Provider
- Switch on game phase:
  - 'nameEntry' → PlayerNameEntry
  - 'config' → GameConfigScreen
  - 'shop' → auto-advance to 'playing' (placeholder until Spec 006)
  - 'playing' → Canvas + ControlPanel (existing from Spec 003)
  - 'gameOver' → GameOverScreen
- Handle return visits: if profile exists in storage, skip name entry

---

## Checkpoint: Full Game Flow

```bash
npx vitest run && npx eslint . && npx tsc -b
```

Then `npx vite dev` and test:

### What to test:
1. **Fresh visit**: App loads → Player Name Entry screen
2. Type name (1–20 chars), click Start → Config screen
3. See greeting with player name
4. Change terrain size → verify all 5 options work
5. Change enemy count (1–10) → slider/selector responds
6. Change difficulty → all 5 levels selectable
7. Pick a tank color → selection highlights
8. Click "Start Battle" → battle begins with selected parameters
9. **Different terrain sizes**: Small terrain is smaller, Epic is larger
10. **Different enemy counts**: 1 enemy = only 2 tanks, 10 enemies = 11 tanks
11. **Different difficulties**: noticeable AI accuracy difference (verify in later specs)
12. Win the game → Game Over screen with winner name
13. Stats update (games played increments)
14. Click "Play Again" → Config screen (not name entry)
15. **Return visit**: Refresh browser → skips name entry, goes to config. Name persists.
16. **LocalStorage**: Close tab, reopen → name and stats preserved

### Go/No-Go:
- [ ] All 5 phases transition correctly
- [ ] Config defaults are correct (Medium/3/Veteran)
- [ ] All config options functional and affect the game
- [ ] LocalStorage persistence works across refresh
- [ ] Stats increment correctly
- [ ] No console errors
- [ ] All tests pass, lint clean, build clean
