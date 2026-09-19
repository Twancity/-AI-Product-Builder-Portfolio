# CareBridge AI — Product Requirements Document

**Version:** 0.2
**Status:** Reconciled with completed fictional-data portfolio prototype; unpublished
**Product:** CareBridge AI — Patient Discharge Guidance Agent  
**Owner role:** Product Management  
**Last updated:** September 2026

> This PRD preserves the original product concept and records how a narrower fictional-data prototype was implemented. It does not represent a deployed clinical product, verified clinical outcomes, or professional clinical implementation experience.

## Implementation Status

The completed portfolio prototype implements a deliberately narrower subset of this PRD:

| Area | Implemented prototype |
|---|---|
| Source retrieval | Exact retrieval from server-owned fictional discharge plans, including explicit missing-data behavior |
| Questions | Narrow deterministic Q&A with evidence and unsupported/unsafe fallbacks |
| AI explanation | Grounded Gemini pathway with deterministic pre-checks, server-owned source identity, post-generation validation, and transparent provider failures |
| Clarification | Simulated handoff delivery/status, retry and idempotency, compact session audit, and fixed authored response fixtures |
| Teach-back | Optional three-fact assessment for one fictional walker instruction, deterministic safety rules, bounded meaning classification, one retry, fixed feedback, and no raw-response retention |
| Data and operations | Fictional data, process/session-scoped state, no real clinical system, no real clinician contact, and no deployment |

Recorded verification includes **25/25 teach-back**, **23/23 handoff/status**, and **24/24 browser interaction** checks. Existing **11/11 rule-Q&A**, **17/17 simulated grounding**, and **7/7 diagnostic/privacy** checks also pass.

Authentication, patient-selected reminders, real reviewer identity, durable governed audit storage, real clinical messaging, production integrations, operational monitoring, and clinical validation remain outside the implemented prototype. The finished source and detailed evidence are available in [`prototype/`](./prototype/artifacts/carebridge/README.md).

## 1. Executive Summary

CareBridge AI is a bounded patient-support agent designed to help recently discharged adults understand and follow clinician-approved discharge instructions.

The initial MVP will focus on activity restrictions following an outpatient orthopedic procedure. The product may retrieve approved instructions, explain them in plain language, ask short teach-back questions, schedule permitted reminders, and escalate unresolved or clinical questions. It will not diagnose, change treatment, modify medication instructions, or replace clinical judgment.

## 2. Problem Statement

Patients may leave a healthcare setting with lengthy, complex, or difficult-to-remember discharge instructions. Some patients rely primarily on verbal explanations and may later struggle to identify what they need to do, when they need to do it, or when they should contact their care team.

This creates a potential gap between receiving instructions and understanding or acting on them correctly.

The existence, frequency, and severity of this problem remain product hypotheses that must be validated through user and stakeholder research.

## 3. Product Vision

Help patients understand and follow clinician-approved discharge instructions while keeping diagnosis, treatment changes, and clinical judgment with licensed professionals.

## 4. Target Users

### Primary user

A recently discharged adult outpatient orthopedic patient who receives multi-step instructions and is responsible for managing follow-up activities at home.

### Secondary users

- Clinical staff responsible for discharge education
- Staff receiving escalated patient questions
- Care coordinators
- Compliance, privacy, and security stakeholders
- Product and operations teams monitoring quality and workflow performance

### Initial pilot segment

Adults ages 18–60 discharged after an outpatient orthopedic procedure.

This is a focused pilot hypothesis, not a permanent eligibility restriction.

## 5. User Need

> When I return home after a procedure, I need a simple and trustworthy way to understand what I am expected to do, remember important steps, and know when I need help from my care team.

## 6. Goals

The MVP should:

1. Improve patient understanding of clinician-approved activity restrictions.
2. Preserve the meaning and critical details of the approved source.
3. Help patients locate and organize their next steps.
4. Check understanding through short teach-back questions.
5. Support permitted reminders without changing clinical timing.
6. Escalate questions that require clinical judgment or cannot be answered safely.
7. Create traceable evidence of sources, agent actions, failures, and escalation outcomes.
8. Demonstrate responsible Agentic AI product design through a testable portfolio prototype.

## 7. Non-Goals

The MVP will not:

- Diagnose conditions or interpret symptoms
- Provide emergency triage
- Recommend or change treatment
- Change medication dosage, frequency, duration, or timing
- Create new clinical instructions
- Resolve conflicts between verbal and written clinical directions
- Replace the original discharge document
- Integrate with every hospital or clinical system
- Serve every procedure type
- Use open-web medical information for patient-specific guidance
- Make autonomous production changes to a patient record
- Claim reduced readmissions or other clinical outcomes without evidence

