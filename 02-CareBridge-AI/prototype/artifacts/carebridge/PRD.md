# Product Requirements Document: CareBridge

## Problem
Patient discharge instructions are often overwhelming, difficult to navigate, and generalized. Patients struggle to locate specific guidance relevant to their current situation (e.g., mobility, medications), leading to potential non-compliance or unsafe behaviors.

## Target Users
- **Patients (Fictionalized for this demo):** Individuals recovering at home needing quick, specific answers from their discharge plans.
- **Evaluators / Product Stakeholders:** Reviewing the capability of structured retrieval for patient guidance.

## Goals
- Demonstrate a structured, safe retrieval of patient discharge instructions.
- Establish a clear, accessible, and calming visual language suitable for healthcare context (teal/green).
- Enforce strict boundaries on what the system can and cannot do, making it explicitly clear that data is synthetic and not for clinical use.

## Non-Goals
- Connecting to real EHR/EMR systems or hospital databases.
- Managing real patient data or allowing free-text patient entry.
- Providing actual clinical advice or replacing clinician communication.
- Providing unbounded generative AI output, model-authored clinical advice, or model-authored patient feedback.
- Implementing file uploads, clinical messaging, or billing.

## Milestone Scope (Current)
- Synthetic source retrieval based on pre-defined fictional scenarios.
- UI for selecting a patient scenario and a specific section of their discharge plan.
- Explicit handling of "missing" information to demonstrate safety (no hallucination).
- Persistent safety banners and clear metadata display (version, approval date, retrieval time).
- Rule-based synthetic Q&A feature explicitly labeled as "Rule-based demo — AI not connected".
- Safe question resolution based on narrow exact/pattern allowlists and explicit unsafe-intent detection.
- Required evidence metadata shown for every Q&A answer.
- Disabled-by-default Gemini explanation endpoint using an owner-provided `GEMINI_API_KEY` and an explicitly configured `GEMINI_MODEL`.
- Server-owned source lookup: visitors submit only fictional identifiers and a bounded demo question, never approved source text or metadata.
- Narrow pre-provider safeguards, server-owned source identity, required-fact validation, unsupported-addition detection, bounded retries, timeout handling, and per-client usage limits.
- Loading, unavailable, error, retry, and stale-response states for the Gemini pathway.
- Session-scoped simulated review handoff with explicit delivered, failed, and accepted-but-unconfirmed scenarios; separate attempt and queue IDs; one bounded retry; compact audit history; and no-real-clinician notices.
- Optional session-scoped teach-back after supported current-source walker guidance. The visitor can skip, explain the instruction in up to 300 fictional characters, retry once, or explicitly request the existing simulated clarification handoff.
- Deterministic contradiction, early-stop, invented-timing, treatment-change, and injection rules run before Gemini. Gemini returns only structured meaning classifications for standing, walking, physical-therapy clearance, and confidence; all visitor feedback is fixed server-authored text.
- Owner setup guidance in `OWNER_SETUP.md`. The owner-key credential and `gemini-3.1-flash-lite` are configured. After conservative prompt/validator alignment, one bounded fictional walker case produced an accepted grounded explanation and rendered successfully.

## User Stories
1. As a user, I can select between fictional patient scenarios so that I can see how personalized discharge guidance is organized.
2. As a user, I can select a specific section (e.g., Mobility) and then click 'Retrieve exact instruction' to see the exact instruction retrieved from the synthetic plan.
3. As a user, if I select a section that has no data, I receive a clear message stating the source does not answer the question and clinical clarification is needed, ensuring I know the system won't invent answers.
4. As a user, when I change the selected patient or section, any previously retrieved result and timestamp is cleared to prevent misattribution.
5. As an evaluator, I see a persistent banner and disclaimers reminding me this is a prototype and not for clinical use.
6. As a user, I can ask a question using a text input bounded by character length and see rule-based safe responses or unsupported fallbacks.
7. As a user, if my question mentions unsupported intents (e.g. changing doses, ignoring instructions), I am reliably presented with a safe fallback instead of clinical advice.
8. As a visitor, I can optionally explain when the walker is needed in my own words and receive source-linked feedback about all three required facts.
9. As a visitor, I can retry one incomplete, unclear, or contradictory teach-back response or explicitly request simulated clarification; no request is submitted automatically.
10. As an evaluator, I can distinguish fixed safety-rule decisions from live Gemini meaning classification and see that a match is not proof of real understanding, adherence, or readiness.

