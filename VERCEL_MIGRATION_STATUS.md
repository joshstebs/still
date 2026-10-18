# Vercel migration status

The complete original Still source was recovered from its Sites repository at commit `483154f550aee30fa8c9ab39da3879eaa7d7d06e` (published version 3) on October 17, 2026, and imported into the existing GitHub repository without rewriting its history.

The Vercel project is `stebs-co/still`. Automatic builds are temporarily skipped with the project setting `commandForIgnoringBuildStep: exit 0` because the current application is tied to Sites infrastructure.

Before deploying:

1. Replace Sites dispatcher authentication with a verified Vercel-compatible session implementation. Never trust caller-supplied `oai-authenticated-user-*` headers on Vercel.
2. Replace the `cloudflare:workers` D1 binding in `app/api/workspace/route.ts` and `db/index.ts` with a supported authenticated data service while retaining per-user isolation and atomic revision checks.
3. Replace the Vinext/Cloudflare build workflow with a Vercel-compatible build, and verify login, account isolation, persistence, offline edits, and conflict handling.
4. Remove the temporary ignored-build setting only after these requirements are met.

The existing private Sites deployment remains available. No user workspace data or secrets were copied as part of this source import.
