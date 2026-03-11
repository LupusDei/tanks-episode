# Spec 007 — Advanced AI & Difficulty Tiers — Bead Map

## External Dependencies
- Depends on: `tanks-003` (Spec 003 — Minimal Playable Battle)
- Blocks: `tanks-008` (Spec 008 — Viewport, Movement & Final Integration)

## Bead Hierarchy

```
tanks-007        [epic]  Spec 007 — Advanced AI & Difficulty Tiers     ← depends tanks-003
  tanks-007.1    [epic]  Phase 1 — AI Engine Upgrade
    tanks-007.1.1 [task] T001[A]: Difficulty-Calibrated Shot Calculation [P]
    tanks-007.1.2 [task] T002[A]: Target Selection with Persistence     [P]
    tanks-007.1.3 [task] T003[B]: AI Name Pool                          [P]
  tanks-007.2    [epic]  Phase 2 — Integration & Calibration            ← depends 007.1
    tanks-007.2.1 [task] T004[A]: AI Integration into Game Context      ← depends 007.1.1, 007.1.2
    tanks-007.2.2 [task] T005[B]: Difficulty Calibration & Testing      ← depends 007.2.1
```

---

**Legend**: `[P]` = parallelizable (no intra-phase dependencies), `←` = blocked by listed beads
