# Rk-source

> Full-stack web application — Express API + React (Vite) frontend.

A live, growing document. Decisions, setup steps, and known issues are tracked here as the project evolves.

---

## Status

Early scaffold. The API boots and the frontend builds, but no feature logic has been written yet.

| Part | State |
| --- | --- |
| Backend API | Runs. CORS enabled, Mongo connected, `GET /` and `GET /api/health`. |
| Frontend | Builds. `Home` page calls the API and shows its status. |
| Auth | Dependencies installed, **not yet wired**. |
| Tailwind | Plugin installed, **stylesheet not yet imported**. |

---

## Stack

**Backend** — Express 5 (ESM) on Node.js

| Package | Purpose | State |
| --- | --- | --- |
| `express` | HTTP server and routing | in use |
| `dotenv` | Loads `.env` | in use |
| `nodemon` | Dev auto-restart | dev only |
| `backend` | `cors` | Cross-origin requests | in use |
| `bcryptjs` | Password hashing | installed, unused |
| `jsonwebtoken` | JWT auth tokens | installed, unused |
| `mongoose` | MongoDB ODM | in use |

**Frontend** — React 19 + Vite 8

| Package | Purpose |
| --- | --- |
| `react`, `react-dom` | UI runtime |
| `react-router-dom` | Client-side routing |
| `axios` | HTTP client |
| `@tailwindcss/vite`, `tailwindcss` | Styling (v4, CSS-first) |
| `react-hot-toast` | Toast notifications |
| `lucide-react`, `react-icons` | Icon sets |
| `eslint` + plugins | Linting |

---

## Repository layout

```
.
├── backend/            # Express API — MVC
│   └── src/
│       ├── config/
│       │   ├── index.js            # env access, single config object
│       │   └── db.js               # Mongoose connection and state helpers
│       ├── controllers/
│       │   └── health.controller.js
│       ├── middlewares/
│       │   └── error-handler.js    # 404 + central error handler
│       ├── models/
│       │   └── user.model.js       # Mongoose schema
│       ├── routes/
│       │   ├── index.js            # mounts feature routers
│       │   └── health.routes.js
│       ├── utils/
│       │   └── api-error.js        # ApiError, for expected failures
│       ├── app.js                  # middleware wiring
│       └── server.js               # entry point, connects DB then listens
├── frontend/           # Vite + React client
│   └── src/
│       ├── lib/
│       │   └── api.js          # axios instance
│       ├── main.jsx            # React root, mounts <App />
│       ├── App.jsx             # Route table
│       ├── pages/              # Route-level components
│       ├── components/         # Shared components
│       └── index.css           # Global styles
└── opencode.json       # opencode project config
```

### MVC layout

| Layer | Location | Responsibility |
| --- | --- | --- |
| Model | `src/models/` | Mongoose schemas and database access |
| View | served by `frontend/` | The React client is the view layer |
| Controller | `src/controllers/` | Request handling and response shaping |
| Routes | `src/routes/` | URL to controller mapping |
| Middleware | `src/middlewares/` | Cross-cutting concerns: errors, auth, validation |
| Config | `src/config/` | Database connection and environment access |
| Utils | `src/utils/` | Small shared building blocks |

The React client is the view layer, so there is no server-side template folder.

### Conventions

- **One resource per router.** `routes/index.js` mounts feature routers and nothing else. A new resource gets `src/routes/<name>.routes.js` plus a matching `src/controllers/<name>.controller.js`.
- **No logic in route files.** Every route handler is a named controller function. Even `GET /` goes through `health.controller.js`, so the pattern to copy is always visible.
- **Dashed, dotted filenames.** `error-handler.js`, `user.model.js`, `health.routes.js`. A dot marks the layer; a dash separates words.
- **`config/index.js`, not `config.js`.** A `config.js` file sitting next to a `config/` folder is ambiguous to resolve. Environment access lives in `config/index.js`; the database connection lives in `config/db.js`.
- **Database state helpers stay in `config/db.js`.** Controllers ask `dbState()` and `dbReady()` rather than reaching for `mongoose.connection.readyState`, so the controller layer does not touch the driver.
- **`ApiError` for expected failures.** Throw `new ApiError(404, "...")` and let the central error handler shape the response. Only unexpected errors are logged with a stack.

---

## Getting started

Node.js `^20.19.0` or `>=22.12.0` required — that is the floor Vite 8 sets. Express 5 alone would accept Node 18. Clone and install both workspaces:

```bash
git clone git@github-personal:Rk85783/rk-source.git
cd rk-source
```

**Backend** — <http://localhost:4000>

