# Roadmap

What Y01 intends to do next, in order, and why. A roadmap item is an intention, not a specification: each one becomes a decision, a change or a release, and from then on its state lives there, not here. This file only points to it.

> **Draft.** This is the first version of the roadmap, written while its format is still being found. The format may change; ids are never reused and items are never deleted.

## Goal

1. **An agent anywhere.** A kernel that runs an AI agent inside any application, on any infrastructure, because it knows neither: everything it needs from the world reaches it from the host at instantiation.
2. **A pure core.** The kernel decides in pure functions over plain data; every effect (a model call, a tool, storage, time) happens at the shell, so a run can be tested without fakes of the world, persisted, paused and resumed.
3. **Extensible without forks.** What an agent can do grows through plugins, which add vocabulary to the kernel without doing I/O themselves.

The audiences, in order: developers who embed an agent in their own application, developers who write plugins, and people studying how to model agentic systems.

## Ways to use Y01

Y01 is meant to be used in three ways, and every item below is checked against all three:

1. **Library.** A host application installs the kernel, instantiates it with its handlers, plugins and configuration, and runs agents with it (RM03, RM05, RM10).
2. **Plugins.** A developer extends what agents can do (new capabilities, task kinds, hooks) through the plugin contract, without touching the kernel (RM04, RM06 to RM08).
3. **Reference.** A reader learns from the design itself: the decisions, the contracts and the tests are written to be read (every item).

## Principles

These guide every item below. They are recorded here until an item writes them down in the repository's docs.

- **Functional core, imperative shell.** The kernel is pure; the host provides the effects when it instantiates the kernel. How they enter (described as data, or injected) is RM01's decision.
- **The kernel knows no infrastructure and no application.** No network, database, clock, randomness, console or provider SDK inside the kernel, and no knowledge of what the host's business is.
- **State is data.** What a run holds is plain, serializable data; definitions and functions live apart from it, so a run can be stored and read back by the next version.
- **Plugins never do I/O.** A plugin declares the effects it may ask for; the host provides a handler for each one.
- **Errors are data.** Every failure is a value in a known hierarchy, returned, never thrown.
- **Privacy by construction.** What the kernel reports about a run (observations) carries ids, codes, counts and durations, never conversation content.
- **Few dependencies.** The kernel grows its own small functional toolkit instead of depending on large libraries.

## Now

### RM01. How effects enter the kernel

- **Outcome:** a written decision on how the kernel reaches the world, which shapes every item after it. The two candidates: effects as data (a pure transition returns the new state and the effects it asks for, and an interpreter runs them with the host's handlers, feeding each result back as a new fact), or a Reader (a capability is a function of the host's environment that returns a state transition, and each effect's result is recorded so a run can be replayed). The decision weighs pausing and resuming a run across processes, replaying it, writing capabilities and plugins by hand, and checking at compile time that the host provides every handler.
- **Becomes:** decision (docs).
- **Takes:** —
- **Depends on:** —
- **Tracked in:** —

### RM02. License and the public repository

- **Outcome:** Y01 has a license (Apache-2.0 or MIT), with its `LICENSE` file and the `license` field of `package.json`, and the repository `yagomarinho/y01` is public, starting from a clean history, with the repository settings of the pull request flow applied (`docs/process/pull-requests.md`, section 5).
- **Becomes:** decision, then docs.
- **Takes:** —
- **Depends on:** —
- **Tracked in:** —

## Next

### RM03. Kernel 0.1

- **Outcome:** the smallest kernel that runs an agent end to end with fake handlers: the agent definition (instructions, model, capabilities), the run as serializable data, the pure transition, the interpreter, the types of the handlers the host provides, the observations, the error hierarchy, and a test kit that any handler implementation runs to prove it meets its port.
- **Becomes:** release.
- **Release:** 0.1.
- **Takes:** —
- **Depends on:** RM01.
- **Tracked in:** —

### RM04. Plugin contract

- **Outcome:** a versioned contract that says what a plugin declares (capabilities, task kinds, hooks, the effects it may ask for) and how the kernel composes plugins: conflicts and missing handlers are refused at instantiation as data, the handlers a host must provide are checked by the type system, hooks around the same step run in a declared and tested order, and a plugin states which kernel versions it supports.
- **Becomes:** decision, then release.
- **Release:** 0.2.
- **Takes:** —
- **Depends on:** RM01, RM03.
- **Tracked in:** —

### RM05. First model adapter and an example

- **Outcome:** a handler package that connects the kernel to a real model provider, outside the kernel package, and a runnable command-line example of an agent in a conversation, proving the kernel runs with real effects. The repository becomes a pnpm workspace with this second package.
- **Becomes:** release.
- **Release:** 0.2.
- **Takes:** —
- **Depends on:** RM03.
- **Tracked in:** —

## Later

### RM06. Task tree plugin

- **Outcome:** agents run durable task trees: a definition as data, facts that advance a run, insert-only steps of its history, and versioned writes that refuse a stale run, as a plugin over the kernel.
- **Becomes:** release.
- **Takes:** —
- **Depends on:** RM04.
- **Tracked in:** —

### RM07. Confirmation and guardrail hooks

- **Outcome:** a plugin that stops a run before a capability with side effects until someone confirms it, and the first guardrail hooks (redaction, limits), proving the ordering rules of RM04.
- **Becomes:** release.
- **Takes:** —
- **Depends on:** RM04.
- **Tracked in:** —

### RM08. MCP plugin

- **Outcome:** agents use tools from MCP servers: the pure part (the tool's schema, the decision to call it, reading its result) is a plugin, and the transport is a handler the host provides.
- **Becomes:** release.
- **Takes:** —
- **Depends on:** RM04.
- **Tracked in:** —

### RM09. Durable store handler

- **Outcome:** a store handler on a relational database (Postgres first) that passes the test kit of RM03, so a host can persist runs and resume them in another process.
- **Becomes:** release.
- **Takes:** —
- **Depends on:** RM03, RM05 (the workspace).
- **Tracked in:** —

### RM10. Published packages

- **Outcome:** the packages are published to npm with their builds (JavaScript and type declarations), `exports` maps as their public API, semantic versions, a changelog and a release flow on top of the checks that already run on every pull request.
- **Becomes:** release, with infrastructure.
- **Takes:** —
- **Depends on:** RM02, RM03.
- **Tracked in:** —

## Done

None yet.

## Dropped

None yet.
