# Tank Battle — Project Instructions

This project uses **bd** (beads) for issue tracking. Run `bd onboard` to get started.

## Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --status in_progress  # Claim work
bd close <id>         # Complete work
bd sync               # Sync with git
```

## Testing

- Write tests to achieve near-total test coverage. Every public function, branch, and edge case should have a corresponding test.
- Run the full test suite, linter, and build before considering any task complete:
  ```bash
  npx vitest run && npx eslint . && npx tsc -b
  ```
- All three must pass clean. Do not commit code that breaks tests, lint, or build.

## Code Quality

- Write clean, well-named, modular functions and classes. Prefer small single-purpose functions over large multi-step ones.
- Keep engine code (src/engine/) free of React imports — pure logic only.
- Use strict TypeScript. No `any` types.

## Git Workflow

- **Worktrees**: Always Use git worktrees because other parallel agents may also be editing the same files. This prevents merge conflicts between concurrent tracks.
- **Commit often**: Make small, focused commits as you complete each task or meaningful unit of work.
- **Commit messages**: Start with the bead id, user story, and phase. Be clear about what changed and why. Example: `tanks-001.1: Initialize Project`
- **Merge to main**: Always merge your work onto main when complete. Do not leave finished work on detached branches or worktrees.

### Bead Self-Assignment (MANDATORY)

**You MUST assign yourself to any bead you start working on.** This is non-negotiable.
**EVERY `bd update --status=in_progress` MUST include `--assignee=<your-name>`.**

```bash
bd update <id> --assignee=<your-agent-name> --status=in_progress
```

- Before touching any code for a bead, run `bd update <id> --assignee=<your-name> --status=in_progress`
- This applies even if you delegate subtasks to teammates — the **primary agent** who owns the work gets assigned to the parent bead
- If you spawn teammates for child beads, assign yourself to the parent epic/sub-epic and assign each teammate to their specific child beads
- When a user tells you to work on a bead or epic, your FIRST action must be self-assignment — before planning, before reading code, before spawning teammates
- Unassigned in-progress beads are a bug. Every `in_progress` bead must have an assignee.
- The user and other agents rely on assignee data for workload visibility. Without it, beads appear orphaned.

## Spec & Task Reference

- The master plan lives at `tanks_plan.md` — contains all requirements, architecture, constants, and design direction.
- Individual specs live at `specs/00N-<name>/spec.md` (001 through 008).
- Spec execution order: 001 → 002 → 003 → (004, 005, 006, 007 in parallel) → 008.

### Navigating Specs and Beads

Each spec has a corresponding bead epic and a scoped bead map:

| Spec | Epic | Directory |
|------|------|-----------|
| 001 — Project Bootstrap | `tanks-001` | `specs/001-project-bootstrap/` |
| 002 — Core Engine | `tanks-002` | `specs/002-core-engine/` |
| 003 — Minimal Playable Battle | `tanks-003` | `specs/003-minimal-playable-battle/` |
| 004 — Game Flow & Configuration | `tanks-004` | `specs/004-game-flow-configuration/` |
| 005 — Design System & Visual Polish | `tanks-005` | `specs/005-design-system/` |
| 006 — Weapons & Economy | `tanks-006` | `specs/006-weapons-economy/` |
| 007 — Advanced AI & Difficulty | `tanks-007` | `specs/007-advanced-ai-difficulty/` |
| 008 — Viewport, Movement & Final | `tanks-008` | `specs/008-viewport-movement-integration/` |

Each spec directory contains:
- `spec.md` — Full specification with tasks, acceptance criteria, and checkpoint
- `beads-map.md` — Scoped bead hierarchy with dependency wiring for that spec

The top-level `specs/beads-map.md` has the full cross-spec hierarchy overview.

Bead IDs follow hierarchical numbering: `tanks-NNN` (epic) → `tanks-NNN.P` (phase/sub-epic) → `tanks-NNN.P.T` (task). When starting work on a bead, always read the corresponding `spec.md` for full context and the `beads-map.md` to understand dependencies.
