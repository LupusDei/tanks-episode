# Spec 004 — Game Flow & Configuration — Bead Map

## External Dependencies
- Depends on: `tanks-003` (Spec 003 — Minimal Playable Battle)
- Blocks: `tanks-008` (Spec 008 — Viewport, Movement & Final Integration)

## Bead Hierarchy

```
tanks-004        [epic]  Spec 004 — Game Flow & Configuration          ← depends tanks-003
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

---

**Legend**: `[P]` = parallelizable (no intra-phase dependencies), `←` = blocked by listed beads