## 8. Product Hypotheses

1. Patients experience difficulty understanding or remembering portions of discharge instructions.
2. A secure digital experience can make approved instructions easier to navigate.
3. Plain-language explanations grounded in the approved source can improve comprehension.
4. Teach-back provides stronger evidence of understanding than acknowledgment alone.
5. A bounded agent can coordinate explanation, reminders, comprehension checks, and escalation more effectively than a single summarization feature.
6. Patients and clinical staff will trust the experience only if boundaries, sources, and human escalation are clear.

Each hypothesis requires research or testing before being treated as validated.

## 9. MVP Scope

### Included

- Secure QR-code or link entry
- Authentication before patient-specific information is displayed
- Retrieval of one finalized and authorized discharge plan
- Display of original activity restrictions
- Plain-language explanations grounded in the approved source
- Links between each explanation and its source instruction
- Short teach-back questions
- Patient-selected reminder preferences within clinician-approved parameters
- Detection of unsupported, conflicting, incomplete, or clinical questions
- Structured clinical handoff to an approved queue
- Delivery confirmation and fallback when handoff fails
- Audit events for source retrieval, explanation, reminder, escalation, and failure states
- Synthetic or properly de-identified test scenarios

### Excluded from the initial MVP

- Medication guidance beyond displaying the original approved instruction
- Symptom evaluation
- Image-based wound assessment
- Clinical decision-making
- Autonomous record modification
- Open-ended medical question answering
- Production EHR integration

## 10. Agent Goal and Boundary

### Agent goal

Help an authenticated patient understand and follow finalized, clinician-approved activity restrictions while escalating questions requiring clinical judgment.

### The agent may

- Retrieve authorized instructions through a narrow read-only tool
- Present approved source content
- Generate a plain-language explanation grounded in that content
- Ask an approved teach-back question
- Evaluate whether a response matches critical facts
- Schedule a patient-confirmed reminder within approved parameters
- Prepare a structured clinical handoff
- Record an auditable event
- Stop and invoke an approved fallback

### The agent must not

- Diagnose, prescribe, or interpret symptoms
- Add, remove, or change clinical instructions
- Change medication information
- Decide between conflicting clinical sources
- Access information outside the authenticated patient and encounter scope
- Treat its own confidence score as authoritative evidence
- Mark a clinical question resolved
- Claim that a handoff succeeded without delivery confirmation
- Approve its own recommendation
- Continue answering after a mandatory stopping condition is met

## 11. Delegation Model

| Responsibility | Deterministic software | AI agent | Human |
|---|---:|---:|---:|
| Authenticate user | Yes | No | Oversight |
| Authorize record access | Yes | No | Oversight |
| Retrieve approved instruction | Yes | Select permitted tool | No |
| Display original source | Yes | No | No |
| Create plain-language explanation | No | Yes | Review during pilot |
| Send fixed reminder | Yes | Select permitted option | Configure constraints |
| Check teach-back response | Rules plus validation | Bounded interpretation | Review uncertain cases |
| Diagnose or change care | No | No | Yes |
| Resolve conflicting instructions | No | No | Yes |
| Create escalation request | Yes | Select when required | Receive and resolve |
| Confirm handoff delivery | Yes | Interpret returned status | Operational oversight |
| Write audit event | Yes | Initiate permitted event | Review |

## 12. Proposed User Journey

1. Clinical staff finalize the discharge plan.
2. The patient receives a secure QR code or link.
3. The patient authenticates.
4. The system retrieves the authorized discharge plan.
5. The patient sees the original instruction and plain-language explanation.
6. The agent asks a short teach-back question for a critical restriction.
7. The patient selects an allowed reminder preference.
8. The agent answers only questions supported by approved content.
9. Conflicting, missing, unsupported, or clinical questions trigger a structured handoff.
10. The system confirms whether the handoff was accepted.
11. The patient receives a truthful status and approved next step.
12. The system records required audit events.

## 13. Functional Requirements

### FR-01 — Authentication

The system must authenticate the patient before displaying patient-specific discharge information.

### FR-02 — Authorization

The system must restrict access to the authenticated patient's authorized encounter and minimum necessary information.

### FR-03 — Approved-plan retrieval

The system must retrieve only a finalized discharge plan and return its source identifier, version, and timestamp.

### FR-04 — Source display

The experience must display the original clinician-approved instruction alongside or directly linked to any AI-generated explanation.

### FR-05 — Grounded explanation

