---
name: one-plan-check-task
description: Verify whether a T-<number> task in PLAN.md is complete by checking its acceptance criteria against the code, then tick the criteria and mark the task done. Use only when the user asks to check a task by its ID.
disable-model-invocation: true
license: MIT
metadata:
  author: Vladislav Guleaev
  version: "1.0"
---

# one-plan-check-task

**For the given task ID, check if it is completed.**

## PLAN.md file Rules

- You must check if the `T-<number>` task is completed in `PLAN.md` file.
- Understand if all acceptance criteria are met for this task, by checking the code and running the commands or tests the criteria refer to. Do not tick a criterion on assumption.
- You must set task acceptance criteria checkboxes to `[x]` if it's acceptance criteria is met, and leave the others as `[ ]`.
- You must set task status to `✅ DONE` in the Progress Tracker table if all acceptance criteria are met; otherwise keep it `🔲 TODO` and tell the user which criteria are not met.
- Do not edit `PLAN.html`; it is generated from `PLAN.md`.

**IMPORTANT: IF task ID is not mentioned, you must ask for it.**
