# Tank Battle — Bead Map

## Execution Order
```
001 (serial) → 002 (serial) → 003 (serial) → (004, 005, 006, 007 parallel) → 008 (serial)
```

## Spec 001 — Project Bootstrap (`tanks-001`, P0)
```
tanks-001        [epic]  Spec 001 — Project Bootstrap
  tanks-001.1    [task]  T001: Initialize Project
  tanks-001.2    [task]  T002: Define Type System                    ← depends 001.1
  tanks-001.3    [task]  T003: Create Directory Structure            ← depends 001.2
```

## Spec 002 — Core Engine (`tanks-002`, P0) ← depends tanks-001
```
tanks-002        [epic]  Spec 002 — Core Engine
  tanks-002.1    [epic]  Phase 1 — Independent Engine Modules
    tanks-002.1.1 [task] T001[A]: Terrain Generation & Crater Carving  [P]
    tanks-002.1.2 [task] T002[B]: Physics Engine                       [P]
    tanks-002.1.3 [task] T003[C]: Projectile System                    [P]
    tanks-002.1.4 [task] T004[D]: Weapon Configs & Damage Calculation  [P]
  tanks-002.2    [epic]  Phase 2 — Cross-Dependency Modules            ← depends 002.1
    tanks-002.2.1 [task] T005[A]: Tank Placement & Names               ← depends 002.1.1
    tanks-002.2.2 [task] T006[B]: Wind System                          ← depends 002.1.2
    tanks-002.2.3 [task] T007[C]: Explosion System                     ← depends 002.1.4
    tanks-002.2.4 [task] T008[D]: AI System (Basic)                    ← depends 002.1.1, 002.1.2
```

## Spec 003 — Minimal Playable Battle (`tanks-003`, P0) ← depends tanks-002
```
tanks-003        [epic]  Spec 003 — Minimal Playable Battle
  tanks-003.1    [epic]  Phase 1 — Foundation (parallel)
    tanks-003.1.1 [task] T001[C]: Game Context (Battle State)          [P]
    tanks-003.1.2 [task] T002[D]: Keyboard Hook                        [P]
    tanks-003.1.3 [task] T003[A]: Canvas Foundation                    [P]
    tanks-003.1.4 [task] T004[B]: Tank Rendering                       ← depends 003.1.3
  tanks-003.2    [epic]  Phase 2 — Interactivity                       ← depends 003.1
    tanks-003.2.1 [task] T005[D]: Control Panel                        ← depends 003.1.1
    tanks-003.2.2 [task] T006[A]: Projectile Animation                 ← depends 003.1.1, 003.1.3
    tanks-003.2.3 [task] T007[B]: Explosion & Destruction Rendering    ← depends 003.1.1, 003.1.4
    tanks-003.2.4 [task] T008[C]: Turn Resolution Engine               ← depends 003.1.1
  tanks-003.3    [epic]  Phase 3 — Game Loop Completion                ← depends 003.2
    tanks-003.3.1 [task] T009[A]: App Integration                      ← depends 003.1.1, 003.1.3, 003.2.1, 003.2.4
    tanks-003.3.2 [task] T010[D]: Integration Testing & Tuning         ← depends 003.3.1
```

## Spec 004 — Game Flow & Configuration (`tanks-004`, P1) ← depends tanks-003
```
tanks-004        [epic]  Spec 004 — Game Flow & Configuration
  tanks-004.1    [epic]  Phase 1 — Persistence & State
    tanks-004.1.1 [task] T001[A]: LocalStorage Service                 [P]
    tanks-004.1.2 [task] T002[A]: User Context                         ← depends 004.1.1
    tanks-004.1.3 [task] T003[C]: Game Context Phase Machine            [P]
  tanks-004.2    [epic]  Phase 2 — Screen Components                   ← depends 004.1
    tanks-004.2.1 [task] T004[B]: Player Name Entry Screen             ← depends 004.1.2
    tanks-004.2.2 [task] T005[B]: Battle Configuration Screen          ← depends 004.1.3
    tanks-004.2.3 [task] T006[B]: Game Over Screen                     ← depends 004.1.3
    tanks-004.2.4 [task] T007[C]: App Phase Router                     ← depends 004.1.2, 004.1.3, 004.2.1, 004.2.2, 004.2.3
```

