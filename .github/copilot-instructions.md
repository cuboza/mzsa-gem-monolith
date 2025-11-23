# MZSA GEM – Copilot Instructions

## Architecture Snapshot
- Monorepo hosts three active surfaces: `frontend/` (React + Vite), `backend/` (Express + Sequelize + SQLite), and `scraper/` (Python) with shared docs under `docs/`—changes usually touch multiple layers.
- Frontend bootstraps through `src/main.tsx`, where `db.initializeData` hydrates LocalStorage before React renders; this guarantees catalog parity with `src/data/**/*`.
- Admin UI (`src/admin`) is embedded but routed under `/admin` and relies on the same data provider as the public app, so mutations instantly reflect across both experiences.
- Backend exposes REST resources at `http://localhost:3001/{trailers,accessories,orders,customers,settings}` and persists to `backend/database.sqlite` populated via `db.json` seeds.

## Run & Verify Workflows
- Frontend: `cd frontend && npm install && npm run dev` (Vite on :5173). Build with `npm run build`; it type-checks via `tsc -b` first.
- Backend: `cd backend && npm install && npm run seed && npm start` to recreate SQLite then serve Express on :3001.
- Scraper: `cd scraper && pip install -r requirements.txt && python scraper.py`; results land in `output/` per trailer slug.
- Quick sanity checks: `node check_db.js` to inspect SQLite counts, and use browser DevTools to confirm `localStorage` keys (`onr_*`) mirror data edits.

## Data Lifecycle & Sync
- Golden source for catalog/accessory mocks lives in `frontend/src/data/{trailers,accessories,defaultSettings,orders}.ts`; `db.initializeData` overwrites LocalStorage each reload, so edit these files instead of poking storage directly.
- To propagate scraped data end-to-end: run `scripts/transform_scraper_to_db.cjs` → refresh `backend/db.json` + copy images into `frontend/public/images/**` → `npm run seed` in backend to rebuild SQLite → switch `DATA_SOURCE` in `src/services/api/index.ts` to `'rest'` when you want the app to hit Express.
- `generate_catalog.py` is an alternate exporter that rewrites the same TypeScript data files directly from `output/`; it also cleans public image folders, so commit regenerated assets deliberately.
- Warehouse metadata, compatibility tags, and specs flattening rules are encoded in the transformer script—extend those helpers (e.g., `parseDimensionsMM`, `inferAccessoryCategory`) instead of sprinkling ad-hoc conversions elsewhere.

## Frontend Conventions
- Shared types live in `src/types/index.ts`; keep them authoritative—React components, mock data, and admin forms all import from here, so schema drift shows up immediately during `tsc -b`.
- Data access goes exclusively through `db` (either `LocalStorageProvider` or `RestProvider`); if you add a new entity, extend `IDatabaseProvider`, both providers, and `src/admin/dataProvider.ts` before wiring UI.
- Catalog filters (`pages/Catalog.tsx`) mirror URL search params—preserve the parse/update helpers when adding criteria to keep deep-linking functional.
- Configurator (`pages/Configurator.tsx`) drives a multi-step wizard; it derives compatible trailers via memoized predicates on `trailer.compatibility` and `maxVehicle*` fields, so add new fit rules there instead of scattering logic.

## Admin & Auth specifics
- React Admin resources live under `src/admin/resources/**`; list/edit/create screens are thin wrappers around `db` calls, so server-side validations must be mirrored client-side.
- `authProvider` is LocalStorage-based with fixed credentials (`admin/admin123`, `manager/manager123`); adjust this before enforcing real backend auth to avoid locking yourself out.
- Settings are treated as a singleton: `dataProvider` wraps them in an array with `id: 'default'`; keep that shape if you introduce multi-tenant configs to avoid breaking React Admin expectations.

## Backend Patterns
- `backend/server.js` uses `createCrud` to register REST endpoints; augmenting models (e.g., adding `/settings`) usually means tweaking this helper rather than duplicating handlers.
- Trailer search implements natural-language heuristics (category keywords, length parsing) using Sequelize `Op` and custom `where` clauses—extend that block for smarter filters while keeping fallback `{ name/model LIKE %q% }` logic.
- Sequelize models in `backend/models/*.js` intentionally denormalize JSON fields (`features`, `gallery`, `compatibility`); prefer JSON columns for flexible specs rather than creating auxiliary tables.
- When seeding, `backend/seed.js` flattens legacy `specs` fields; update the mapping there whenever you introduce new scalar columns to keep `db.json` compatible.

## Tooling & References
- Domain reference docs live in `docs/ARCHITECTURE.md`, `DATA_MODELS.md`, and `USER_GUIDE.md`; link to them in PR descriptions whenever you change cross-cutting flows.
- `scripts/import_from_1c_stub.ts` is the placeholder for 1C CSV ingestion—respect its CLI contract (`npm run import:1c -- --file=... --output=...`) if you start the real implementation.
- Image assets reside in `frontend/public/images/{trailers,accessories}`; generator scripts wipe these folders, so keep originals under version control or stash backups before regenerating.
- When debugging data mismatches, compare `scraper/output/<segment>/<slug>/<slug>.json`, `backend/db.json`, and the LocalStorage payloads in that order to pinpoint which stage diverged.
