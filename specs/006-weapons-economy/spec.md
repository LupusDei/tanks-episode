# Spec 006 — Weapons & Economy

**Created**: 2026-03-10
**Status**: Draft
**Depends On**: Spec 003 (Minimal Playable Battle)
**Can Parallel With**: Specs 004, 005, 007
**Execution**: Parallel (3 tracks)
**Reference**: [Master Plan](../../tanks_plan.md) — Weapon Configurations, Economy Model

---

## Goal

Add the three-weapon system and full credit economy. Players can buy Sniper Shots and Heavy Artillery before battle, select weapons during combat, and earn credits based on performance. Balance persists across sessions. Each weapon has distinct gameplay characteristics — the sniper is a precision instant-kill, the heavy has a massive blast radius, and the standard is the reliable fallback.

**What this spec adds**:
- Weapon shop screen with purchase UI (FR-060 through FR-065)
- In-battle weapon selector panel (FR-051 through FR-055)
- Three distinct weapons with unique blast/damage/speed (FR-050)
- Credit economy: earnings per kill, win bonus, loss consolation (FR-120 through FR-125)
- Difficulty-scaled earnings multipliers
- Earnings breakdown on game over screen (FR-003 update)
- Weapon inventory persistence in LocalStorage

**What this spec does NOT include**:
- No new weapon types beyond the three
- No AI weapon usage (AI always uses standard shell, FR-113)
- No design polish beyond functional styling (Spec 005 handles aesthetics)

---

## Track Legend

| Track | Focus Area |
|-------|-----------|
| **A** | Weapon Shop + Purchase Logic |
| **B** | In-Battle Weapon System |
| **C** | Economy + Earnings |

---

## Tasks

### Phase 1 — Weapon Foundation (parallel)

#### T001 [B] — Weapon Selection Panel
`src/components/WeaponSelectionPanel.tsx`

Implement (FR-051 through FR-055):
- Display all three weapons with icons/names: Standard Shell, Sniper Shot, Heavy Artillery
- Show ammo count next to each weapon (∞ for standard)
- Highlight currently selected weapon
- Gray out weapons with 0 ammo — clicking them does nothing
- Click a weapon to make it active for the next shot
- Standard Shell always available, always selectable
- Panel positioned to the side of the battle canvas or integrated into ControlPanel
- Read weapon inventory from game state, write selected weapon back to GameContext

#### T002 [A] — Weapon Shop Screen
`src/components/WeaponShop.tsx`

Implement (FR-060 through FR-065):
- Display before each battle (between config and playing phases)
- Show all three weapons in a list/grid:
  - **Standard Shell**: "Basic explosive shell. Reliable and free." — Damage: 35%, Blast: 20px, Cost: Free, Ammo: ∞
  - **Sniper Shot**: "Precision round. One-shot kill but tiny blast radius." — Damage: 100%, Blast: 12px, Cost: 200 credits
  - **Heavy Artillery**: "Massive blast radius. Doesn't need to be accurate." — Damage: 65%, Blast: 35px, Cost: 250 credits
- Each purchasable weapon has a "Buy" button
- **Buy button disabled** when player balance < weapon cost (FR-064)
- On purchase: deduct cost from balance, increment weapon ammo by 1 (FR-063)
- Player balance displayed prominently at top (FR-062)
- **"Ready for Battle" button**: Proceeds to battle without purchasing (FR-065). Also labeled "Skip" or "Enter Battle".
- Show current ammo counts (how many already owned)
- Allow buying multiple of the same weapon (each click = +1 ammo, -cost credits)

Tests:
- Balance deducts correctly on purchase
- Ammo increments by 1 per purchase
- Buy button disabled when insufficient funds
- Can buy multiple of same weapon
- "Ready for Battle" proceeds without purchases
- Cannot buy with exactly 0 credits remaining (if weapon cost > 0)

#### T003 [C] — Economy Engine
`src/context/GameContext.tsx` + `src/context/UserContext.tsx`

Implement earnings calculation (FR-120 through FR-125):
- Track kills during battle (count per game)
- On game end, calculate earnings:
  - Kill earnings: kills × 200 × difficultyMultiplier
  - Win bonus: 250 × difficultyMultiplier (if player won)
  - Loss consolation: 50 × difficultyMultiplier (if player lost)
  - Total = kill earnings + bonus
- Difficulty multipliers: Blind Fool 0.5×, Private 0.75×, Veteran 1.0×, Centurion 1.25×, Primus 1.5×
- Update UserContext balance with total earnings
- Store earnings breakdown for display on GameOverScreen

Tests:
- Kill at Veteran = 200 credits
- Kill at Primus = 300 credits (200 × 1.5)
- Win bonus at Veteran = 250
- Loss consolation at Veteran = 50
- Multiple kills accumulate
- Earnings added to existing balance
- Balance persists after game end (via UserContext → storage)

---

### Phase 2 — Integration (cross-track dependencies)

#### T004 [B] — Weapon Firing Integration
`src/context/GameContext.tsx` (extend turn resolution)
**Depends on**: T001 (weapon selection)

