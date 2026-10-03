---
name: one-plan-init
description: Create a PLAN.md plan in the project root for a given feature, with T-<number> tasks, acceptance criteria and a progress tracker. Use only when the user explicitly asks to plan a feature or initialise a PLAN.md.
disable-model-invocation: true
license: MIT
metadata:
  author: Vladislav Guleaev
  version: "1.0"
---

# one-plan-init

**For the given feature, create a `PLAN.md` file in the root of the project.**

## PLAN.md file Rules

- Generate as many tasks as you need to complete the feature.
- Each task must have a unique task ID.
- Task ID must be in the format `T-NNN`: the prefix `T-` and a number zero-padded to three digits, starting at `T-001` (`T-001`, `T-002`, ... `T-010`, ... `T-100`). Never use unpadded IDs like `T-1`.
- You must use the following statuses: `✅ DONE`, `🔲 TODO`.
- Each task must have name, description and acceptance criteria.
- A task's `{{TASK_DESCRIPTION}}` may include fenced code blocks (e.g. ` ```javascript ... ``` `) to illustrate the task, using whatever language fits. Keep each code block to at most 20-30 lines.
- When a task creates, changes or deletes specific files, add a `**Files affected:**` section after the Acceptance Criteria (see "Files affected" below). Include it only for tasks where seeing the code helps (scaffolding, non-trivial logic, config, API contracts); skip it for pure research, verification or docs tasks.
- Code must follow the "Code blocks and Files affected format" below exactly, because `PLAN.html` is built from `PLAN.md` by a parser.
- Add helpful notes which are common for all tasks at the end of the file.
- After the Notes, always end the file with an `## Agent Instructions` section, copied exactly from the template. It tells any agent that opens `PLAN.md` how to keep progress up to date, even when no rules file or `AGENTS.md` mentions it. The HTML review page ignores this section.

## Code blocks and Files affected format

Read [references/plan-format.md](references/plan-format.md) before adding any code or `**Files affected:**` section to a task. `PLAN.html` is built from `PLAN.md` by a parser, and breaking that format makes files silently disappear from the page.

**YOU MUST USE THE FOLLOWING TEMPLATE:**

```markdown
# PLAN: {{FEATURE_NAME}}

{{FEATURE_DESCRIPTION}}

## Progress Tracker

| Ticket | Description     | Status       |
| ------ | --------------- | ------------ |
| T-001   | {{TASK_1_NAME}} | {{STATUS_1}} |
| T-002   | {{TASK_2_NAME}} | {{STATUS_2}} |

## Tasks

#### T-001: {{TASK_1_NAME}}

**Description:**  
{{TASK_1_DESCRIPTION}}

**Acceptance Criteria:**

- [ ] {{ACCEPTANCE_CRITERIA_1}}
- [ ] {{ACCEPTANCE_CRITERIA_2}}
- [ ] {{ACCEPTANCE_CRITERIA_3}}
- [ ] {{ACCEPTANCE_CRITERIA_4}}

{{FILES_AFFECTED_SECTION_IF_NEEDED}}

---

#### T-002: {{TASK_2_NAME}}

**Description:**  
{{TASK_2_DESCRIPTION}}

**Acceptance Criteria:**

- [ ] {{ACCEPTANCE_CRITERIA_1}}
- [ ] {{ACCEPTANCE_CRITERIA_2}}
- [ ] {{ACCEPTANCE_CRITERIA_3}}

---

## Notes

- {{NOTE_1}}
- {{NOTE_2}}
- {{NOTE_3}}

## Agent Instructions

- Keep this file up to date as you work: when a task is completed, set its status to `✅ DONE` in the Progress Tracker and tick (`[x]`) every acceptance criterion that is met.
- Only mark a task `✅ DONE` when all of its acceptance criteria are met. Otherwise leave it `🔲 TODO` and tick only the criteria that are actually done.
- If a task has a "Files affected" section, make it match the code that was actually written.
- Never edit `PLAN.html`; it is generated from this file.
```

## Find below complete example of a PLAN.md file:

````markdown
# PLAN: Expenses Tracker Backend

Implement insertion of a new expense into the database for our expenses tracker.

## Progress Tracker

| Ticket | Description            | Status  |
| ------ | ---------------------- | ------- |
| T-001   | CDK Backend Stack      | ✅ DONE |
| T-002   | Deploy Lambda Handlers | ✅ DONE |
| T-003   | Custom Domain for API  | ✅ DONE |
| T-004   | API Gateway Auth       | 🔲 TODO |

