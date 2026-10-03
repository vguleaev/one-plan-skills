# Code blocks and Files affected format

Add code only where it clarifies a task (non-trivial code, config, or a change that is hard to describe in words); never to fill space.

**Illustrative snippets go inside `**Description:**`:** a plain fenced block with a language tag (`go`, `typescript`, `python`, `bash`, `json`, `yaml`, `sql`, ...), at most 20-30 lines. Use only triple-backtick fences (never `~~~`) and nothing but the language after the opening fence.

**Concrete file changes go in an optional `**Files affected:**` section** (per task):

Place it after the Acceptance Criteria, before the task's closing `---`, using this exact heading. One entry per file, with a status of 🟢 NEW, 🟡 MODIFIED or 🔴 DELETED:

````markdown
**Files affected:**

`src/handlers/create.ts` — 🟢 NEW

```typescript
export const handler = async () => ({ statusCode: 200 });
```

`src/config.ts` — 🟡 MODIFIED

```diff
 export const config = {
-  port: 3000,
+  port: Number(process.env.PORT ?? 3000),
 };
```

`src/legacy.ts` — 🔴 DELETED
````

- Each entry is the path in backticks, then ` — `, then the status. Put a blank line between the entry line and its code block, and a blank line before the next entry.
- NEW: full content (or a trimmed excerpt) in a fence tagged with the real language.
- MODIFIED: a ` ```diff ` block; every line starts with `+`, `-` or one space of context. The file extension picks the syntax highlighter for the diff.
- DELETED: just the entry line, no code block.
- Do not wrap entries in `<details>`/`<summary>` or turn them into list items; only the format above is recognised.

**Parser constraints** (breaking any of these makes the file silently disappear from `PLAN.html`):

- The entry line must be exactly `` `PATH` — EMOJI STATUS ``: path in backticks (repo-relative, forward slashes), status word `NEW`, `MODIFIED` or `DELETED` in capitals.
- The code block must directly follow the entry line (only blank lines in between). Exactly one fenced block per file.
- Never put a line consisting only of three backticks inside the code. For Markdown files use `+`-prefixed lines in a diff, with no context lines that are just a fence.
- List at most 10 files per task (aim for 5 or fewer). If a task needs more, split it into smaller tasks, or list only the files that matter and mention the rest in the Description. `PLAN.html` shows a warning on tasks that go over 10.
- Keep each file to about 40 lines; trim long files to the relevant excerpt (a `// ...` comment marks cut parts) and leave out lockfiles and generated files.
- For tasks that are not done yet, show the planned code; it is a proposal the user can review. When a task is completed, the entries should match what was actually written.
- Code blocks under `## Notes` and in the Progress Tracker are not rendered; keep Notes as plain bullets.
- Skip `**Files affected:**` for tasks where code adds nothing (research, verification, docs).
