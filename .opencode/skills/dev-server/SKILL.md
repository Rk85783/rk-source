---
name: dev-server
description: Use when starting, restarting, stopping, or checking the Rk-source backend or frontend dev server, or before/after any browser (Playwright) testing. Prevents hanging on background processes, orphaned servers holding ports, and stale responses from an old process. Triggers on "start the server", "run the backend", "npm run dev", "server not working", "port already in use", "restart backend", localhost:4000, localhost:5173.
---

# Dev server handling

Backgrounding a dev server from the bash tool is the single most common cause of
hanging and of debugging the wrong process. Follow these rules exactly.

## The three rules

1. **Check before starting.** Never assume a server is down. Run the status check
   first. If something is already on the port, kill it before starting a new one.
2. **Check after stopping.** Always confirm the port is free. Do not report a
   server as stopped without verifying.
3. **Never leave a server running at the end of a task** unless the user asked for
   it to stay up. A backgrounded server holding a port will silently answer the
   next round of requests, and the code you are debugging may not be the code
   running.

## Use one command, not many

**Default to `verify`.** It starts, probes, stops, and confirms the ports are
free — all inside a single call, so no server is ever left running and there is
nothing left hanging between steps.

```bash
bash .opencode/skills/dev-server/devserver.sh verify
```

Prefer this over starting a server and poking at it across several calls.

## Never run a bare `start`

**Do not run `devserver.sh start` on its own, and never chain it into a longer
command.** It backgrounds a process that stays attached to the calling shell, so
the tool call does not return and has to be interrupted by the user. This has
happened repeatedly.

`start` exists for the user to run in their own terminal. For agent use:

- Need to confirm a server works? → `verify`
- Need to hit an endpoint repeatedly? → `verify` once to confirm, then use a
  script that starts, curls, and stops inside a single bash call
- Need a server up for Playwright? → `verify` first, and if a genuinely
  long-lived server is unavoidable, say so and keep it to one call

Chaining is what breaks it. `npm run lint && devserver.sh start` hangs even
though the lint finished, because the whole call waits on the backgrounded
process.

## Do not start a server unless the task needs one

Most work needs no server at all. `npm run lint`, `npm run build`,
`npm run format`, `npm run format:check`, reading files, and editing code are all
verified without starting anything. Start a server only when the task genuinely
requires a live process — for example a browser test, or hitting a real endpoint.

Do not start a server "to be safe". It adds startup latency to every step and
creates a process that has to be cleaned up.

## If a server must stay up across calls

This is the only case where `start` is correct, and it is for browser testing
with the Playwright tools. When it happens, `stop all` in the same turn, right
after the test, and confirm with `status`.

```bash
bash .opencode/skills/dev-server/devserver.sh status
bash .opencode/skills/dev-server/devserver.sh start    backend   # or: frontend | all
bash .opencode/skills/dev-server/devserver.sh stop     backend   # or: frontend | all
bash .opencode/skills/dev-server/devserver.sh restart  all
```

## Keep tool calls short

Report the result and move on. A long chain of small verification calls reads as
being stuck, even when every one of them succeeds. Batch what can be batched, and
do not narrate each step.

## Never hand-write background one-liners

Do not write `nohup ... &` by hand. The script resolves PIDs by port and prints
the resulting state after every action. Logs land in `.devlogs/backend.log` and
`.devlogs/frontend.log`.

## Why `$!` must not be trusted

On Windows git-bash, `$!` after backgrounding does **not** report the real node
PID. Observed: `$!` returned `1586` while the process actually listening was
`17140`. Using `$!` to kill leaves the server alive and the port held.

Always resolve the PID from the port instead:

```bash
netstat -ano | grep ":4000 " | grep LISTENING | awk '{print $5}' | sort -u
```

## The stale-response trap

This has already happened once in this project. A server started during an earlier
step was still holding port 4000. A new server was started and reported a clean
boot, but every request was answered by the **old** process. The symptom was a
route that provably existed in the file on disk returning `Cannot GET`.

When a response contradicts the code you just read, suspect a stale process before
suspecting your own code. Restart the server, then retry.

## Before any browser test

CORS, client-side routing, and bad ESM named imports only fail in a real browser.
`npm run build` and `npm run lint` can both pass while the app is broken — a
CommonJS dependency with a bad named import is not caught statically.

So for any frontend behaviour worth trusting, verify in the browser:

1. `devserver.sh start all`
2. Drive the page with the Playwright tools.
3. Check `browser_console_messages` for errors, and read the rendered DOM.
4. `devserver.sh stop all` — then confirm with `status`.

## Ports

| Service | Port |
| --- | --- |
| Backend API | 4000 |
| Frontend dev server | 5173 |

## If a port is stuck

```bash
pid=$(netstat -ano | grep ":4000 " | grep LISTENING | awk '{print $5}' | sort -u)
taskkill //F //PID "$pid"
```

Repeat for 5173 if needed. The `devserver.sh stop all` command already does this.