The agent must generate explanations using only authorized source content and approved education material.

### FR-06 — Critical-fact preservation

The explanation must preserve all material restrictions, dates, durations, warnings, and assistive-device directions contained in the source.

### FR-07 — Teach-back

The experience must ask at least one teach-back question for a critical activity restriction and record whether review or escalation is required.

### FR-08 — Reminder control

Clinical staff must define required timing constraints. Patients may select a preferred time and permitted delivery channel within those constraints.

### FR-09 — Clinical escalation

The agent must create a structured handoff when information conflicts, required evidence is unavailable, the question requires clinical judgment, or the agent cannot answer safely.

### FR-10 — Delivery confirmation

The system must receive a request identifier and confirmed delivery status before telling the patient that the clinical team received the request.

### FR-11 — Failed-handoff fallback

If delivery is not confirmed, the system must state that delivery was not confirmed, record the failure, and show an organization-approved alternative contact path.

### FR-12 — Auditability

The system must record source references, relevant versions, selected tools, outcomes, stopping reasons, escalation status, and timestamps without unnecessarily copying the complete clinical record.

### FR-13 — Session expiration

An expired or invalid session must block patient-specific access and require reauthentication.

## 14. AI Quality and Safety Requirements

Every patient-facing AI explanation must be evaluated for:

- **Accuracy:** Clinical facts remain correct.
- **Groundedness:** Each clinical statement is supported by an approved source.
- **Completeness:** No clinically material information is omitted.
- **Clarity:** The explanation is easier to understand.
- **Safety:** No unsupported or harmful direction is introduced.

### Blocking conditions

The system must not release an AI-generated response when it:

- Changes a clinical fact or restriction
- Introduces an unsupported clinical statement
- Omits clinically material information
- Requires new clinical judgment
- Conflicts with an approved source
- Cannot identify the supporting source
- Violates an authorization or tool-permission rule

The approved fallback is to display the original instruction and provide the appropriate human-contact or escalation path.

## 15. Data Requirements

### Approved sources

- Final clinician-approved discharge instructions
- Hospital-approved patient education
- Approved contact and escalation protocols
- Permitted patient-specific encounter context

### Required source metadata

- Source identifier
- Version
- Approval or finalization status
- Effective timestamp
- Relevant instruction section
- Access authorization context

### Data constraints

- Use synthetic or properly de-identified scenarios for the portfolio prototype.
- Do not place real patient data in the prototype or public repository.
- Do not infer missing clinical facts.
- Do not retrieve information beyond the minimum necessary scope.

## 16. Identity and Access Requirements

- Patient authentication is required before patient-specific retrieval.
- Authorization must be scoped to one permitted patient and encounter.
- Agent tools must enforce least privilege.
- Read and write capabilities must be separated.
- Clinical handoff creation must be a limited write to an approved destination.
- Audit logging must be append-only for the agent.
- Unauthorized tool requests must be denied and logged.
- Session expiration must require reauthentication.

## 17. Human-in-the-Loop Requirements

Clinical review is mandatory when:

- Written and verbal directions appear to conflict
- Approved sources conflict
- Source content is incomplete or missing
- A patient requests a medication or treatment change
- A question requires symptom interpretation or clinical judgment
- The patient repeatedly cannot demonstrate understanding of a critical instruction
- Authentication or authorization cannot be confirmed
- The clinical handoff cannot be delivered
- The case falls outside documented policy

The handoff must include the patient question, relevant source instruction, source version, conflict or missing information, stopping reason, timestamp, destination queue, and delivery status.

## 18. User Stories

### US-01 — Understand an instruction

As a recently discharged patient, I want a plain-language explanation linked to my original instruction so that I can understand what I am expected to do without losing the approved meaning.

### US-02 — Confirm understanding

As a patient, I want a short check of my understanding so that unclear critical instructions can be identified before I act on them.

### US-03 — Receive a reminder

As a patient, I want to select an allowed reminder time so that I can remember an important approved task.

### US-04 — Ask for help

As a patient, I want unresolved questions routed to the appropriate clinical team so that I do not have to guess.

### US-05 — Receive truthful status

As a patient, I want to know whether my request was actually delivered so that I can use another approved contact method if necessary.

### US-06 — Review an escalation

As a clinical staff member, I want the patient question and relevant instruction included in the handoff so that I can understand why the agent stopped.

### US-07 — Audit the workflow

As a compliance or product reviewer, I want traceable source and action records so that I can reconstruct what the system did and why.

## 19. Proposed Success Metrics

### Primary pilot metric

