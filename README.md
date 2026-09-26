# Rk-source

> Full-stack web application — Express API + React (Vite) frontend.

A live, growing document. Decisions, setup steps, and known issues are tracked here as the project evolves.

---

## Status

Early in development. Auth and per-role profiles are working end to end against a
real database; the frontend has no auth screens yet.

| Part | State |
| --- | --- |
| Backend API | Runs. CORS, Mongo connected, health + auth + profile endpoints. |
| Auth | Live. Signup, login, JWT, five roles, seeded super admin. No rate limiting. |
| Profiles | Live. Four collections, one per role, strict role isolation. |
| Frontend | Builds. Tailwind active, `Home` shows API status. No auth UI. |
| Tailwind | Active. Imported in `index.css`, generating a real stylesheet. |

---

## Stack

**Backend** — Express 5 (ESM) on Node.js

| Package | Purpose | State |
| --- | --- | --- |
| `express` | HTTP server and routing | in use |
| `dotenv` | Loads `.env` | in use |
| `nodemon` | Dev auto-restart | dev only |
| `cors` | Cross-origin requests | in use |
| `bcryptjs` | Password hashing | in use |
| `jsonwebtoken` | JWT auth tokens | in use |
| `mongoose` | MongoDB ODM | in use |

**Frontend** — React 19 + Vite 8

| Package | Purpose |
| --- | --- |
| `react`, `react-dom` | UI runtime |
| `react-router-dom` | Client-side routing |
| `axios` | HTTP client |
| `tailwindcss` | Styling (v4, CSS-first) |
| `react-hot-toast` | Toast notifications |
| `lucide-react`, `react-icons` | Icon sets |
| `eslint` + plugins | Linting |
| `prettier` + `prettier-plugin-tailwindcss` | Formatting and class sorting |

---

## Permissions

A `super_admin` grants permissions to admins. An admin holds exactly what it was
granted, and nothing more.

| Permission | Allows |
| --- | --- |
| `carrier:list` | `GET /api/carriers` |
| `carrier:read` | `GET /api/carriers/:userId` |
| `shipper:list` | `GET /api/shippers` |
| `shipper:read` | `GET /api/shippers/:userId` |
| `driver:list` | `GET /api/drivers` |
| `driver:read` | `GET /api/drivers/:userId` |

Defined in `backend/src/config/permissions.js`, which also exports
`PERMISSION_GROUPS` for building a UI and `isValidPermission` for validation.

**A `super_admin` holds every permission implicitly.** Nothing is stored on the
user document for that role — `requirePermission` lets `super_admin` through
before it ever looks at the list. This means new permissions apply to a super
admin automatically, with no migration.

**A non-admin never passes a permission check**, even a permission string somehow
attached to it. Carrier, shipper, and driver tokens get `403` on all six
endpoints.

### Permission endpoints

All three are `super_admin` only.

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/auth/permissions` | Every permission, grouped |
| `GET` | `/api/auth/users/:userId/permissions` | What an admin currently holds |
| `PUT` | `/api/auth/users/:userId/permissions` | Replace an admin's permissions |

`PUT` replaces the whole list, so send the complete set each time. It rejects
unknown permission names with `400`, and rejects non-admin targets with `400` —
permissions are only meaningful on admins.

```bash
# grant an admin the ability to view carriers only
curl -X PUT http://localhost:4000/api/auth/users/<adminId>/permissions \
  -H "Authorization: Bearer <super admin token>" \
  -H 'Content-Type: application/json' \
  -d '{"permissions":["carrier:list","carrier:read"]}'