```bash
cd backend
npm install
npm run dev      # nodemon, restarts on change
```

Verify:

```bash
curl http://localhost:4000     # -> API Working...
```

**Frontend** — <http://localhost:5173>

```bash
cd frontend
npm install
npm run dev
```

### Scripts

| Location | Command | Does |
| --- | --- | --- |
| `backend` | `npm run dev` | Start with nodemon (watch) |
| `backend` | `npm start` | Start with plain node |
| `backend` | `npm run lint` | ESLint over the backend |
| `backend` | `npm run format` | Rewrite files with Prettier |
| `backend` | `npm run format:check` | Verify formatting, no writes |
| `frontend` | `npm run dev` | Vite dev server with HMR |
| `frontend` | `npm run build` | Production build to `dist/` |
| `frontend` | `npm run preview` | Serve the built output |
| `frontend` | `npm run lint` | ESLint over the frontend |
| `frontend` | `npm run format` | Rewrite files with Prettier |
| `frontend` | `npm run format:check` | Verify formatting, no writes |

---

## Linting and formatting

ESLint and Prettier are set up **separately in each workspace**, on purpose.

- **ESLint is per-workspace** because the rules genuinely differ. The frontend needs React hooks, JSX and browser globals; the backend needs Node globals. Flat config resolves plugins relative to the config file, so a single root config would force every ESLint dependency up to the root.
- **Prettier is also per-workspace here**, to keep each side self-contained. The rule set is intentionally identical in both, so formatting stays consistent across the repo.

Both use flat config (`eslint.config.js`).

| File | Purpose |
| --- | --- |
| `frontend/eslint.config.js` | JS + JSX, React hooks, react-refresh, Prettier compat |
| `backend/eslint.config.js` | Node, ESM (`sourceType: module`), Prettier compat |
| `frontend/.prettierrc` / `backend/.prettierrc` | Identical formatting rules |
| `frontend/.prettierignore` / `backend/.prettierignore` | Skips `node_modules`, `dist`, lockfiles |

### Formatting rules

Set identically in both workspaces:

| Rule | Value |
| --- | --- |
| `semi` | `true` — semicolons |
| `singleQuote` | `false` — double quotes |
| `tabWidth` | `2` |
| `useTabs` | `false` — spaces, not tabs |
| `printWidth` | `80` |
| `trailingComma` | `all` |
| `arrowParens` | `always` |
| `endOfLine` | `lf` |

> Prettier uses either tabs or spaces, not both. Spaces at width 2 was chosen to match the existing code.

`eslint-config-prettier` is included in both ESLint configs. It switches off ESLint's stylistic rules so the two tools do not fight over formatting. ESLint reports problems, Prettier fixes them.

### Versions

| Tool | Version |
| --- | --- |
| `eslint` | 10 (both workspaces) |
| `prettier` | 3 (both workspaces) |
| `eslint-config-prettier` | latest, both workspaces |

### Possible next step

`prettier-plugin-tailwindcss` would sort Tailwind classes automatically. Not installed yet — the Tailwind stylesheet is not wired up either (see Branding below).

---

## Configuration

Both workspaces read environment variables. Each has a `.env` (gitignored, local only) and a `.env.example` (committed, shows every variable with its default).

Copy the example to get started:

```bash
cd backend  && cp .env.example .env
cd frontend && cp .env.example .env
```

### Backend — `backend/.env`

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `4000` | Port the API listens on |
| `NODE_ENV` | `development` | `development` or `production` |
| `CLIENT_URL` | `http://localhost:5173,http://127.0.0.1:5173` | Comma-separated origins allowed by CORS |
| `MONGO_URI` | `mongodb://127.0.0.1:27017/rk-source` | MongoDB connection string |

Read once in `backend/src/config/index.js` and exported as a single `config` object, so environment access is not scattered across files.

### Frontend — `frontend/.env`

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_API_URL` | `http://localhost:4000` | Base URL of the Express API |

> Vite only exposes variables prefixed with `VITE_` to client code. Anything else in `frontend/.env` stays server-side. Never put a secret in a `VITE_` variable — it ends up in the built bundle.

---

## CORS and the API client

The backend allows only the origins listed in `CLIENT_URL`, via the `cors` package in `backend/src/app.js`. Requests from any other origin get no `Access-Control-Allow-Origin` header and the browser blocks them.

`express.json()` is also mounted, so JSON request bodies are parsed.

The frontend talks to the API through a single pre-configured axios instance at `frontend/src/lib/api.js`:

```js
import { getHealth } from "../lib/api";

const res = await getHealth();
```

