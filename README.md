# Still

A private personal workspace for tasks, projects, notes, daily rituals, planning, and focused time.

## Account and cloud sync

Sites dispatch owns ChatGPT authentication. The app reads the stable authenticated user ID on the server and stores one D1 workspace per account. Google, Apple, Microsoft, and email sign-in methods are handled by the ChatGPT account flow; this app does not implement separate provider OAuth clients.

The browser keeps an account-specific working copy. Existing browser data is offered to the first signed-in account. Updates use atomic revision comparisons; conflicting devices retain both copies until the user chooses. Export backups remain available. Timers stay local to each device; completed sessions are synced.

## Development

Use the Sites installation/build helpers. `npm run db:generate` produces schema migrations. Hosted migration application is managed by Sites publication.

Run `node tests/cloud-sync.test.mjs` for database, authorization, validation, and conflict checks against a real local D1 instance. Browser authentication callbacks require a hosted signed-in session and are not covered by this test.

## Limits

Cloud workspaces are capped at 4 MB per sync. Offline edits require available browser storage. Device conflicts use explicit whole-workspace selection rather than automatic per-field merging. Keep exports before choosing between conflicting copies.
