# CareBridge demo script

## Five-minute path

1. Start with the red fictional-data banner and state that no real patient information may be entered.
2. Select John Doe and retrieve Mobility Instructions. Point out the exact instruction, source title, section, version, and simulated approval date.
3. Ask “When should I use my walker?” Show the narrow rule-based answer and exact evidence.
4. Open “Check my understanding.” Point out that it is optional and that the original instruction remains visible.
5. Enter an incomplete fictional response such as “I use it when walking.” Explain that Gemini classifies meaning only; feedback is fixed by the server from the stored source facts.
6. Use the single retry with a complete paraphrase. Read the warning that a match is not proof of understanding, adherence, clearance, or readiness.
7. Demonstrate an unsafe response with invented timing in a fresh session. Point out the fixed safety-rule label and zero need for a Gemini decision.
8. Choose a reviewer-only failed delivery scenario and request clarification. Show that no real clinician was contacted, then retry to confirmed simulated delivery.
9. Show the current-session status and distinguish delivery, acknowledgement, response availability, and resolution.
10. End on the roadmap: the MVP is complete; production identity, durable audit, real integrations, governance, and deployment remain outside scope.

## Questions to answer directly

- **Does Gemini decide medical correctness?** No. It performs bounded meaning classification against one exact synthetic instruction.
- **Does Gemini write teach-back feedback?** No. Feedback is fixed server-authored text.
- **Is a complete result proof the person understands?** No.
- **Does handoff contact a clinician?** No. It is a simulated in-memory queue.
- **Is raw teach-back text stored?** No.
- **Is this deployed or production-ready?** No.