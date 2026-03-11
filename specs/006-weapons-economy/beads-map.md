# Spec 006 — Weapons & Economy — Bead Map

## External Dependencies
- Depends on: `tanks-003` (Spec 003 — Minimal Playable Battle)
- Blocks: `tanks-008` (Spec 008 — Viewport, Movement & Final Integration)

## Bead Hierarchy

```
tanks-006        [epic]  Spec 006 — Weapons & Economy                  ← depends tanks-003
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

---

**Legend**: `[P]` = parallelizable (no intra-phase dependencies), `←` = blocked by listed beads
