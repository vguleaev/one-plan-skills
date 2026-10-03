<p align="center">
  <img src="one-plan-skills.png" alt="one plan agent skills" width="480">
</p>

# one-plan-skills

Just **one** `PLAN.md`**. Agent Skills for lightweight spec-driven development.**

Agent Skills ([spec](https://agentskills.io/specification)) to generate a `PLAN.md` file with multiple tasks. They work in any agent that supports the Agent Skills format (Claude Code, Cursor, Codex CLI, GitHub Copilot, Gemini CLI, ...).

## Core idea

> One feature, one `PLAN.md`. Simple workflow for AI agentic engineering.

This is [spec-driven development](https://martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html) (write the spec first, then let the agent) without the heavy workflow: one Markdown file instead of a folder of requirements, design and task documents.

It's a very lightweight framework for SDD (Spec-Driven Development) using skills:

- **One feature, one plan.** Create `PLAN.md` when you start a feature and throw it away when the feature is done. There's no need to commit it; the code and its tests are what stay.
- **Every task is verifiable.** Each task has acceptance criteria, and the agent checks them against the code before marking the task done.
- **Your pace.** Let the agent implement the whole plan in one go, or go task by task so each change stays small and easy to review.
- **Visual plan review.** The agent builds a `PLAN.html` page that you can review in the browser. Instead of looking at boring markdown files, you can comfortably review the plan and collaborate with the agent by copy-pasting feedback to the chat.

## Install

```sh
npx skills add vguleaev/one-plan-skills --all
```

The `skills` CLI copies the skills to the folder each agent expects. `--all` installs every skill without asking you to pick.

## Skills

| Skill                 | What it does                                                           | Example                                 |
| --------------------- | ---------------------------------------------------------------------- | --------------------------------------- |
| `one-plan-init`       | Create `PLAN.md` for a feature, with tasks and acceptance criteria     | `/one-plan-init Implement OAuth2 login` |
| `one-plan-add-task`   | Add a task to an existing `PLAN.md`                                    | `/one-plan-add-task Configure Tailwind` |
| `one-plan-start-task` | Work on a task, ticking criteria as they are met                       | `/one-plan-start-task T-002`            |
| `one-plan-check-task` | Verify a task's criteria and mark it done                              | `/one-plan-check-task T-002`            |
| `one-plan-review`     | Build an HTML review page from `PLAN.md` and collect per-task feedback | `/one-plan-review`                      |

The examples use the `/name` syntax of Claude Code and Cursor. In Codex, use `$name`.

The first four skills only run when you ask for them. `one-plan-review` can also start on its own, for example when you ask to review the plan.

## Usage

The skills follow a simple agentic engineering loop: **Plan → Review plan → Give feedback → Implement**. You stay in control of what gets built, and the agent does the typing.

1. Plan a feature:

```
 /one-plan-init Implement OAuth2 login
```

2. Review the plan in the browser, approve tasks or request changes, and paste the feedback back into the chat:

```
 /one-plan-review
```

3. Work on a task:

```
 /one-plan-start-task T-001
```

4. Confirm it is finished:

```
 /one-plan-check-task T-001
```

You can also just ask in plain words, for example "Start working on T-003 and check whether T-002 is done". Every `PLAN.md` ends with an `## Agent Instructions` section that tells the agent how to use it.

## What's in [PLAN.md](http://PLAN.md)

- A **Progress Tracker** table with every task and its status (`🔲 TODO` or `✅ DONE`)
- A section per task with a unique `T-<number>` ID, a description and acceptance criteria as checkboxes
- An optional **Files affected** list per task, with the new or changed code
- A **Notes** section for decisions and scope

## Example

- [examples/PLAN.md](examples/PLAN.md): a plan created with `one-plan-init` and worked through with the other skills.
- [Live review page](https://vguleaev.github.io/one-plan-skills/examples/PLAN.html): the `PLAN.html` that `one-plan-review` builds from it.

## Keep progress up to date

`one-plan-init` offers to add a short rules snippet to your `AGENTS.md` or `CLAUDE.md`, so the agent ticks criteria and marks tasks done even when you don't call a skill. You can also paste [the snippet](skills/one-plan-init/assets/agent-rules-snippet.md) yourself. This is optional, because every `PLAN.md` already carries its own Agent Instructions.

## Like it?

If one-plan helps you, give the repo a ⭐ on [GitHub](https://github.com/vguleaev/one-plan-skills). It helps other people find it.

## License

MIT
