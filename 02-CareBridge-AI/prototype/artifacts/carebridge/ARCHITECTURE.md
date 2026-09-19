# CareBridge architecture

## System boundary

The React/Vite artifact calls an Express API through generated OpenAPI clients. The API owns all synthetic source lookup, eligibility checks, feedback text, bounded process state, and Gemini credentials.

## Source and explanation flow

1. The browser sends fictional patient/section identifiers and a bounded question.
2. The API selects the canonical synthetic source.
3. Deterministic eligibility and refusal rules run first.
4. For the narrow explanation path, Gemini may restate the exact instruction.
5. Server validators require all three walker facts and reject unsupported additions.
6. The UI renders model output separately from the exact source and labels its limited verification status.

## Teach-back flow

1. A supported current-source answer exposes an optional activity.
2. The browser sends session ID, idempotency key, patient, section, source version, and a bounded fictional response.
3. The API rejects stale/unsupported sources and fixed unsafe patterns before Gemini.
4. Gemini returns exactly four structured fields: standing, walking, clearance, and confidence.
5. The API maps those fields to complete, incomplete, unclear, or contradictory.
6. Fixed server-authored feedback names only facts from the canonical instruction.
7. One comprehension retry is available. Provider failures consume no comprehension attempt.
8. An explicit visitor action may invoke the existing simulated handoff with `teach_back_confusion`; no automatic submission exists.

## State and privacy

- Q&A/retrieval state is browser-local UI state.
- Handoff/status and teach-back state use bounded in-memory maps.
- Handoff state is scoped by session and fictional patient.
- Teach-back state is scoped by session, patient, section, and source version.
- Teach-back idempotency stores a SHA-256 digest for request matching; raw responses are not retained.
- Restart or bounded eviction clears process memory.
- This is not a durable audit store.

## Trust boundaries

- Browser input is untrusted.
- Patient/source/version identity is server-owned.
- Gemini output is untrusted structured classification or explanation and is validated before display.
- Gemini never authors teach-back feedback, response fixtures, source metadata, delivery status, or clinical resolution.
- Simulated queue acceptance, delivery, reviewer acknowledgement, response availability, patient acknowledgement, and clinical resolution are distinct states.

## Failure behavior

Missing configuration, authentication, model access, quota/rate limits, timeout, malformed output, source mismatch, and unsafe content fail visibly. Exact source guidance remains available. No silent model substitution occurs.