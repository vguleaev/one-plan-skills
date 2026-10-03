---
name: one-plan-add-task
description: Add a new T-<number> task to the existing PLAN.md, in both the Progress Tracker and the Tasks section. Use only when the user explicitly asks to add a task to the plan.
disable-model-invocation: true
license: MIT
metadata:
  author: Vladislav Guleaev
  version: "1.0"
---

# one-plan-add-task

**For the given task, add a new task to the `PLAN.md` file.**

## PLAN.md file Rules

- New task ID must be unique: use the highest existing ID plus one.
- Task ID must be in the format `T-NNN`: the prefix `T-` and a number zero-padded to three digits (`T-007`, `T-012`). Never use unpadded IDs like `T-7`. If the plan has older unpadded IDs, leave them as they are.
- You must add task to the "Progress Tracker" section of the `PLAN.md` file.
- You must set task status to `🔲 TODO`.
- You must add task to the "Tasks" section of the `PLAN.md` file.
- The `{{TASK_DESCRIPTION}}` may include fenced code blocks (e.g. ` ```javascript ... ``` `) to illustrate the task, using whatever language fits. Keep each code block to at most 20-30 lines.
- If the task creates, changes or deletes specific files, add a `**Files affected:**` section after the Acceptance Criteria. Skip it for tasks where code adds nothing (research, verification, docs).
- Code blocks and the "Files affected" section must follow the exact format described in [references/plan-format.md](references/plan-format.md), because `PLAN.html` is built from it. Read that file before adding code.
- You must use the following task template:

```markdown
#### T-<number>: {{TASK_NAME}}

**Description:**  
{{TASK_DESCRIPTION}}

**Acceptance Criteria:**

- [ ] {{ACCEPTANCE_CRITERIA_1}}
- [ ] {{ACCEPTANCE_CRITERIA_2}}
- [ ] {{ACCEPTANCE_CRITERIA_3}}
- [ ] {{ACCEPTANCE_CRITERIA_4}}

{{FILES_AFFECTED_SECTION_IF_NEEDED}}
```

Files affected entry shapes (one per file; status is 🟢 NEW, 🟡 MODIFIED or 🔴 DELETED):

````markdown
**Files affected:**

`path/to/new-file.go` — 🟢 NEW

```go
package example
```

`path/to/changed-file.go` — 🟡 MODIFIED

```diff
 unchanged line
-old line
+new line
```

`path/to/removed-file.go` — 🔴 DELETED
````
