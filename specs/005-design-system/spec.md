# Spec 005 — Scorched Earth Design System & Visual Polish

**Created**: 2026-03-10
**Status**: Draft
**Depends On**: Spec 003 (Minimal Playable Battle)
**Can Parallel With**: Specs 004, 006, 007
**Execution**: Parallel (3 tracks)
**Reference**: [Master Plan](../../tanks_plan.md) — Design Direction section for full palette, typography, and visual specs

---

## Goal

Transform the functional-but-plain game into something that **looks and feels like Scorched Earth**. Dark war-torn atmosphere, military-themed UI, polished explosions, detailed terrain, and cohesive visual language across all screens. This spec touches CSS, canvas rendering, and design tokens — it does not add game logic.

**What this spec adds**:
- Design token system (colors, typography, spacing)
- Sky gradient with depth (dark space at top → indigo horizon)
- Terrain visual upgrade (gradient fill, grass line, crater detail)
- Tank visual refinement (angled body, treads, turret detail, barrel shadow)
- Explosion particle upgrade (radial gradients, debris, screen flash, smoke)
- UI panel styling (gunmetal panels, amber accents, military typography)
- Screen styling for all non-battle screens (name entry, config, game over)
- Control panel visual design
- Health bar gradient (green → red)
- Screen transitions between phases

**What this spec does NOT touch**:
- No game logic changes
- No new features (weapons, economy, AI — those are other specs)
- No viewport/scrolling (Spec 008)

---

## Track Legend

| Track | Focus Area |
|-------|-----------|
| **A** | Design Tokens + Screen Styling (CSS) |
| **B** | Canvas Visuals (terrain, sky, tanks) |
| **C** | Canvas Effects (explosions, particles, transitions) |

---

## Tasks

### Phase 1 — Design Foundation (parallel)

#### T001 [A] — Design Token System
`src/styles/theme.ts + src/styles/global.css`

Implement design tokens from Master Plan → Design Direction:

**Colors** (export as constants):
```
sky:        { top: '#0A0E1A', horizon: '#1A1A3E' }
terrain:    { grass: '#3D5A1E', fill: '#4A3728', dirt: '#6B3A2A', crater: '#3A2A1E' }
ui:         { bg: '#1C1C1C', panel: '#2A2D32', accent: '#C89B3C', border: '#3A3A3A' }
text:       { primary: '#E8E0D0', dim: '#8B8370' }
health:     { full: '#5A8A2F', low: '#8B1A1A' }
status:     { danger: '#CC4400', success: '#2D8B4E' }
```

**Typography**:
- Heading font stack: `'Impact', 'Arial Narrow', 'Helvetica Neue Condensed', sans-serif`
- Body font stack: `system-ui, -apple-system, sans-serif`
- Mono font stack: `'SF Mono', 'Fira Code', 'Consolas', monospace`
- Font sizes: xs (11px), sm (13px), md (15px), lg (20px), xl (28px), xxl (40px)

**Spacing**: 4px base unit (xs=4, sm=8, md=16, lg=24, xl=32, xxl=48)

**Panel styles** (reusable):
- Background: ui.panel with 90% opacity
- Border: 1px solid ui.border
- Border-radius: 4px
- Subtle top highlight (1px lighter border-top)

**Global CSS**:
- Body background: ui.bg
- Default font: body font stack
- Color: text.primary
- Box-sizing: border-box
- No default margins/padding on body
- Scrollbar styling (dark theme)

#### T002 [B] — Sky & Terrain Visual Upgrade
`src/components/Canvas.tsx` (modify rendering)