```

An admin cannot change its own permissions, or anyone else's — those routes are
`super_admin` only.

### List and detail responses

List endpoints support `page`, `limit` (max 100), and `search` (case-insensitive
match on name), and return pagination metadata:

```json
{
  "carriers": [
    {
      "id": "...", "name": "...", "email": "...", "role": "carrier",
      "createdAt": "...",
      "profile": { "firstName": "...", "lastName": "...", "profileImage": "..." }
    }
  ],
  "page": 1, "limit": 20, "total": 1, "pages": 1
}
```

`profile` is `null` when the user has not created one yet. Detail endpoints wrap
a single user in a single-key object, matching the list shape.

---

## Access model

| Role | How the account is created | What it can do |
| --- | --- | --- |
| `carrier` | Self signup | Own profile, add drivers |
| `shipper` | Self signup | Own profile |
| `driver` | Added by a carrier | Own profile |
| `admin` | Created by `super_admin` | Own profile, list users, plus whatever permissions it was granted |
| `super_admin` | `npm run seed:admin` only | Everything, create admins, grant permissions, change roles |

All five roles can log in.

**Self signup accepts only `carrier` and `shipper`.** Requesting `driver`,
`admin`, or `super_admin` returns `400`. Drivers are added by a carrier; admins
are created by a super admin; a super admin exists only if seeded by hand.

**`super_admin` cannot be granted through the API at all.** Both
`POST /api/auth/users/admins` and `PATCH /api/auth/users/:userId/role` reject it
with `403` and point at the seed script. The seed script also refuses to create a
second super admin, so there is exactly one.

---

## Auth

JWT-based authentication. Passwords are hashed with bcrypt and never stored or
returned in plaintext. Tokens are sent as `Authorization: Bearer <token>`.

### Roles

| Role | Level | How it is obtained |
| --- | --- | --- |
| `carrier` | 10 | Self signup |
| `shipper` | 10 | Self signup |
| `driver` | 10 | Added by a carrier |
| `admin` | 20 | Created by a `super_admin` |
| `super_admin` | 30 | Seed script only |

Levels live in `backend/src/config/roles.js` so role checks are never scattered
across files. `PUBLIC_ROLES` in that file is the single source of truth for what
signup accepts.

**Privilege escalation is blocked at signup.** `POST /api/auth/register` accepts
only `carrier` and `shipper`. Every other role returns `400`. Admin roles can
only be created by an authenticated `super_admin`, and `super_admin` itself can
never be granted over HTTP.

### Endpoints

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | Public | Create a `carrier` or `shipper` |
| `POST` | `/api/auth/login` | Public | Exchange credentials for a token |
| `GET` | `/api/auth/me` | Authenticated | Current user |
| `PATCH` | `/api/auth/me/password` | Authenticated | Change own password |
| `GET` | `/api/auth/users` | `admin` | List users, filterable by `role` |
| `GET` | `/api/auth/permissions` | `super_admin` | Every permission, grouped |
| `GET` | `/api/auth/users/:userId/permissions` | `super_admin` | An admin's permissions |
| `PUT` | `/api/auth/users/:userId/permissions` | `super_admin` | Replace an admin's permissions |
| `POST` | `/api/auth/users/admins` | `super_admin` | Create an admin account |
| `PATCH` | `/api/auth/users/:userId/role` | `super_admin` | Change a user's role |

### Requests and responses

```bash
# Sign up
curl -X POST http://localhost:4000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Asha","email":"asha@example.com","password":"password123","role":"shipper"}'

# Log in
curl -X POST http://localhost:4000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"asha@example.com","password":"password123"}'

# Use the token
curl http://localhost:4000/api/auth/me -H "Authorization: Bearer <token>"
```

Both `register` and `login` return:

```json
{
  "user": { "id": "...", "name": "...", "email": "...", "role": "shipper", "createdAt": "..." },
  "token": "<jwt>"
}
```

The `password` and `isActive` fields are `select: false` on the schema, so they
are excluded from queries unless a caller explicitly asks for them, and neither
is ever included in a response.

### Status codes

| Code | Meaning |
| --- | --- |
| `400` | Validation failed, or a role that cannot be self-claimed was requested |
| `401` | Missing, invalid, or expired token, or wrong credentials |
| `403` | Authenticated but not permitted, or account disabled |
| `409` | Email already registered |

Login returns the same `401` for an unknown email and a wrong password, so the
endpoint does not reveal which emails exist.

### Environment

| Variable | Default | Purpose |
| --- | --- | --- |
| `JWT_SECRET` | none | Signs tokens. **Required** — must be at least 32 characters |
| `JWT_EXPIRES_IN` | `7d` | Token lifetime |
| `BCRYPT_ROUNDS` | `12` | bcrypt cost factor |

`server.js` refuses to start in production when `JWT_SECRET` is missing or too
short, and only warns in development. Generate a secret with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### Middleware

`backend/src/middlewares/auth.middleware.js` provides `requireAuth` (validates
the token and loads the user), `authorize(...roles)`,
`authorizeAtLeast(minimum)`, and `requirePermission(...permissions)`. To protect a
route:

```js
// any authenticated user
router.get("/me", requireAuth, me);

// one specific role
router.post("/drivers", requireAuth, authorize("carrier"), addDriver);

// admin or above
router.get("/users", requireAuth, authorizeAtLeast("admin"), listUsers);