## Requirements
- **Theme:** Calm teal/green and white.
- **Typography & Accessibility:** Large readable text, highly accessible labeled controls, strong focus states.
- **Safety:** Persistent banner reading exactly: "Educational prototype — fictional data only. Not for clinical use. Do not enter real patient information."
- **Retrieval metadata:** Show fictional patient name, document title, section, version, simulated approval date, and retrieval timestamp.
- **Exact Instruction:** Must include "Use your walker whenever standing or walking until cleared by physical therapy."
- **Missing Data Handling:** Must explicitly state if a question isn't answered by the source.
- **No Emojis:** Professional, reassuring tone without emojis.
- **Rule-based Q&A:** A labeled text input allowing user questions with deterministic resolution logic.
- **Strict Evidence Rules:** A matching topic does not alone warrant an answer. Exact patterns must match and unsafe keywords must trigger an explicitly unhelpful fallback.
- **State-specific request wording:** Before submission, say no demo request has been submitted. After simulated delivery, say the demo request was delivered and is awaiting simulated review while clearly stating no real clinician was contacted.
- **AI Status:** Authored rule output, exact-source fallback, simulated provider output, and genuine Gemini output must remain visibly distinct. A single successful live case must not be presented as clinical validation.
- **Grounding:** A Gemini request may use only the server-owned selected synthetic instruction and bounded demo question. Patient, source, section, version, and metadata identity remain controlled by the server rather than model-echoed identifiers.
- **Failure behavior:** Missing credentials, authentication errors, timeout, rate limits, malformed output, source mismatch, and unsupported additions must fail transparently and retain the exact original source.
- **Stale-response protection:** Patient, source, or question changes must invalidate pending explanation responses.
- **Review preparation:** Unsupported missing, ambiguous, conflicting, diagnosis, or treatment-change questions show a stop reason and a compact review summary with the fictional question, trusted source reference/version or missing-evidence statement, and timestamp.
- **Delivery confirmation:** “Delivered to demo review queue” appears only after a unique queue request ID and explicit confirmation. Queue acceptance or an ID alone is not delivery confirmation.
- **Failure behavior:** Failed and unconfirmed demo deliveries state that delivery was not confirmed, show illustrative nonfunctional alternative guidance, and never imply review or clinical resolution.
- **Retry/idempotency:** Repeated submission does not create duplicate logical or queue requests. One manual retry uses a new attempt ID and reuses an already accepted queue request ID.
- **Audit/session scope:** Compact audit events include time, reason, source reference/version, attempt ID, and status; history is limited to the browser session, fictional patient, and running process.
- **Request visibility:** A current-session status view shows queue request ID when available, latest status, updated time, source/version, and the next available action for the selected fictional patient.
- **Distinct review states:** Delivery, reviewer acknowledgement, response availability, patient acknowledgement, and clinical resolution are never treated as equivalent. Reviewer acknowledgement and response availability advance only through labeled manual simulation controls.
- **Authored response safety:** Demo responses use fixed authored fixtures, never Gemini. A current source-version match may display an illustrative non-clinically-approved response; superseded or unverifiable versions require clarification and display no new advice.
- **Plan immutability:** Demo responses never alter or overwrite original synthetic discharge instructions.
- **Teach-back scope:** Teach-back is available only for the current `p1` mobility source/version after a supported answer. It is separate from reviewer acknowledgement, clinical resolution, and the original rule-based Q&A.
- **Three-fact assessment:** A complete result requires walker use whenever standing, whenever walking, and until physical therapy clears the visitor. Keyword repetition alone is insufficient.
- **Deterministic preemption:** Obvious negation, optionality, early-stop wording, invented timing, treatment change, and prompt-injection attempts are contradictory without a provider call.
- **Model boundary:** Gemini classifies meaning into `supported`, `missing`, or `contradicted` for each fact plus high/low confidence. It does not write visitor feedback, approve care, change the plan, or create a handoff.
- **Retry and failure semantics:** One comprehension retry is allowed. Provider failures consume no comprehension attempt. Handoff is offered but never automatic.
- **Teach-back privacy:** Raw teach-back text is not retained. Bounded session memory stores only outcome, attempt counts, timestamp, assessment source, and source reference/version; reload access remains session/source scoped.

