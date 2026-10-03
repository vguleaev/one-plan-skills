---
name: one-plan-review
description: Build an interactive HTML review page for the project's PLAN.md plan, open it in the browser, and explain how to leave structured per-task feedback that the user copies back into the chat. Use when the user wants to visually review a plan, see PLAN.md rendered nicely, or approve or request changes on tasks instead of editing Markdown by hand.
license: MIT
compatibility: Requires Node.js to run scripts/plan-html.mjs (Node core modules only, nothing to install).
metadata:
  author: Vladislav Guleaev
  version: "1.0"
---

# one-plan-review

**Build the HTML review UI for `PLAN.md`, open it, and explain the collaborative feedback loop.**

## Steps

1. Confirm `PLAN.md` exists at the project root. If it doesn't, tell the user to run `one-plan-init` first.
2. Build the review page once (safe, one-shot, terminates immediately). Run it from the project root, pointing at `scripts/plan-html.mjs` inside this skill's folder (`<skill-dir>` is the folder containing this `SKILL.md`, wherever your agent installed it):
   ```
   node <skill-dir>/scripts/plan-html.mjs
   ```
   This reads `PLAN.md` and writes `PLAN.html` in the current directory (pass `--root <dir>` to use another project folder).
3. Open `PLAN.html` for the user right away so they can see the rendered plan immediately:
   ```
   open PLAN.html
   ```
   (macOS `open`; use the platform equivalent otherwise.) This works as a plain static file — no server needed.
4. Explain the collaborative feedback loop to the user, in your own words, covering:
   - Each task has a segmented control: **Approve**, **Request changes**, **Remove task** — plus an optional comment per task.
   - There's a **General feedback** panel at the bottom for notes that apply to the whole plan.
   - Hitting **Export feedback** opens a preview of the feedback as Markdown; **Copy** puts it on the clipboard so the user can paste it directly into the agent chat.
   - Tasks with a `**Files affected:**` section show a compact file list; clicking a file opens a large viewer with all the task's files as tabs and syntax-highlighted code or diffs.
   - The round **?** button (or `⌘/`) turns on ask mode: click anything on the page, type a question, and a prompt that names the exact location in `PLAN.md` is copied for the agent chat. When such a question is pasted, answer it from `PLAN.md` and don't edit files unless asked.
   - There is no feedback file written anywhere — feedback only ever exists as text the user hands to the agent directly.
5. When the user pastes that feedback text into the chat, apply it to `PLAN.md`: update descriptions/acceptance criteria for tasks marked `Request changes`, address per-task and `General` notes, and leave tasks marked `Approved` unchanged. Then summarize what changed per task.
6. **Do not start a long-running server yourself.** If the user wants an uninterrupted, live-reloading experience while iterating on the plan, suggest this command for them to run in their own terminal:
   ```
   node <skill-dir>/scripts/plan-html.mjs --watch --serve
   ```
   This regenerates `PLAN.html` automatically the moment `PLAN.md` changes (e.g. right after the agent marks a task `✅ DONE`), so the browser tab stays in sync without re-running the build. It's purely a live-reload convenience — feedback via Copy works the same with or without it. After the script itself is updated, restart this command: a running process keeps the old script in memory.

## Notes

- The script and template (`scripts/plan-html.mjs`, `assets/plan-html.template.html`) are self-contained — Node core modules only, no install step.
- Never edit `PLAN.html` by hand; it's fully regenerated from `PLAN.md`.
- Default port is `4173`; pass `--port <n>` to change it, `--root` to use another project folder, and `--in`/`--out` to target a different plan file.
