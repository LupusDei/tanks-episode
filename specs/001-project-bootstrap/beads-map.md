# Spec 001 — Project Bootstrap — Bead Map

## External Dependencies
- Depends on: None (first spec)
- Blocks: `tanks-002` (Spec 002 — Core Engine)

## Bead Hierarchy

```
tanks-001        [epic]  Spec 001 — Project Bootstrap
  tanks-001.1    [task]  T001: Initialize Project
  tanks-001.2    [task]  T002: Define Type System                    ← depends 001.1
  tanks-001.3    [task]  T003: Create Directory Structure            ← depends 001.2
```

---

**Legend**: `[P]` = parallelizable (no intra-phase dependencies), `←` = blocked by listed beads