## Spec 005 — Design System & Visual Polish (`tanks-005`, P1) ← depends tanks-003
```
tanks-005        [epic]  Spec 005 — Design System & Visual Polish
  tanks-005.1    [epic]  Phase 1 — Design Foundation
    tanks-005.1.1 [task] T001[A]: Design Token System                  [P]
    tanks-005.1.2 [task] T002[B]: Sky & Terrain Visual Upgrade         [P]
    tanks-005.1.3 [task] T003[C]: Explosion Visual Upgrade             [P]
  tanks-005.2    [epic]  Phase 2 — UI & Tank Polish                    ← depends 005.1
    tanks-005.2.1 [task] T004[A]: Screen Styling                       ← depends 005.1.1
    tanks-005.2.2 [task] T005[B]: Tank Visual Refinement               [P]
    tanks-005.2.3 [task] T006[C]: Control Panel Styling                [P]
  tanks-005.3    [epic]  Phase 3 — Transitions & Final Polish          ← depends 005.2
    tanks-005.3.1 [task] T007[A]: Screen Transitions                   [P]
    tanks-005.3.2 [task] T008[C]: Visual Polish Pass                   ← depends 005.2.2
```

## Spec 006 — Weapons & Economy (`tanks-006`, P1) ← depends tanks-003
```
tanks-006        [epic]  Spec 006 — Weapons & Economy
  tanks-006.1    [epic]  Phase 1 — Weapon Foundation
    tanks-006.1.1 [task] T001[B]: Weapon Selection Panel               [P]
    tanks-006.1.2 [task] T002[A]: Weapon Shop Screen                   [P]
    tanks-006.1.3 [task] T003[C]: Economy Engine                       [P]
  tanks-006.2    [epic]  Phase 2 — Integration                         ← depends 006.1
    tanks-006.2.1 [task] T004[B]: Weapon Firing Integration            ← depends 006.1.1
    tanks-006.2.2 [task] T005[A]: Shop Phase Integration               ← depends 006.1.2, 006.1.3
    tanks-006.2.3 [task] T006[C]: Game Over Earnings Display           ← depends 006.1.3
  tanks-006.3    [epic]  Phase 3 — Polish & Testing                    ← depends 006.2
    tanks-006.3.1 [task] T007[B]: Weapon Visual Differentiation        ← depends 006.2.1
    tanks-006.3.2 [task] T008[C]: Integration Testing                  ← depends 006.2.2, 006.2.3, 006.3.1
```

## Spec 007 — Advanced AI & Difficulty Tiers (`tanks-007`, P1) ← depends tanks-003
```
tanks-007        [epic]  Spec 007 — Advanced AI & Difficulty Tiers
  tanks-007.1    [epic]  Phase 1 — AI Engine Upgrade
    tanks-007.1.1 [task] T001[A]: Difficulty-Calibrated Shot Calculation [P]
    tanks-007.1.2 [task] T002[A]: Target Selection with Persistence     [P]
    tanks-007.1.3 [task] T003[B]: AI Name Pool                          [P]
  tanks-007.2    [epic]  Phase 2 — Integration & Calibration            ← depends 007.1
    tanks-007.2.1 [task] T004[A]: AI Integration into Game Context      ← depends 007.1.1, 007.1.2
    tanks-007.2.2 [task] T005[B]: Difficulty Calibration & Testing      ← depends 007.2.1
```

## Spec 008 — Viewport, Movement & Final Integration (`tanks-008`, P1) ← depends tanks-004, 005, 006, 007
```
tanks-008        [epic]  Spec 008 — Viewport, Movement & Final Integration
  tanks-008.1    [epic]  Phase 1 — Core Features
    tanks-008.1.1 [task] T001[A]: Canvas Viewport System               [P]
    tanks-008.1.2 [task] T002[B]: Tank Movement System                 [P]
    tanks-008.1.3 [task] T003[B]: Wind & Turn Indicators               [P]
    tanks-008.1.4 [task] T004[C]: Wind Particle Effects                [P]
  tanks-008.2    [epic]  Phase 2 — Edge Cases & Polish                 ← depends 008.1
    tanks-008.2.1 [task] T005[C]: Edge Case Handling                   ← depends 008.1.1, 008.1.2
    tanks-008.2.2 [task] T006[A]: Performance Optimization             ← depends 008.1.1
  tanks-008.3    [epic]  Phase 3 — Final Integration                   ← depends 008.2
    tanks-008.3.1 [task] T007[C]: Comprehensive Integration Test       ← depends 008.2.1, 008.2.2
```

---

**Legend**: `[P]` = parallelizable (no intra-phase dependencies), `←` = blocked by listed beads
