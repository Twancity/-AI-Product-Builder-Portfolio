# GitHub review package

## Suggested pull request title

`feat(carebridge): add bounded optional teach-back`

## Summary

- Adds generated GET/POST teach-back API contracts.
- Adds source/session-scoped teach-back state with no raw-response retention.
- Adds deterministic contradiction/injection/timing/treatment rules.
- Adds Gemini structured meaning classification for standing, walking, clearance, and confidence.
- Adds fixed server-authored feedback, one retry, provider-failure semantics, and explicit simulated handoff.
- Adds accessible React UI, reload recovery, stale-state invalidation, reviewer-only delivery controls, and roadmap updates.
- Expands synthetic service and browser regression suites.

## Reviewer focus

1. Confirm that Gemini cannot author teach-back feedback or alter source identity.
2. Confirm fixed unsafe patterns execute before provider calls.
3. Confirm completion requires all three source facts by meaning.
4. Confirm provider errors consume no comprehension attempt.
5. Confirm handoff is never automatic and supported-answer exclusion remains intact outside `teach_back_confusion`.
6. Confirm raw response text is absent from result, audit, and retained state.
7. Confirm patient/session/section/version and idempotency scopes cannot cross.

## Verification

```bash
pnpm --filter @workspace/api-server run typecheck
pnpm --filter @workspace/carebridge run typecheck
PORT=4173 BASE_PATH=/carebridge pnpm --filter @workspace/carebridge run build
pnpm --filter @workspace/scripts exec tsx "$PWD/artifacts/api-server/tests/carebridge-teachback.test.ts"
pnpm --filter @workspace/scripts exec tsx "$PWD/artifacts/api-server/tests/carebridge-handoff.test.ts"
pnpm --filter @workspace/scripts exec node "$PWD/artifacts/carebridge/tests/browser-interactions.mjs"
```

Recorded result: 25/25 teach-back, 23/23 handoff/status, and 24/24 browser checks. Existing Q&A, grounding, and diagnostic/privacy suites remain passing.

## Explicit non-actions

- No push or pull request was created.
- No deployment was created or changed.
- No model or billing configuration was changed.
- No real patient or clinical data was used.
- No real clinician, queue, message, or integration was contacted.