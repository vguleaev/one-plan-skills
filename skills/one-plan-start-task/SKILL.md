---
name: one-plan-start-task
description: Start or continue working on a T-<number> task from PLAN.md, ticking acceptance criteria as they are met. Use only when the user asks to start or continue a task by its ID.
disable-model-invocation: true
license: MIT
metadata:
  author: Vladislav Guleaev
  version: "1.0"
---

# one-plan-start-task

**For the given task ID, start working on it.**

## PLAN.md file Rules

- Find task description and acceptance criteria in `PLAN.md` file by task ID.
- Start working on the task.
- Keep `PLAN.md` up to date while you work, not only at the end: set an acceptance criterion checkbox to `[x]` as soon as it is actually met.
- When all acceptance criteria are met, set the task status to `✅ DONE` in the Progress Tracker table of `PLAN.md`.
- If you stop before the task is finished, leave it as `🔲 TODO` with only the criteria that are really done ticked, and tell the user what is left.
- Do not mark a criterion or the task as done without checking it (run the code, tests or commands the criterion refers to).
- If the task has a `**Files affected:**` section, update it at the end so it matches the code you actually wrote (same format as in the `one-plan-init` skill).
- Do not edit `PLAN.html`; it is generated from `PLAN.md`.

**IMPORTANT: IF task ID is not mentioned, you must ask for it.**
