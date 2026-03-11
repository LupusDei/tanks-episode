# Spec 003 — Minimal Playable Battle — Bead Map

## External Dependencies
- Depends on: `tanks-002` (Spec 002 — Core Engine)
- Blocks: `tanks-004`, `tanks-005`, `tanks-006`, `tanks-007`

## Bead Hierarchy

```
tanks-003        [epic]  Spec 003 — Minimal Playable Battle            ← depends tanks-002
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

---

**Legend**: `[P]` = parallelizable (no intra-phase dependencies), `←` = blocked by listed beads
