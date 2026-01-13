# Plan Mode

## Context: what this plan is and when to use it

This plan describes a **read-only "planning" mode** for the agent: the agent can inspect the repo (read/list/run safe commands) but **cannot edit files**.

- **When you want this**: you want an implementation plan first (file list + steps), without any modifications happening automatically.
- **What it enables**:
  - safer exploration (no accidental edits)
  - structured output you can review before applying changes
- **How you'd use it in this repo**:
  - start the interactive UI and switch into plan mode to iterate on a plan until it looks right

This plan intentionally avoids implementation-sized code blocks. The source of truth should live in `src/` and be validated by `tests/`.

## How you'd run it (intended UX)

Plan mode is interactive-only:

- **Start UI**: `bun run start`
- **Enter plan mode**: type `/plan` or `/plan <your request>`
- **Iterate**: continue chatting to refine the plan (multi-turn, keeps context)
- **Exit plan mode**: type `/normal` to return to normal mode

Switching modes should clear conversation history to avoid mixing system prompts and tool availability between modes.

## Tool availability (what plan mode allows)

Plan mode should make it impossible (or at least very hard) for the model to mutate the repo.

Minimum allowed tools:

- [x] `read_file`
- [x] `list_files`
- [ ] `edit_file` (blocked)
- [ ] `run_command` (blocked — see rationale below)

### Why block `run_command` entirely

Prompt-only safety ("please only run read-only commands") is insufficient:

- The model can be jailbroken or confused into running destructive commands
- Allowlist enforcement is complex (need to parse shell syntax, handle pipes, etc.)
- The safest approach is to remove the capability entirely in plan mode

If you need command output in plan mode (e.g., `git status`), consider:

- Pre-running specific commands and injecting results into the system prompt
- Adding a separate `git_status` read-only tool
- Running plan mode with explicit user approval for each command (future feature)

## Concrete file/API targets

On `main`, the agent doesn't currently support plan mode. Add it by extending `AgentOptions`:

- **Modify**: `src/agent/types.ts`
  - add `AgentMode` type: `'normal' | 'plan'`
  - extend `AgentOptions` with:
    - `mode?: AgentMode`
    - `systemPrompt?: string`
    - `toolFilter?: (name: string) => boolean`
- **Modify**: `src/agent/agent.ts`
  - in `makeApiCallWithRetry`, use a stable system prompt per agent instance (via `this.getSystemPrompt()`)
  - filter tools based on `this.options.toolFilter` before passing to API
  - add a backstop: if the assistant requests a blocked tool in plan mode, do not execute it and discard that assistant output
- **Modify**: `src/components/App.tsx`
  - parse `/plan` and `/normal` commands
  - create an `Agent` configured for plan mode when appropriate
  - show a mode indicator in the UI (e.g., `[PLAN MODE]`)

This matches the existing architecture: Agent config is passed through the constructor; tools are filtered before being sent to the model.

## System prompt consistency consideration

**Potential issue**: If the system prompt changes mid-conversation, the new prompt applies to all messages in the conversation history, which were created with a different prompt. This can cause inconsistency.

**Why plan mode is safe**: Plan mode is safe when the system prompt and tool list are kept consistent for the duration of a conversation, and mode switches clear conversation history.

**Implementation approach**:

- Store the system prompt in `this.options.systemPrompt` (computed once in constructor or via helper)
- Use the same system prompt for all API calls in a conversation
- When switching between plan/normal, clear history and construct a new agent for the new mode

**Future consideration**:

- Preserve a copy of the last plan text so the user can reference it after switching modes without keeping full conversation history

## Where to start in this repo

- **Interactive UI**: `src/components/App.tsx`
- **Agent core**: `src/agent/agent.ts`, `src/agent/types.ts`
- **Existing tests to extend**: `tests/agent/agent.test.ts`, `tests/components/*`

---

## Phase 1: Tests (define behavior)

### Agent tool filtering

- [ ] **Blocks editing**: in plan mode, `edit_file` is not in the tools array sent to the API
- [ ] **Blocks commands**: in plan mode, `run_command` is not in the tools array sent to the API
- [ ] **Allows reads**: `read_file` continues to work normally
- [ ] **Allows listing**: `list_files` continues to work normally

