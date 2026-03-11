# Spec 005 — Design System & Visual Polish — Bead Map

## External Dependencies
- Depends on: `tanks-003` (Spec 003 — Minimal Playable Battle)
- Blocks: `tanks-008` (Spec 008 — Viewport, Movement & Final Integration)

## Bead Hierarchy

```
tanks-005        [epic]  Spec 005 — Design System & Visual Polish      ← depends tanks-003
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

---

**Legend**: `[P]` = parallelizable (no intra-phase dependencies), `←` = blocked by listed beads