// a granted permission, or super_admin
router.get("/", requireAuth, requirePermission(PERMISSIONS.CARRIER_LIST), list);
```

---

## Profiles

Each role stores its profile in its own MongoDB collection, so role-specific
fields can be added later without touching the other roles.

| Collection | Role | Route prefix |
| --- | --- | --- |
| `ShipperProfile` | `shipper` | `/api/shippers` |
| `CarrierProfile` | `carrier` | `/api/carriers` |
| `DriverProfile` | `driver` | `/api/drivers` |
| `AdminProfile` | `admin` | `/api/admins` |

All four currently share the same fields, defined once in
`backend/src/models/profile.model.js`:

| Field | Type | Rules |
| --- | --- | --- |
| `user` | ObjectId → `User` | required, unique, indexed |
| `firstName` | String | required, trimmed, max 60 |
| `lastName` | String | required, trimmed, max 60 |
| `profileImage` | String | defaults to `""` |

To give one role extra fields, edit only that role's schema in
`profile.model.js` and add handlers to that role's controller.

### Endpoints

Every role has the same three, all authenticated:

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/<role>s/me` | Read own profile (`404` if none) |
| `POST` | `/api/<role>s/me` | Create own profile (`409` if it exists) |
| `PATCH` | `/api/<role>s/me` | Update own profile |

```bash
curl -X POST http://localhost:4000/api/shippers/me \
  -H "Authorization: Bearer <token>" \
  -H 'Content-Type: application/json' \
  -d '{"firstName":"Asha","lastName":"Verma","profileImage":"https://..."}'
```

Sending `firstName` and `lastName` to `POST /api/auth/register` creates the
matching profile in the same request, so a new user needs one call, not two.

### Carrier adds a driver

Drivers cannot self-register. A carrier creates them:

```bash
curl -X POST http://localhost:4000/api/carriers/drivers \
  -H "Authorization: Bearer <carrier token>" \
  -H 'Content-Type: application/json' \
  -d '{"name":"Dee Driver","email":"dee@example.com","password":"password123"}'
```

This creates the `driver` user and a matching `DriverProfile` in one request.
`firstName` and `lastName` are optional — they default to splitting `name`, so
`"Dee Driver"` becomes first `Dee`, last `Driver`. A `DriverProfile` is also
created, so the driver has a profile ready.

Only a `carrier` can call this. A `shipper` receives `403`.

There is deliberately **no "list my drivers" endpoint**. A carrier-to-driver
relationship is not modelled yet, so any such endpoint would show a carrier
every driver in the system. That needs a `carrier` reference on the driver
profile first.

### Role isolation

Each route checks that the caller's role matches the collection, strictly, with
no bypass for `super_admin`:

```
GET /api/admins/me  with a shipper token  ->  403
```

The collection is always resolved from the authenticated user's role, never from
request input, so a caller cannot choose which collection to write into.

### Seeding the first admin

Signup refuses to create `admin` and `super_admin`, so a fresh install has no
administrator until one is seeded:

```bash
cd backend
npm run seed:admin -- super_admin "Rk Root" root@example.com 'a-strong-password'
npm run seed:admin -- admin "Ops Admin" ops@example.com 'another-strong-password'
```

The script is idempotent, refuses passwords under 8 characters, refuses to create
a second `super_admin`, and never echoes the password. It is the only supported
way to create an admin or a super admin.

### Known gaps

- `super_admin` has no profile collection. `PROFILE_MODELS` in
  `profile.model.js` maps roles to collections, and `super_admin` is
  deliberately absent — decide whether it needs one.
- A carrier-to-driver relationship is not modelled, so a carrier cannot see
  their own drivers. Add a `carrier` reference to `DriverProfile` first.
- Changing a user's role leaves their old profile behind in the previous
  collection. There is no migration step yet.
- `User.name` and the profile's `firstName`/`lastName` overlap. Consider whether
  `User.name` should be derived from the profile instead of stored twice.
- `profileImage` is a plain string with no upload flow or validation yet.

### Not done yet

There is no rate limiting on the auth routes, so login and register are open to
brute-force attempts. Add `express-rate-limit` before this is exposed publicly.
Tokens are not revocable — there is no logout endpoint, because a stateless JWT
cannot be invalidated without a blocklist.

---

## Tailwind CSS

Tailwind v4, wired through the `@tailwindcss/vite` plugin. There is no
`tailwind.config.js` and no `content` array — v4 is CSS-first and detects the
files to scan on its own.

The whole setup is two things:

1. `frontend/vite.config.js` registers the plugin:

   ```js
   plugins: [react(), tailwindcss()],
   ```

2. `frontend/src/index.css` imports Tailwind:

   ```css
   @import "tailwindcss";
   ```

**Both are required.** The plugin without the import produces a build with a
`0.00 kB` stylesheet and no class does anything — which is exactly the state this
project was in. If Tailwind classes ever stop applying, check that the import in
`index.css` still exists before suspecting the classes.

### Confirming it works

A build that produces a real stylesheet is the quick check:

```bash
cd frontend && npm run build
# dist/assets/index-*.css   10.01 kB
```

