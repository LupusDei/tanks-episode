# Spec 002 — Core Engine — Bead Map

## External Dependencies
- Depends on: `tanks-001` (Spec 001 — Project Bootstrap)
- Blocks: `tanks-003` (Spec 003 — Minimal Playable Battle)

## Bead Hierarchy

```
tanks-002        [epic]  Spec 002 — Core Engine                      ← depends tanks-001
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

---

**Legend**: `[P]` = parallelizable (no intra-phase dependencies), `←` = blocked by listed beads