### System prompt behavior

- [ ] **Plan prompt differs**: plan mode uses a plan-specific system prompt that makes "no edits" explicit
- [ ] **Includes working directory**: prompt includes the current working directory path for grounding
- [ ] **Custom prompt override**: when `systemPrompt` is provided in options, it overrides the default

### Interactive UI behavior

- [ ] **Enter plan mode**: typing `/plan` switches the app into plan mode
- [ ] **Exit plan mode**: typing `/normal` switches back to normal mode
- [ ] **History cleared on mode switch**: switching modes clears conversation history
- [ ] **Mode indicator**: the UI reflects current mode

### Suggested test cases (more specific)

- [ ] **Tools are filtered in plan mode**:
  - construct `new Agent(mockClient, { mode: 'plan' })`
  - call `agent.chat("...")`
  - assert `mockCreate.mock.calls[0][0].tools` does not include `edit_file` or `run_command`
  - assert `mockCreate.mock.calls[0][0].tools` includes `read_file` and `list_files`
- [ ] **Custom system prompt is used**:
  - construct agent with `systemPrompt: 'Custom prompt'`
  - call `agent.chat("...")`
  - assert `mockCreate.mock.calls[0][0].system` equals `'Custom prompt'`
- [ ] **Plan mode system prompt contains expected markers**:
  - construct plan agent via `createPlanAgent(mockClient)`
  - call `agent.chat("...")`
  - assert system prompt contains `PLAN MODE` and `do not edit`

### Test file mapping (exactly where to add things)

- **Update**: `tests/agent/agent.test.ts`
  - add test for tool filtering with `mode: 'plan'`
  - add test for custom `systemPrompt` override
- **Update/Add**: `tests/components/*`
  - add tests for `/plan` and `/normal` command handling and mode indicator

---

## Phase 2: Implementation (minimal)

### Files to add / modify (on `main`)

- [ ] **Modify**: `src/agent/types.ts` to include mode and prompt options
- [ ] **Modify**: `src/agent/agent.ts` to apply mode-specific tool filtering
- [ ] **Modify**: `src/components/App.tsx` to add interactive plan mode commands and mode indicator

## Implementation checklist (ordered)

- [ ] **1) Extend Agent options (`src/agent/types.ts`)**
  - Add `export type AgentMode = 'normal' | 'plan'`
  - Add to `AgentOptions`:
    - `mode?: AgentMode`
    - `systemPrompt?: string`
    - `toolFilter?: (name: string) => boolean`
  - Verify TypeScript passes existing tests unchanged

- [ ] **2) Use `systemPrompt` override in `src/agent/agent.ts`**
  - In constructor, store `systemPrompt: options?.systemPrompt` in `this.options` (default to `undefined`)
  - Add private method `getSystemPrompt(): string` that returns `this.options.systemPrompt ?? getSystemPrompt()` (the module-level helper)
  - In `makeApiCallWithRetry`, pass `system: this.getSystemPrompt()` (ensures consistent prompt across all calls)
  - Verify with a unit test that the mocked API call receives the custom system prompt

- [ ] **3) Implement tool filtering in `src/agent/agent.ts`**
  - Add helper: `getFilteredTools(): Tool[]`
    - if `this.options.toolFilter` exists, filter tools through it
    - otherwise return all tools
  - In `makeApiCallWithRetry`, use `tools: this.getFilteredTools()`
  - Verify with a test that a toolFilter excluding `edit_file` results in API call without it

- [ ] **4) Implement interactive plan mode in `src/components/App.tsx`**
  - Parse `/plan` and `/normal` commands in `handleSubmit`
  - On `/plan`, create a plan-mode agent instance and clear history
  - On `/normal`, create a normal-mode agent instance and clear history
  - Ensure plan mode sets `toolFilter` to block `edit_file` and `run_command`
  - Show a mode indicator in the UI

### Output shape

Plan mode output should include (enforced via system prompt):