## Proposed Metrics (Not Measured in Prototype)
- Task Success Rate: Percentage of users finding the correct instruction for a given scenario.
- Time to Find: Average time taken to retrieve specific guidance vs. traditional paper packets.
- Safety Guardrail Trigger Rate: Frequency of the system correctly declining to answer missing info.

## Risks
- Users mistaking the interface for a live clinical tool. Mitigation: Aggressive and persistent disclaimers.
- AI Hallucinations (in future steps). Mitigation: Strict grounding and the current "missing data" fallback pattern.

## Acceptance Criteria
- User can toggle between at least two fictional patients.
- Selecting a section retrieves the exact text or the missing data message.
- Changing patient/section clears the retrieved result until explicitly retrieved again.
- The UI matches the calm teal/green aesthetic.
- All disclaimers and safety banners are present and match the exact requested text.
- The roadmap is visible and clearly distinguishes current vs future capabilities.
- Question input is visually distinct, bounded, and shows a character count.
- Safe examples demonstrate positive flow, while unsafe inputs correctly hit fallbacks.
- Unsupported scenarios can create a clearly simulated review request and exercise confirmed, failed, and unconfirmed delivery without contacting a real clinician.
- Supported answers do not create handoffs; patient switches suppress stale in-flight handoff results.
- Delivered requests remain “awaiting simulated review” until manual acknowledgement; responses remain unavailable until a second manual simulation.
- Superseded or unverifiable response fixtures show clarification required, preserve the current plan, and do not display advice.
- Optional teach-back supports skip, one retry, provider-failure recovery, reload restoration, exact-source display, truthful assessment-source labeling, and explicit simulated handoff.
- Complete teach-back requires all three source facts; deterministic unsafe cases never reach Gemini; no raw response appears in result or audit history.

## Verification Status
Checks run for this milestone:

- **Passed:** TypeScript typecheck.
- **Passed:** 11/11 deterministic rule checks covering supported walker evidence, missing stairs, stopping walker use, medication dose changes, ambiguity, conflicts, unrelated questions, override attempts, topic-only false matches, cross-patient isolation, and empty input.
- **Passed:** 17/17 simulated-provider checks covering faithful output, reordered fact labels, missing standing/walking/clearance conditions, early-stop advice, treatment additions, wrong-patient isolation, altered instructions, invented facts, missing key/model, timeout, malformed output, authentication, rate limiting, and injection refusal.
- **Passed:** 7/7 provider diagnostic/privacy checks, including redaction and rejection of invented source/version metadata.
- **Passed:** 23/23 simulated-handoff/status checks, including teach-back-origin eligibility, explicit source binding, server-observed current-source scope, immutable retry binding, and stale-source rejection.
- **Passed:** 25/25 teach-back service checks covering faithful paraphrase, synonyms/spelling variation, keyword-only failure, missing facts, ambiguity, expanded direct negation/injection/timing/substitution/early-option paraphrases, provider failure/retry, source mismatch, two-attempt escalation, idempotency, input bounds, session/patient isolation, and no raw-response retention.
- **Passed:** 24/24 browser interaction checks covering the prior retrieval/Q&A/AI/status suite plus teach-back skip/reopen, fixed-rule contradiction, reload recovery, stale-question invalidation, pending-response patient-switch suppression, optional handoff, teach-back handoff retry, and mobile overflow.
- **Passed:** The live API endpoint returned `missing_credentials` with exact source evidence and made no model call while the key was absent.
- **Passed:** After restarting the API workflow, the running backend recognized a nonempty owner credential and `gemini-2.5-flash`.
- **Recorded live result:** The initial supported fictional walker request made one provider attempt and stopped on a generic non-retryable `provider_error`. After privacy-safe diagnostics passed fixture tests, one authorized diagnostic retest made one attempt and identified `model_access`, upstream status `404`, reason `NOT_FOUND`: `gemini-2.5-flash` is no longer available to new users. No model explanation was accepted; the exact canonical source and metadata were retained. See `EVALUATION.md`.
- **Recorded replacement activation:** The owner configured `gemini-3.1-flash-lite`. Three refusal checks again stopped with zero provider attempts. The bounded activation used two actual attempts: the first proved the API process still had the obsolete model loaded; after restarting the existing workflow, the second reached the replacement model but failed validation as `rejected_model_output` / `source_mismatch`. No genuine explanation was accepted or rendered.
- **Passed narrow live case:** After aligning the prompt with the unchanged clinical restrictions and anchoring source identity on the server, one authorized `gemini-3.1-flash-lite` attempt returned “You must use your walker whenever standing or walking until you are cleared by physical therapy.” It passed validation and rendered beside the exact trusted source and metadata.
- **Passed bounded teach-back live set:** Five authorized one-attempt scenarios produced the intended structured outcomes: complete paraphrase → `complete`, walking-only → `incomplete`, ambiguous reference → `unclear`, subtle contradiction → `contradictory`, and synonym/spelling variation → `complete`. No retry, provider error, model/billing change, or raw-response retention occurred; one of the six allowed attempts remained unused.
- **Failed:** None in the final test runs. One obsolete browser assertion expected the pre-submission notice after the wording was intentionally corrected; the assertion was updated and the complete suite passed.
- **Untested:** Broader live Gemini behavior beyond the bounded fictional walker cases, production authentication/authorization, real reviewer identity, patient acknowledgement, durable audit storage, genuine clinical integrations, screen-reader behavior, physical assistive-technology use, older browsers, production deployment, real patient data, clinical systems, and real messaging.