Integrate weapon selection into the fire-and-resolve loop:
- Player's queued shot includes selected weapon type
- Projectile speed modified by weapon's speedMultiplier (sniper 1.3× faster, heavy 0.8× slower)
- On fire: if weapon is non-standard, decrement ammo by 1 (FR-053)
- If selected weapon has 0 ammo, auto-switch to standard shell before firing
- Damage calculation uses the fired weapon's damage% and blastRadius
- Explosion created with weapon-specific colors
- Crater size matches weapon's blastRadius

Tests:
- Standard shell: 35% damage, 20px crater/blast
- Sniper shot: 100% damage (instant kill on direct hit), 12px blast, projectile is 1.3× faster
- Heavy artillery: 65% damage, 35px blast/crater, projectile is 0.8× slower
- Ammo decrements on fire (sniper, heavy)
- Ammo does NOT decrement for standard shell
- Auto-switch to standard when selected weapon empty

#### T005 [A] — Shop Phase Integration
`src/App.tsx` + `src/context/GameContext.tsx`
**Depends on**: T002 (weapon shop), T003 (economy)

Wire the weapon shop into the game phase flow:
- After config phase, transition to 'shop' phase → render WeaponShop
- WeaponShop reads balance from UserContext, weapon inventory from UserContext
- On "Ready for Battle": transfer weapon inventory to GameContext (battle weapon ammo), transition to 'playing'
- On game over: calculate earnings (T003), update balance, show earnings in GameOverScreen

#### T006 [C] — Game Over Earnings Display
`src/components/GameOverScreen.tsx` (extend)
**Depends on**: T003 (economy calculates earnings)

Update the game over screen with earnings breakdown:
- Show kills count (e.g., "Tanks Destroyed: 3")
- Show kill earnings (e.g., "Kill Reward: 3 × 200 × 1.0 = 600")
- Show win/loss bonus (e.g., "Victory Bonus: 250" or "Consolation: 50")
- Show difficulty multiplier applied
- Show total earned this game
- Show new balance
- Show previous balance (before earnings) for comparison

---

### Phase 3 — Polish & Testing

#### T007 [B] — Weapon Visual Differentiation
`src/components/Canvas.tsx` (extend)
**Depends on**: T004

Ensure weapons are visually distinct in battle:
- **Standard Shell projectile**: small orange circle, moderate speed
- **Sniper Shot projectile**: small white/blue circle, faster, thinner trail
- **Heavy Artillery projectile**: larger dark red circle, slower, thicker trail
- Explosion colors per weapon (from WEAPON_CONFIGS):
  - Standard: #FF4400 center → #FF8800 outer
  - Sniper: #FFFFFF center → #4488FF outer
  - Heavy: #FF2200 center → #FF6600 outer
- Crater sizes visibly different (12px sniper = tiny, 35px heavy = large)

#### T008 [C] — Integration Testing
**Depends on**: T005, T006, T007

End-to-end weapon and economy flow:
- Start with 500 credits → shop → buy 2 snipers (−400) → balance shows 100
- Buy heavy (should be disabled — costs 250, only have 100)
- Enter battle → weapon selector shows: Standard (∞), Sniper (2), Heavy (0)
- Fire sniper → projectile is faster, smaller blast, instant kill on hit. Ammo: 1 remaining.
- Fire sniper again → ammo: 0. Sniper grayed out.
- Fire standard → normal behavior
- Win game → earnings: kills × 200 × multiplier + win bonus
- New balance = old balance + earnings
- Play again → shop → balance reflects accumulated earnings
- Refresh browser → balance persists

---

## Checkpoint: Weapons & Economy

```bash
npx vitest run && npx eslint . && npx tsc -b
```

### What to test:
1. **Weapon shop**: All 3 weapons displayed with correct stats. Buy works, balance deducts.
2. **Insufficient funds**: Buy button disabled when can't afford.
3. **In-battle**: Weapon selector shows owned weapons. Click to switch.
4. **Standard Shell**: Free, ∞ ammo, orange explosion, 20px crater
5. **Sniper Shot**: Faster projectile, white/blue explosion, tiny crater, instant kill
6. **Heavy Artillery**: Slower projectile, red explosion, large crater, 65% damage
7. **Ammo tracking**: Non-standard ammo decrements. At 0 → grayed out.
8. **Auto-switch**: If selected weapon empty, auto-selects standard
9. **Economy**: Kill = 200 × multiplier. Win = 250 × multiplier. Loss = 50 × multiplier.
10. **Earnings display**: Game over shows full breakdown
11. **Persistence**: Balance carries across games and browser sessions

### Go/No-Go:
- [ ] All 3 weapons behave distinctly (speed, damage, blast, visuals)
- [ ] Weapon shop purchase flow works correctly
- [ ] Economy math is accurate with difficulty multipliers
- [ ] Earnings display on game over is clear and correct
- [ ] Balance persists across games and sessions
- [ ] No exploits (can't buy with insufficient funds, can't fire empty weapon)
- [ ] All tests pass, lint clean, build clean
