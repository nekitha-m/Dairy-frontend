# Dairy — React Frontend

A React + TypeScript SPA (Create React App / `react-scripts`) for the Dairy Master module, talking to **DairyWebApp.Api** — a separate ASP.NET Core 8 Web API at `F:\source\dev\DairyWebApp.Api` (not the legacy MVC app in this repo).

## Stack

- Create React App (`react-scripts`) — `npm start` for dev, `npm run build` for production
- axios for HTTP
- SCSS Modules for styling (tokens in `src/styles/_variables.scss`)

## Backend

`DairyWebApp.Api` is a layered ASP.NET Core 8 project (DTO / Model / Repository / Service / Controllers) backed by a **live remote MySQL database** (see its `appsettings.json`). Its CORS policy already allows any origin with credentials, so the frontend calls it directly by absolute URL — no dev-proxy needed.

Run it:
```bash
cd "F:\source\dev\DairyWebApp.Api\DairyWebApp.Api\DairyWebApp.Api"
dotnet run --urls http://localhost:5054
```

The frontend's base URL is set in `.env.development`:
```
REACT_APP_API_BASE_URL=http://localhost:5054/api
```

**Because this hits a live remote database**, be deliberate about using Save/Delete on the Master screens while testing — those write to real data, not a local sandbox.

## Endpoints wired up

Each controller has its own action names rather than uniform REST verbs, and `Update` takes the id inside the request body instead of the URL — see `src/api/masterApi.ts`.

| Entity | List | Insert | Update | Delete |
|---|---|---|---|---|
| Route | `GET /api/Route/GetRoutes` | `POST /api/Route/InsertRoute` | `PUT /api/Route/UpdateRoute` | `DELETE /api/Route/Delete/{id}` |
| Society | `GET /api/Society/GetSoc` | `POST /api/Society/InsertSociety` | `PUT /api/Society/UpdateSociety` | `DELETE /api/Society/Delete/{id}` |
| Bmc | `GET /api/Bmc/GetBmc` | `POST /api/Bmc/InsertBmc` | `PUT /api/Bmc/UpdateBmc` | `DELETE /api/Bmc/Delete/{id}` |
| Destination | `GET /api/Destination/GetDestinationList` | `POST /api/Destination/InsertDestination` | `PUT /api/Destination/UpdateDestination` | `DELETE /api/Destination/Delete/{id}` |
| Tanker | `GET /api/Tanker/GetTankers` | `POST /api/Tanker/InsertTanker` | `PUT /api/Tanker/UpdateTanker` | `DELETE /api/Tanker/Delete/{id}` |

Every endpoint replies HTTP 200 with an envelope `{ statusCode, message, result, success }` regardless of outcome — `src/api/httpClient.ts`'s `unwrap()` helper reads `.success`/`.result` rather than trusting the HTTP status.

**Known backend issue:** `GET /api/Route/GetRoutes` currently 500s — the underlying `Routes` table doesn't exist in the connected database (`MySqlException: Table 'Dairy.Routes' doesn't exist`). That's a DB/backend-side gap, not something the frontend can fix.

## Auth — shelved for now

Per current instructions, Login/Register are **not** wired into routing — every screen is open. The code still exists (`src/features/auth`, `src/context/AuthContext.tsx`, `src/routes/ProtectedRoute.tsx`) for when auth comes back; `DairyWebApp.Api` has no account/login controller yet, so those files currently point at endpoints that don't exist on this backend.

## Running

```bash
npm install
npm start
```

Open `http://localhost:3000`. Home shows tiles for the five Master screens (Route, BMC, Society, Destination, Tanker) — Transaction/Reports aren't in the nav since this API doesn't expose them yet.

## Project structure

```
src/
  api/          axios client (httpClient.ts) + masterApi.ts (per-entity clients matching DairyWebApp.Api's actual routes)
  components/
    layout/     Navbar + page Layout
    common/     DataTable, EntryCard, FormField, Button — shared building blocks
  features/     one folder per screen area (home, routes, society, bmc, destination, tanker; auth is shelved)
  routes/       AppRoutes (no auth gating currently)
  styles/       SCSS tokens, mixins, base/reset
  types/        shared TS interfaces matching the API's camelCase JSON shapes
```
