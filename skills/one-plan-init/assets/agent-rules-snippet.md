<!-- one-plan:start -->
## PLAN.md rules

When a file called `PLAN.md` is present in the project root, follow these rules:

- When asked to create or update a `T-<number>` task, use the `PLAN.md` file.
- When asked about a `T-<number>` task, check `PLAN.md` for the task.
- When a `T-<number>` task is completed, mark it as `✅ DONE` in `PLAN.md`.
- Every acceptance criterion of a `T-<number>` task that is met must be set to `[x]` in `PLAN.md`.
- Never edit `PLAN.html`; it is generated from `PLAN.md` (by the `one-plan-review` skill).
- When the user pastes plan review feedback (per task: `Approved` / `Request changes` / `Remove task`, plus an optional `General` section), update `PLAN.md` accordingly, leave `Approved` tasks unchanged, and summarize what changed per task.
<!-- one-plan:end -->