## Tasks

#### T-001: Create CDK Backend Stack for Lambda + DynamoDB

**Description:**  
Create a new CDK stack (`backend-stack.ts`) that provisions:

- DynamoDB table for expenses with `id` as partition key and `userId-index` GSI
- Lambda functions for expense CRUD operations
- API Gateway REST API with proper CORS configuration
- IAM roles and permissions for Lambda to access DynamoDB

**Acceptance Criteria:**

- [x] DynamoDB table created with proper indexes
- [x] Lambda functions deployed for list/create expenses
- [x] API Gateway configured with routes
- [x] Stack outputs API URL

---

#### T-002: Deploy Expense Lambda Handlers

**Description:**  
Bundle and deploy existing Lambda handlers (`create.ts`, `list.ts`) to AWS via CDK. Ensure environment variables are properly configured, e.g.:

```typescript
const createExpenseFn = new NodejsFunction(this, "CreateExpenseFn", {
  entry: "src/handlers/expenses/create.ts",
  handler: "handler",
  environment: {
    EXPENSES_TABLE_NAME: expensesTable.tableName,
  },
});

expensesTable.grantWriteData(createExpenseFn);
```

**Acceptance Criteria:**

- [x] Create expense Lambda deployed
- [x] List expenses Lambda deployed
- [x] Environment variables set (EXPENSES_TABLE_NAME)
- [x] Handlers return proper responses

**Files affected:**

`backend/src/stacks/backend-stack.ts` — 🟡 MODIFIED

```diff
+const createExpenseFn = new NodejsFunction(this, "CreateExpenseFn", {
+  entry: "src/handlers/expenses/create.ts",
+  handler: "handler",
+  environment: { EXPENSES_TABLE_NAME: expensesTable.tableName },
+});
+expensesTable.grantWriteData(createExpenseFn);
```

---

#### T-003: Add Custom Domain for API Gateway

**Description:**  
Configure custom domain `api.expenses.example.com` for API Gateway. Reuse existing certificate if it supports wildcards, or update certificate to include the API subdomain.

**Acceptance Criteria:**

- [x] Check if existing certificate supports `*.expenses.example.com` or `api.expenses.example.com`
- [x] If not, request new/updated certificate with wildcard support
- [x] Add custom domain to API Gateway in CDK
- [x] Created DNS record for `api.expenses.example.com`
- [x] API accessible via `https://api.expenses.example.com`

---

#### T-004: Configure API Gateway with Clerk Auth Integration

**Description:**  
Set up API Gateway to validate Clerk JWT tokens. Configure Lambda authorizer or pass user ID from Clerk session to backend.

**Acceptance Criteria:**

- [ ] API Gateway validates auth headers
- [ ] User ID extracted from Clerk token
- [ ] Unauthorized requests return 401

---

## Notes

- Backend handlers already exist in `/backend/src/handlers/expenses/`
- Auth utility exists in `/backend/src/lib/auth.ts`
- Frontend uses Clerk for authentication
- DynamoDB requires `userId-index` GSI for listing user's expenses

## Agent Instructions

- Keep this file up to date as you work: when a task is completed, set its status to `✅ DONE` in the Progress Tracker and tick (`[x]`) every acceptance criterion that is met.
- Only mark a task `✅ DONE` when all of its acceptance criteria are met. Otherwise leave it `🔲 TODO` and tick only the criteria that are actually done.
- If a task has a "Files affected" section, make it match the code that was actually written.
- Never edit `PLAN.html`; it is generated from this file.
````

**NOW, CREATE A PLAN.md FILE FOR THE GIVEN FEATURE:**

## After creating the file

Once `PLAN.md` is created, let the user know they can also review it visually: mention that the `one-plan-review` skill will build a nice HTML review page from this plan and open it in the browser, where they can leave per-task approve/request-changes feedback instead of editing the Markdown by hand. Keep this optional and low-key — the plain `PLAN.md` workflow works fine on its own.

## Optional: agent rules snippet

On the first run in a project, offer (do not do it silently) to add [assets/agent-rules-snippet.md](assets/agent-rules-snippet.md) to the project's `AGENTS.md` (or `CLAUDE.md` if the project uses that instead). Only write it if the user agrees. The snippet is wrapped in `<!-- one-plan:start -->` / `<!-- one-plan:end -->` markers: if both markers are already in the file, replace what is between them instead of adding a second copy. This is optional, because the `## Agent Instructions` section in `PLAN.md` already covers the essentials.