Clinician-reviewed comprehension accuracy for critical activity restrictions.

### Supporting metrics

- Percentage of explanations passing all five quality dimensions
- Critical-instruction omission rate
- Unsupported clinical statement rate
- Correct clinical-escalation rate
- High-risk escalation recall
- Complete-evidence rate
- Teach-back completion rate
- First-attempt correct routing
- Confirmed handoff delivery rate
- Human override rate
- QR activation rate
- Reminder opt-in and completion rates

QR scans, clicks, and acknowledgments measure adoption or engagement; they do not independently prove comprehension or clinical benefit.

## 20. Proposed MVP Acceptance Criteria

The prototype is ready for a controlled demonstration when:

1. An authenticated synthetic user can retrieve only the authorized synthetic discharge plan.
2. The original activity restriction is displayed with its source version.
3. The agent produces a plain-language explanation without changing any critical fact.
4. Every released explanation can be traced to an approved source.
5. Critical instruction changes, unsupported clinical directions, or material omissions block the response.
6. A patient can complete a teach-back interaction.
7. A patient can select a reminder only within approved parameters.
8. Conflicting or unsupported questions trigger the defined stopping and escalation workflow.
9. A successful handoff returns a request identifier and confirmed delivery status.
10. A failed handoff produces a truthful failure message and approved alternative contact path.
11. Expired or unauthorized sessions cannot retrieve patient-specific information.
12. Required audit events can reconstruct the test workflow.
13. No real patient data appears in the prototype, tests, screenshots, or repository.

## 21. Risks and Mitigations

| Risk | Potential effect | Proposed mitigation |
|---|---|---|
| Hallucinated clinical guidance | Patient harm or loss of trust | Approved-source grounding, blocking tests, and human escalation |
| Material information omitted | Incorrect patient action | Critical-fact extraction and completeness evaluation |
| Overreliance on AI | Patient delays human contact | Visible source, clear boundaries, and accessible human-contact option |
| Incorrect authorization | Exposure of patient information | Authentication, encounter-scoped authorization, and least privilege |
| Failed handoff presented as success | Patient believes staff received the request | Request ID and delivery confirmation requirement |
| Stale source instructions | Outdated guidance displayed | Finalization status, source versioning, and change-control workflow |
| Accessibility barriers | Exclusion or misunderstanding | Accessibility testing and later voice/readability capabilities |
| Low staff adoption | Escalations remain unresolved | Staff workflow research and structured handoff design |
| Prototype mistaken for deployed experience | Misrepresentation in portfolio | Prominent concept-stage and synthetic-data statements |

## 22. Dependencies

- Approved discharge content
- Defined source-of-truth ownership
- Authentication and authorization design
- Approved escalation policies and destinations
- Clinical reviewer participation
- Synthetic evaluation scenarios
- Tool contracts and audit schema
- Safety evaluation rubric
- Reminder and handoff delivery mechanisms

## 23. Roadmap Summary

### NOW — Foundation and safe MVP

- Validate the problem and target user
- Finalize agent boundaries
- Define source, tool, IAM, and handoff contracts
- Build the activity-restriction prototype
- Create the evaluation dataset

### NEXT — Build and validate

- Conduct safety and failure-mode testing
- Evaluate comprehension, escalation, and evidence quality
- Add staff workflow and delivery-reliability features
- Make a pilot go/no-go recommendation

### LATER — Enhance and scale

- Approved multilingual explanations
- Multiple reading levels
- Voice and accessibility options
- Patient-portal and clinical-workflow integrations
- Staff dashboard
- Organization-configurable policies
- Continuous evaluation and controlled updates

## 24. Open Questions

1. Which role owns final approval of discharge content?
2. Which clinical queue should receive each escalation category?
3. What response-time expectation should be communicated to patients?
4. Which activity restrictions are sufficiently standardized for the first test set?
5. What authentication method is appropriate for the proposed patient experience?
6. Which source metadata are available from the system of record?
7. How should teach-back accuracy be reviewed during the pilot?
8. What evidence threshold should block release or require human review?
9. Which reminder channels are permitted?
10. What research evidence would justify expanding beyond activity restrictions?

## 25. Product Decision Record

The MVP uses a bounded agent rather than a fully autonomous clinical system. The agent may coordinate permitted steps toward patient comprehension, but deterministic software enforces identity, access, retrieval, reminders, workflow state, and auditability. Licensed clinical staff retain responsibility for diagnosis, treatment decisions, conflicting instructions, and changes to care.

This approach uses AI for language and bounded reasoning where it may create user value while preserving human authority for consequential clinical decisions.