A `0.00 kB` CSS file means Tailwind is not running. For a definitive check, load
the page and read the computed style — `text-3xl` should compute to `30px` and
`font-bold` to `700`.

### Customising the theme

Theme values are CSS variables inside a `@theme` block in `index.css`, not a JS
config. Add brand colours, fonts, and spacing there once the visual direction is
decided:

```css
@import "tailwindcss";

@theme {
  --color-brand-500: oklch(0.55 0.2 265);
  --font-display: "Inter", sans-serif;
}
```

Those become `bg-brand-500` and `font-display`.

### Class ordering

`prettier-plugin-tailwindcss` sorts classes into Tailwind's canonical order, so
utility classes stay in a predictable sequence. Registered in
`frontend/.prettierrc`.

---

## Repository layout

```
.
├── backend/            # Express API — MVC
│   └── src/
│       ├── config/
│       │   ├── index.js            # env access, single config object
│       │   ├── db.js               # Mongoose connection and state helpers
│       │   ├── permissions.js      # permission names and groups
│       │   └── roles.js            # role names, levels, permission helpers
│       ├── controllers/
│       │   ├── auth.controller.js
│       │   ├── admin.controller.js
│       │   ├── carrier.controller.js
│       │   ├── driver.controller.js
│       │   ├── shipper.controller.js
│       │   ├── health.controller.js
│       │   └── profile.factory.js   # shared profile behaviour
│       ├── middlewares/
│       │   ├── auth.middleware.js  # requireAuth, authorize, requirePermission
│       │   └── error-handler.js    # 404 + central error handler
│       ├── models/
│       │   ├── user.model.js       # Mongoose schema
│       │   └── profile.model.js    # four profile collections
│       ├── routes/
│       │   ├── index.js            # mounts feature routers
│       │   ├── admins.routes.js
│       │   ├── auth.routes.js
│       │   ├── carriers.routes.js
│       │   ├── drivers.routes.js
│       │   ├── health.routes.js
│       │   └── shippers.routes.js
│       ├── utils/
│       │   ├── api-error.js        # ApiError, for expected failures
│       │   ├── token.js            # JWT sign and verify
│       │   └── user.js             # validation, creation, serialisation
│       ├── app.js                  # middleware wiring
│       └── server.js               # entry point, connects DB then listens
├── backend/scripts/
│   └── seed-admin.mjs     # creates the first admin accounts
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

`prettier-plugin-tailwindcss` is installed in the frontend and sorts utility
classes into canonical order. See [Tailwind CSS](#tailwind-css).

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

`backend/src/models/user.model.js` backs the auth system.

| Field | Type | Rules |
| --- | --- | --- |
| `name` | String | required, 2–60 chars, trimmed |
| `email` | String | required, unique, lowercased, trimmed, format-checked |
| `password` | String | required, bcrypt hash, `select: false` |
| `role` | String | required, one of the five roles, defaults to `carrier` |
| `permissions` | [String] | enum-validated against `config/permissions.js`, defaults to `[]`. Only meaningful on `admin` |
| `isActive` | Boolean | defaults to `true`, `select: false` |

A `super_admin` has an empty `permissions` array by design — it bypasses
permission checks rather than storing every permission.

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
- [ ] Pick brand colours and fonts, then add a `@theme` block to `index.css`
- [ ] Decide visual direction — not chosen yet

### Fixed

- `frontend/src/App.jsx` imported `Home` from `lucide-react` instead of `./pages/Home`, rendering an icon instead of the page.
- `backend/src/server.js` used an extensionless ESM import (`"./app"`), crashing the server with `ERR_MODULE_NOT_FOUND`.
- `frontend/src/main.jsx` imported `BrowserRouter` from `react`, which does not export it. Fixed to `react-router-dom`. This one passed both `npm run build` and `npm run lint` — `react` is CommonJS, so the bad named import is not caught statically and only failed in the browser. Verified rendering in a real browser afterwards.
- Removed unused `React` imports in `Home.jsx` and `Navbar.jsx` that failed ESLint.
- Reformatted both workspaces to the Prettier rules above. Frontend previously had no semicolons and single quotes; backend already matched.

---

## Roadmap

Rough order of work, not a commitment. Done so far is struck through.

1. ~~Wire Tailwind into `index.css`~~
2. ~~CORS setup for the `/api` boundary~~
3. ~~Auth — register, login, JWT, roles~~
4. ~~Per-role profile collections~~
5. ~~Granular admin permissions~~
6. Model the carrier-to-driver relationship, so a carrier can list their drivers
7. Frontend auth — login and register screens, plus an admin permissions screen
8. Decide whether `super_admin` gets a profile collection
9. Rate limiting on the auth routes (`express-rate-limit`)
10. Token revocation, or accept that logout is client-side only
11. Branding pass (see above)
