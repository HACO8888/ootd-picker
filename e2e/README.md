# E2E tests

Playwright specs run against a production build (`playwright.config.ts` builds
then `next start`s on port 4599). Run with `pnpm test:e2e`.

## Current coverage (guest mode)

The suite exercises the anonymous/localStorage flows only: wizard, closet,
journal, insights, share. This is the SSG/guest path the project commits to
keeping green with zero regressions.

## Intentionally NOT covered yet (known gap)

The architecturally riskiest behaviors are **not** under test:

- Cloud sync: the debounced full-collection REPLACE push (`src/lib/store.ts`),
  the login merge (`src/lib/sync.ts` `mergeOnLogin`, union-by-id +
  last-write-wins), and soft-delete tombstones (`src/lib/server/sync-repo.ts`).
- Suspended-user 401 paths and the `/admin` authz surface (`src/proxy.ts`).

These all require an authenticated session (Google OAuth) and a real Postgres
database, so they need test infrastructure we don't have in CI yet:

1. A throwaway Postgres (e.g. a `services: postgres` container in CI) + run
   `pnpm db:migrate` against it.
2. A mocked auth provider or a pre-seeded JWT session cookie (Auth.js test
   helper / `next-auth` credentials shim) so specs can act as a logged-in user
   and as an admin.

Suggested specs to add once the above exists: logout→login merges local+server
without data loss; a deletion tombstone survives a round-trip and does not
resurrect; `/admin` and `/api/admin/*` redirect/403 for non-admins.
