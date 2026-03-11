# Tank Battle — Project Instructions

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

- **Worktrees**: Use git worktrees when editing files that another parallel agent may also be editing within the same phase of the spec. This prevents merge conflicts between concurrent tracks.
- **Commit often**: Make small, focused commits as you complete each task or meaningful unit of work.
- **Commit messages**: Start with the task ID, user story, or phase. Be clear about what changed and why. Example: `feat(T003): implement terrain generation engine`
- **Merge to main**: Always merge your work onto main when complete. Do not leave finished work on detached branches or worktrees.

## Spec & Task Reference

- The master plan lives at `tanks_plan.md` — contains all requirements, architecture, constants, and design direction.
- Individual specs live at `specs/00N-<name>/spec.md` (001 through 008).
- Spec execution order: 001 → 002 → 003 → (004, 005, 006, 007 in parallel) → 008.
