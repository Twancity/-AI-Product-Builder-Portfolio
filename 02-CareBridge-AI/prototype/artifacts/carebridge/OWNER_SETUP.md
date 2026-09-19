# CareBridge owner setup: user-provided Gemini key

## Current state

The app contains disabled-by-default Gemini explanation and teach-back-classification pathways and does not use Replit-managed AI Integrations. The configured owner credential/model passed one bounded explanation case and five bounded teach-back classifications. This is limited fictional evidence, not clinical validation or general provider verification.

## Add the credential securely

1. Create or choose a Gemini API key in the owner's Google AI account.
2. In this Replit project, open **Secrets** and add a secret named `GEMINI_API_KEY`.
3. Never paste the key into chat, source code, Git, `replit.md`, this document, logs, screenshots, or a public app form.
4. Keep the key server-side. The browser sends only fictional identifiers plus a bounded demo question or teach-back response to the API; it never receives the key.
5. Restrict and rotate the key according to the Google AI account's available controls. Review account usage and quotas after live testing begins.

## Confirm a model before configuring it

Do not assume that a model is available, free, or eligible for a particular account.

1. Review the current Gemini API model list and pricing/quota documentation in the owner's Google AI account.
2. Confirm that the chosen model supports text `generateContent`, structured JSON output, the intended region, and the owner's intended free-tier quota at that time.
3. Confirm whether the account requires billing even when a free allowance is advertised. Free-tier availability and limits can change.
4. Only after those checks, add a non-secret environment variable named `GEMINI_MODEL` with the exact confirmed model identifier.
5. If no suitable free-tier model is confirmed, leave `GEMINI_MODEL` unset. CareBridge will remain **AI not connected** and will not silently substitute another model.

This project intentionally has no default Gemini model.

## First live evaluation

After both values are configured:

1. Restart the API workflow.
2. Use only the existing fictional walker scenario.
3. Verify that the explanation preserves all three required facts: walker use whenever standing, walker use whenever walking, and continuation until physical therapy clears it.
4. Confirm that the exact synthetic source and metadata remain visible beside the explanation.
5. Re-run the simulated-provider, teach-back, privacy, and browser suites before any explicitly authorized live evaluation set.
6. Record live results separately from simulated-provider results. A citation, structured output, or model-provided `supported` flag is not proof of clinical correctness.
7. Stop testing and remove or rotate the key if authentication, quota, billing, logging, or output behavior is unexpected.

## Scope and safeguards

- Only narrowly supported fictional walker questions or current-source teach-back responses may reach Gemini.
- Diagnosis, treatment changes, dose changes, instruction overrides, unsupported evidence, ambiguity, and prompt-injection attempts are refused before a provider call.
- The server retrieves the synthetic source from its own canonical data using identifiers. Visitor-submitted source text and metadata are never treated as approved evidence.
- Only the exact synthetic instruction and bounded demo question or teach-back response are sent to Gemini. Source identity and metadata remain server-owned.
- Responses are checked for source identity, required restrictions, unsupported additions, output shape, and length. Failed checks show the exact original instruction and an inability to explain safely.
- Requests time out after eight seconds. Retryable provider failures receive at most one server retry, and the endpoint is limited to five requests per minute per client.
- Teach-back feedback is fixed server-authored text; Gemini returns structured meaning classification only.
- The teach-back service retains no raw response text.
- No real clinical handoff or message is sent. The handoff/status pathway is an in-memory simulation.

These controls reduce risk for this educational prototype. They do not establish clinical safety or universal prevention of unsafe model output.