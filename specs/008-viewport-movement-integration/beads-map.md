# Spec 008 — Viewport, Movement & Final Integration — Bead Map

## External Dependencies
- Depends on: `tanks-004`, `tanks-005`, `tanks-006`, `tanks-007` (all parallel specs must complete)

## Bead Hierarchy

```
tanks-008        [epic]  Spec 008 — Viewport, Movement & Final Integration ← depends tanks-004, 005, 006, 007
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
