# CareBridge case study

## Challenge

Discharge instructions combine high information load with high consequences for ambiguity. A portfolio prototype needed to demonstrate useful retrieval and flexible language handling without implying clinical authority, inventing advice, or hiding model uncertainty.

## Product decision

CareBridge treats the stored synthetic instruction as the authority. Deterministic rules handle eligibility and obvious unsafe language. Gemini is used only where flexible language adds value: a narrow explanation and structured teach-back meaning classification.

For teach-back, the model never writes feedback. It returns whether each of three source facts is supported, missing, or contradicted, plus confidence. The server decides the outcome and selects fixed feedback. This preserves a clear boundary between probabilistic interpretation and authored product behavior.

## Safety and privacy choices

- Exact source remains visible with every result.
- Obvious contradiction, negation, early stopping, invented timing, treatment change, and injection are rejected before Gemini.
- One retry avoids an unbounded conversational loop.
- Clarification handoff is offered but never submitted automatically.
- Provider failures consume no comprehension attempt.
- Session/source state is bounded and process-local.
- Raw teach-back responses are not retained.
- All patient, clinician, queue, review, and response behavior is explicitly synthetic.

## Evidence

The final synthetic suite passed 25/25 teach-back service checks, 23/23 handoff/status checks, 24/24 browser checks, 11/11 rule-Q&A checks, 17/17 explanation-grounding checks, and 7/7 privacy/diagnostic checks.

The bounded live teach-back set used five actual generation attempts with no retries. It correctly separated complete, incomplete, unclear, contradictory, and synonym/spelling-variation cases. That evidence is intentionally narrow and does not establish clinical validity.

## Outcome

The MVP demonstrates a reviewable architecture for exact-source guidance, constrained AI assistance, bounded comprehension checking, and explicit simulated escalation. It also makes its omissions visible: no production identity, durable clinical audit, real integration, real clinician workflow, deployment, or clinical validation.