- [ ] **Files to touch**: create/modify/delete list (paths + intent)
- [ ] **Ordered steps**: a sequence of actions, each tied to a file
- [ ] **Testing**: how to validate the change (commands + key test cases)
- [ ] **Risks**: edge cases / rollback notes

## Example plan output (short)

This is the level of specificity we want (structured, but not full code):

```
Title: Add plan mode

Files:
- src/components/App.tsx (modify): add interactive plan mode commands + mode indicator
- src/agent/agent.ts (modify): support tool filtering + blocked-tool backstop

Steps:
1) Enter plan mode via `/plan`
2) Iterate on the plan until it's acceptable
3) Exit plan mode via `/normal` to execute changes in normal mode (history cleared)

Testing:
- bun test
- verify edit_file is not available in plan mode

Risks:
- Mode switch clears history, so user must restate key intent when switching back to normal mode
```

---

## Phase 3+: Production hardening (optional)

- [ ] **Structured plan extraction**: enforce a plan block format and parse it for validation
- [ ] **Plan validation**: validate required fields and warn on missing details
- [ ] **JSON output**: optionally emit parsed plan JSON for automation via `--format json`
- [ ] **Interactive plan approval**: show plan, ask for confirmation, then execute in normal mode
- [ ] **Plan persistence across mode switches**: keep the last plan visible after switching to normal mode without preserving full conversation history

---

## Definition of done

- [ ] In plan mode, the agent cannot make filesystem changes through tools (`edit_file` and `run_command` are filtered out)
- [ ] The plan output clearly lists files + steps + testing notes (even if brief)
- [ ] Normal mode (`bun run start`) continues to work unchanged

---

## Step-by-step build recipe

### Step 0: Confirm baseline behavior on `main`

- `src/index.tsx` unconditionally renders the Ink UI
- `src/agent/agent.ts` always uses `tools` from `src/tools/index.ts` and `getSystemPrompt()` to build API calls

### Step 1: Add mode type to `src/agent/types.ts`

- Add `export type AgentMode = 'normal' | 'plan'`
- Extend `AgentOptions` with `mode?: AgentMode`, `systemPrompt?: string`, `toolFilter?: (name: string) => boolean`

Acceptance criteria:

- Existing code compiles with new fields omitted (defaults to normal behavior)

### Step 2: Make `Agent` use custom system prompt (`src/agent/agent.ts`)

Implementation:

- In constructor, add `systemPrompt: options?.systemPrompt` to `this.options` (default to `undefined`)
- Add private method `getSystemPrompt(): string` that returns `this.options.systemPrompt ?? getSystemPrompt()` (the module-level helper)
- In `makeApiCallWithRetry`, change line 118 to: `system: this.getSystemPrompt()` (ensures consistent prompt across all API calls in a conversation)

Acceptance criteria:

- When `systemPrompt` is provided, the API call uses it consistently across all calls
- When `systemPrompt` is omitted, behavior is unchanged
- The same system prompt is used for all API calls in a single conversation (no mid-conversation changes)

### Step 3: Define tool filtering

In `src/agent/agent.ts`:

- Add private method `getFilteredTools()`:
  - `const filter = this.options.toolFilter ?? (() => true)`
  - `return tools.filter(t => filter(t.name))`
- In `makeApiCallWithRetry`, change line 119 to: `tools: this.getFilteredTools()`

Acceptance criteria:

- When `toolFilter` excludes `edit_file`, the API call's tools array does not contain it
- When `toolFilter` is omitted, all tools are included

### Step 4: Add interactive plan mode in `src/components/App.tsx`

- Add `/plan` and `/normal` command handling
- Switch between plan/normal by clearing history and creating a new `Agent` configured for the mode
- Display a mode indicator

### Step 5: Update tests

#### `tests/agent/agent.test.ts`

- Add test that constructs `new Agent(mockClient, { toolFilter: (n) => n !== 'edit_file' })`
- Assert `mockCreate.mock.calls[0][0].tools` does not include `edit_file`
- Add test that sets `systemPrompt` and asserts the API call uses it

#### `tests/components/*`

- Add tests for `/plan` and `/normal` command handling and mode indicator
