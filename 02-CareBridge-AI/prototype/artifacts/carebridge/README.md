# CareBridge

CareBridge is a synthetic patient-discharge portfolio prototype. It demonstrates exact-source retrieval, bounded rule-based Q&A, a tightly grounded Gemini explanation path, simulated clarification handoff/status, and optional teach-back for one fictional walker instruction.

## Safety boundary

- Fictional data only; not for clinical use.
- No real patient data, clinical system, clinician, message, approval, or resolution.
- The original instruction remains the authority.
- Gemini cannot change the plan or write teach-back feedback.
- A teach-back match is not proof of understanding, adherence, clearance, or readiness.

## Teach-back design

Teach-back is offered only after supported current-source mobility guidance for fictional patient `p1`. The visitor may skip, answer in up to 300 characters, retry once, or request a simulated clarification handoff.

Deterministic rules reject obvious contradiction, negation, optionality, early stopping, invented timing, treatment change, and injection. Other bounded language is classified by Gemini into standing, walking, clearance, and confidence fields. All displayed feedback is fixed server-authored text. Raw responses are not retained.

## Local commands

```bash
pnpm --filter @workspace/api-server run typecheck
pnpm --filter @workspace/carebridge run typecheck
PORT=4173 BASE_PATH=/carebridge pnpm --filter @workspace/carebridge run build
pnpm --filter @workspace/scripts exec tsx "$PWD/artifacts/api-server/tests/carebridge-teachback.test.ts"
pnpm --filter @workspace/scripts exec tsx "$PWD/artifacts/api-server/tests/carebridge-handoff.test.ts"
pnpm --filter @workspace/scripts exec node "$PWD/artifacts/carebridge/tests/browser-interactions.mjs"
```

The browser test expects Chromium remote debugging on port `9222`.

## Evidence

- 25/25 teach-back service checks
- 23/23 handoff/status checks
- 24/24 browser interaction checks
- Existing 11/11 rule-Q&A, 17/17 simulated grounding, and 7/7 diagnostic/privacy checks
- Five bounded live Gemini teach-back attempts with intended complete/incomplete/unclear/contradictory outcomes

See [PRD.md](./PRD.md), [ARCHITECTURE.md](./ARCHITECTURE.md), [EVALUATION.md](./EVALUATION.md), [ROADMAP.md](./ROADMAP.md), and [DEMO_SCRIPT.md](./DEMO_SCRIPT.md).