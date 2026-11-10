# Still

A private personal workspace for tasks, projects, notes, daily rituals, planning, and focused time.

## Account and cloud sync

Sites dispatch owns ChatGPT authentication. The app reads the stable authenticated user ID on the server and stores one D1 workspace per account. Google, Apple, Microsoft, and email sign-in methods are handled by the ChatGPT account flow; this app does not implement separate provider OAuth clients.

The identity headers are trusted only in the Sites environment. On Vercel the server fails closed unless `STILL_TRUST_SITES_AUTH=true` is explicitly set alongside a replacement authentication layer.

The browser keeps an account-specific working copy. Existing browser data is offered to the first signed-in account. Updates use atomic revision comparisons; conflicting devices retain both copies until the user chooses. Export backups remain available. Timers stay local to each device; completed sessions are synced.

## Offline behavior

A service worker caches the static workspace shell after the first successful sign-in. The last account marker and its local workspace let a cold offline load reopen the saved copy; edits are stored locally and sync when the connection returns. API responses are never cached. If another device changed the workspace while offline, the normal whole-workspace conflict dialog appears. The local copy assumes the device is trusted: signing out of ChatGPT does not erase browser storage.

## Recurring tasks

Any task can repeat daily, weekly, or monthly. Completing a recurring task keeps the completed entry and creates the next dated occurrence (month-end dates clamp to the last day of the month). General task search also matches category and project names; global search covers tasks, notes, projects, and daily rituals.

## AI

No AI provider is called. Notes and tasks are private and stay in the D1 workspace unless the user exports a backup. Adding AI would require an explicit consent flow and a cost/privacy boundary before any note content leaves the app.

## Development

Use the Sites installation/build helpers. `npm run db:generate` produces schema migrations. Hosted migration application is managed by Sites publication.

Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`. `npm test` covers recurring-task date math plus database, authorization, validation, and conflict checks against a real local D1 instance. GitHub Actions runs the full suite on Ubuntu. Browser authentication callbacks require a hosted signed-in session and are not covered by these tests.

### Android/Termux limitation
`workerd` has no Android/arm64 build, so `npm ci`, Miniflare/D1 tests, and the Vinext production build cannot run natively on Termux. Install JS packages with `npm ci --ignore-scripts` to run lint, typecheck, and pure unit tests; use Linux CI or a hosted environment for the D1 and build checks.

## Limits

Cloud workspaces are capped at 4 MB per sync. Offline edits require available browser storage. Device conflicts use explicit whole-workspace selection rather than automatic per-field merging. Keep exports before choosing between conflicting copies.