The provider results above are simulated. They are not evidence about Gemini's real behavior or clinical correctness.

## Blockers Before Production AI Use

- The owner confirmed the Google project as Free tier, and the restarted backend recognizes the configured credential and `gemini-3.1-flash-lite`.
- The prompt/validator mismatch is repaired for the narrow walker case, and assertion-level private diagnostics are available without retaining source/model text.
- One narrow live output and its rendered UI are verified separately from simulated evidence. This does not establish broader reliability or clinical safety.
- Broader adversarial model behavior, conflicting evidence, and generalization beyond the single fictional instruction remain unverified.
- The current allowlist and refusal rules are deterministic demo logic, not a validated clinical safety system.
- A future AI milestone needs a defined grounding contract that permits answers only from selected source evidence and preserves exact citations.
- Treatment-change, ambiguity, conflicting-evidence, prompt-injection, and unsupported-question safeguards need broader adversarial evaluation before any real AI is connected.
- Clinical governance, privacy review, real-data authorization, audit requirements, escalation ownership, and human-confirmed handoff behavior are unresolved.

## Future Roadmap (Now / Next / Later)
### Now (Implemented)
- Synthetic source retrieval.
- Fictional scenario evaluation.
- Missing-data guardrails.
- Rule-based synthetic Q&A with exact evidence (AI not connected).
- Gemini explanation pathway, server-owned source identity, privacy-safe assertion diagnostics, expanded simulated evaluation, replacement-model configuration, and one accepted/rendered bounded live fictional explanation.
- Simulated review handoff with confirmation semantics, failure/unconfirmed states, bounded idempotent retry, process-local session/patient history, and compact audit events.
- Current-session request status and next actions, manual simulated reviewer acknowledgement, fixed authored response fixtures, and source-version clarification safeguards.
- Optional bounded teach-back with fixed safety rules, Gemini meaning classification only, fixed authored feedback, one retry, explicit simulated handoff, source/session isolation, and no raw-response retention.

### Next (Evaluation, not part of the MVP)
- Expand adversarial evaluation without weakening source, condition, contradiction, and unsupported-advice checks.
- Evaluate real model faithfulness, provider failure behavior, and account usage.

### Later (Planned)
- Validated personalization.
- Demo reminders.
- Production authentication and authorization.
- Genuine clinical messaging, reviewer workflows, durable audit, and clinical-system integrations.