There is one place that knows the API URL. Add new endpoints as named functions there rather than calling `axios` directly in components.

### Available endpoints

| Method | Path | Returns |
| --- | --- | --- |
| `GET` | `/` | Plain text `API Working...` |
| `GET` | `/api/health` | `{ status, env, database, timestamp }` |

`GET /api/health` is what the `Home` page calls, so opening the app confirms the whole chain — env var, axios, CORS, backend, database — in one shot.

---

## Database

MongoDB via Mongoose 8. `MONGO_URI` in `backend/.env` points at a local instance.

`backend/src/config/db.js` owns the connection and logs every state change. `server.js` connects before it starts listening.

**Startup behaviour.** If Mongo is unreachable the API still starts in `development`, so the frontend and linting keep working, and `/api/health` reports `database.ready: false`. In `production` the process refuses to start without a database, because serving requests that cannot reach the database is worse than not serving at all.

### Models

`backend/src/models/user.model.js` exists to support the upcoming auth work. It is not wired to any route yet.

| Field | Type | Rules |
| --- | --- | --- |
| `name` | String | required, trimmed |
| `email` | String | required, unique, lowercased, trimmed |
| `password` | String | required, holds a bcrypt hash — never plaintext |

`timestamps: true`, so `createdAt` and `updatedAt` are maintained automatically.

Unique and required constraints were verified against a live database: a duplicate email is rejected with code `11000`, and a missing required field raises `ValidationError`. Both are translated into clean JSON responses by the central error handler (`409` and `400`).

---

## Dev servers

Use the helper script rather than hand-written `nohup` one-liners:

```bash
bash .opencode/skills/dev-server/devserver.sh status
bash .opencode/skills/dev-server/devserver.sh start    backend   # or: frontend | all
bash .opencode/skills/dev-server/devserver.sh stop     backend   # or: frontend | all
bash .opencode/skills/dev-server/devserver.sh restart  all
```

Logs are written to `.devlogs/backend.log` and `.devlogs/frontend.log` (gitignored).

| Service | Port |
| --- | --- |
| Backend API | <http://localhost:4000> |
| Frontend dev server | <http://localhost:5173> |

**Why the script exists.** On Windows git-bash, `$!` after backgrounding a process does not report the real node PID — it returned `1586` while the process actually listening on the port was `17140`. Killing by `$!` therefore leaves the server alive and the port held. The script always resolves PIDs from the port, and prints the resulting state after every action so nothing is left running by accident.

A stale server is not a hypothetical: one survived an earlier step and kept answering requests on port 4000 while a freshly started server reported a clean boot, which made a route that existed on disk look like it returned `Cannot GET`.

---

## Notes and decisions

### Naming

The project is **Rk-source** (`rk-source`). The GitHub repository, the npm
packages, the MongoDB database, and this document all use the same name.

> The project was briefly called "Rk-Axis" in this file and in the MongoDB URI.
> Both are now `rk-source`.

### Branding — not started yet

Deliberately deferred; no UI work done. Pick up from here:

- [ ] `<title>frontend</title>` → Rk-source (`frontend/index.html:7`)
- [ ] Package names `frontend` / `backend` → branded (`frontend/package.json:2`, `backend/package.json:2`)
- [ ] `favicon.svg` is still the Vite logo — replace with an Rk-source mark
- [ ] Import Tailwind in `frontend/src/index.css` (currently empty, so Tailwind classes do nothing)
- [ ] Decide visual direction — not chosen yet

### Fixed

- `frontend/src/App.jsx` imported `Home` from `lucide-react` instead of `./pages/Home`, rendering an icon instead of the page.
- `backend/src/server.js` used an extensionless ESM import (`"./app"`), crashing the server with `ERR_MODULE_NOT_FOUND`.
- `frontend/src/main.jsx` imported `BrowserRouter` from `react`, which does not export it. Fixed to `react-router-dom`. This one passed both `npm run build` and `npm run lint` — `react` is CommonJS, so the bad named import is not caught statically and only failed in the browser. Verified rendering in a real browser afterwards.
- Removed unused `React` imports in `Home.jsx` and `Navbar.jsx` that failed ESLint.
- Reformatted both workspaces to the Prettier rules above. Frontend previously had no semicolons and single quotes; backend already matched.

---

## Roadmap

Rough order of work, not a commitment:

1. Wire Tailwind into `index.css`
2. CORS setup for the `/api` boundary
3. Auth — register/login with `bcryptjs` + `jsonwebtoken`
4. Feature work on `Home` and routing
5. Branding pass (see above)