Upgrade sky rendering:
- Vertical linear gradient from sky.top (#0A0E1A) at canvas top to sky.horizon (#1A1A3E) at horizon line
- Optional: scatter a few tiny white dots in upper portion for stars (subtle, not distracting)

Upgrade terrain rendering:
- Replace flat fill with vertical gradient: terrain.grass on top edge → terrain.fill in middle → terrain.dirt at base
- Grass line: 2-3px bright green strip along the top edge of the terrain polygon
- Crater areas: where terrain has been carved, show terrain.crater (#3A2A1E) — darker exposed rock where the grass layer was blown away. Detect craters by comparing current height to original generated height.
- Subtle texture: optional fine-grain noise pattern overlay on terrain (canvas pattern or per-pixel variation)

#### T003 [C] — Explosion Visual Upgrade
`src/components/Canvas.tsx` (modify rendering)

Upgrade explosion rendering:
- **Radial gradient**: Use canvas createRadialGradient with weapon-specific colors (center → outer → transparent). Standard: #FF4400→#FF8800→transparent. Sniper: #FFFFFF→#4488FF→transparent. Heavy: #FF2200→#FF6600→transparent.
- **Particle upgrade**: More particles (20–40), varied sizes, gravity-affected, fade out over lifetime. Mix of bright sparks and darker debris chunks.
- **Screen flash**: On heavy artillery or large explosions, briefly flash the entire canvas with a low-opacity white overlay (50ms, 10% opacity).
- **Smoke**: After explosion fades, leave 3–5 small gray circles that slowly drift upward and fade over 2–3 seconds. Adds lingering aftermath feel.
- **Destruction upgrade**: Tank debris flies outward as colored rectangles (hull fragments). Turret separates and tumbles. Small secondary sparks.

---

### Phase 2 — UI & Tank Polish (depends on design tokens)

#### T004 [A] — Screen Styling
Apply design system to all non-battle screens.

**All screens**:
- Dark background (ui.bg)
- Centered card layout (max-width ~500px, padding xl)
- Card uses panel styling from design tokens

**PlayerNameEntry** (`src/components/PlayerNameEntry.tsx` + CSS):
- Military stencil-style heading ("IDENTIFY YOURSELF" or "CALL SIGN")
- Dark input field: bg ui.panel, border ui.border, amber border on focus (ui.accent)
- "START" button: filled ui.accent background, uppercase text, letter-spacing, hover glow
- Subtle crosshair or insignia watermark behind the form (CSS background, very low opacity)

**GameConfigScreen** (`src/components/GameConfigScreen.tsx` + CSS):
- Section headings in uppercase, letter-spaced, dim text color
- Terrain size: button group, selected button highlighted with accent color
- Enemy count: styled slider with accent-colored track, or button row
- Difficulty: button group with difficulty names, accent highlight
- Color picker: circular or square swatches with selected-state ring in white
- "START BATTLE" button: large, filled accent, uppercase, slight pulse or glow animation
- Show terrain size dimensions in dim text below selector

**GameOverScreen** (`src/components/GameOverScreen.tsx` + CSS):
- Large winner name in heading font
- "VICTORY" in accent/success color or "DEFEAT" in danger color
- Stats displayed in a grid or table with dim labels and bright values
- "FIGHT AGAIN" button: accent fill, uppercase
- Subtle explosion or debris particles in background (CSS animation, not canvas)

#### T005 [B] — Tank Visual Refinement
`src/components/Canvas.tsx` (modify tank rendering)

Upgrade tank drawing:
- **Body**: Trapezoidal shape (wider at bottom, narrower at top) instead of plain rectangle. Angled front plate. Draw with tank color fill + darker color stroke (darken by 30%).
- **Treads**: Two rows of small dark rectangles under the body, extending slightly beyond body width. Dark gray/black.
- **Turret**: Filled circle on top of body center, slightly smaller than body width. Same color as body.
- **Barrel**: Rectangle extending from turret, rotated to current angle. Add subtle shadow (offset dark line).
- **Name label**: Small caps (CSS `font-variant: small-caps` equivalent on canvas via uppercase + reduced font size). Positioned above health bar. text.primary color.
- **Health bar**: Thin bar (3px tall) above name. Background: dark gray. Fill: gradient from health.full (#5A8A2F) at 100% to health.low (#8B1A1A) at low HP. Width proportional to HP%.
- **Turn indicator**: Small downward-pointing triangle above player's tank in ui.accent color. Gentle pulse animation (opacity oscillation).

#### T006 [C] — Control Panel Styling
`src/components/ControlPanel.tsx` + CSS

Restyle the control panel with design system:
- **Layout**: Fixed to bottom of screen, full width, panel-styled background
- **Angle readout**: Monospace font, large digits. Label "ANGLE" in dim uppercase above.
- **Power readout**: Monospace font, large digits. Label "POWER" in dim uppercase above. Optional: power bar visualization (filled bar, accent colored).
- **Adjustment buttons**: ▲/▼ for angle, ◄/► for power. Dark buttons with accent border, hover highlight.
- **Fire button**: Large, prominent. Danger/fire color (#CC4400) background, "FIRE" in uppercase white text. Disabled state: dimmed, no hover. Enabled state: subtle pulse glow.
- **Wind display**: "WIND" label in dim, value in monospace. Arrow indicating direction (← or →) colored by intensity (light for weak, bright for strong).
- **Turn display**: "TURN" label in dim, turn number in monospace.
- **Weapon name**: Display current weapon name (for future use when weapon selector exists).

---

### Phase 3 — Transitions & Final Polish

#### T007 [A] — Screen Transitions
`src/App.tsx` + CSS

Add transitions between game phases:
- Fade-out/fade-in between screens (300ms CSS transition on opacity)
- Battle start: brief "BATTLE STATIONS" or "ENGAGE" text flash before canvas appears (1s, then fade)
- Game over: canvas dims (dark overlay fades in) before game over screen content appears
- Keep transitions snappy — no longer than 500ms total

#### T008 [C] — Visual Polish Pass
All canvas rendering

Final visual consistency check:
- Ensure all canvas text uses design system fonts (set ctx.font correctly)
- Ensure all colors reference theme constants (no hardcoded hex in rendering code)
- Projectile trail: switch from plain dots to small fading circles that decrease in opacity along the trail
- Sky gradient renders correctly at all terrain sizes
- Terrain gradient renders correctly with varied terrain heights
- Tank colors are visually distinct against terrain (ensure contrast)
- Health bars readable at small sizes
- Explosions look good on both terrain and in open air
- Craters visually distinct from untouched terrain (darker fill)

---

## Checkpoint: Visual Polish

```bash
npx vitest run && npx eslint . && npx tsc -b
```

Then `npx vite dev` — the game should look dramatically better:

### What to test:
1. **Sky**: Dark gradient, not flat. Feels like night/dusk.
2. **Terrain**: Grass line visible on top, earth gradient below, craters show exposed rock
3. **Tanks**: Detailed with treads, turret, barrel shadow. Colors distinct.
4. **Explosions**: Radial gradient, debris particles, smoke aftermath. Different colors per weapon (standard = orange, sniper = blue-white, heavy = deep red — will be testable when weapons exist).
5. **Health bars**: Green → red transition as HP drops
6. **Control panel**: Military styled, monospace readouts, prominent fire button
7. **Name entry screen**: Dark, military-themed, amber accents
8. **Config screen**: Clean selector groups, accent highlights, readable
9. **Game over screen**: Dramatic winner display, stats visible
10. **Transitions**: Smooth fades between screens, brief battle-start flash
11. **Consistency**: All text, colors, spacing follow the design system

### Go/No-Go:
- [ ] Game looks like Scorched Earth (dark, war-torn, atmospheric)
- [ ] All screens styled consistently
- [ ] Canvas visuals polished (sky, terrain, tanks, explosions)
- [ ] No hardcoded colors remain in rendering code
- [ ] Transitions are smooth and snappy
- [ ] No visual regressions — game still plays correctly
- [ ] All tests pass, lint clean, build clean
