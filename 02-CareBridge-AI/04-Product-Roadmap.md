# CareBridge AI — Agent Product Roadmap

> **Portfolio status:** Concept and prototype work using synthetic or properly de-identified scenarios. This does not represent a deployed clinical system or achieved clinical outcomes.

## Product vision

Help patients understand and follow clinician-approved discharge instructions while keeping diagnosis, treatment changes, and clinical judgment with licensed professionals.

## Visual roadmap

```mermaid
flowchart LR
    A["NOW<br/>Foundation + Safe MVP<br/><br/>Define boundaries<br/>Grounded explanations<br/>Teach-back<br/>Human escalation"] --> B["NEXT<br/>Build + Validate<br/><br/>Agent tools<br/>Working prototype<br/>Evaluation dataset<br/>Failure testing"]
    B --> C["LATER<br/>Enhance + Scale<br/><br/>Accessibility<br/>Approved languages<br/>Portal integration<br/>Continuous monitoring"]
```

## Current portfolio progress

| Artifact | Status | Product-management evidence |
|---|---|---|
| Problem Discovery | Complete | User problem, target population, assumptions, and opportunity |
| AI Product Principles | Complete | Source-of-truth, human responsibility, and safety boundaries |
| AI Output Evaluation | Complete | Groundedness, completeness, clarity, and safety evaluation |
| Product Roadmap | Current | Prioritization, dependencies, validation gates, and future vision |
| Agent Boundary | Planned | Authorized actions, prohibited actions, and stopping conditions |
| Working Prototype | Planned | Bounded agent workflow using synthetic data |
| Evaluation Report | Planned | Test cases, failure analysis, and go/no-go recommendation |

## NOW — Foundation and safe MVP

**Objective:** Prove that the product can safely improve understanding of clinician-approved activity restrictions.

### Capabilities

- Secure entry through an authenticated QR code or link
- Retrieval of one finalized, authorized discharge plan
- Original instructions displayed beside plain-language explanations
- First pilot focused on clinician-approved activity restrictions
- Short teach-back questions to check understanding
- Patient-selected reminders within clinician-approved parameters
- Escalation of conflicting, missing, or clinical questions
- Audit records containing sources, actions, escalation status, and delivery confirmation

### Safety gates

- No diagnosis, medication changes, new treatment instructions, or symptom interpretation
- No unrestricted access to clinical databases
- Minimum-necessary access enforced through authentication and authorization
- Recommendation-only prototype with no autonomous production clinical action
- Critical instruction changes or omissions must remain at zero in the pilot test set
- Cases requiring clinical judgment must be correctly escalated

## NEXT — Build and validate

**Objective:** Turn the approved workflow into a basic agent and test it against expected and failure scenarios.

### Capabilities

- Narrow agent tools for instruction retrieval, reminders, clinical handoff, and audit logging
- Structured tool inputs and outputs
- Human-approval and stopping rules
- Synthetic evaluation dataset
- Tests for unsupported claims, instruction conflicts, expired authentication, and tool failure
- Working prototype demonstrating the bounded agent loop
- Evaluation dashboard and pilot go/no-go recommendation

### Validation gates

- High clinician-reviewed explanation accuracy
- High recall for required clinical escalations
- Complete supporting evidence for every recommendation
- Confirmed handoff delivery before telling a patient that staff received the request
- Acceptable usability results from representative patient and staff testing

## LATER — Enhance and scale

**Objective:** Add value only after the MVP demonstrates safety, usefulness, and operational reliability.

### Candidate enhancements

- Multiple reading levels that preserve critical wording
- Clinically reviewed multilingual explanations
- Voice playback and accessibility controls
- Staff dashboard for unresolved questions and acknowledgment status
- Version tracking when source instructions change
- Integration with approved patient portals and clinical workflow systems
- Analytics identifying instructions patients frequently misunderstand
- Organization-configurable policies, content libraries, and escalation routes
- Continuous evaluation and controlled prompt or model updates

## Explicitly deferred

- Autonomous diagnosis or clinical triage
- Autonomous medication or care-plan changes
- Clinical instructions generated without an approved source
- Open-web medical information used for patient-specific answers
- Fully autonomous patient-record updates

## How features will be prioritized

Each proposed feature will be reviewed using four questions:

1. **User value:** Does it materially improve understanding, follow-through, accessibility, or staff response?
2. **Safety risk:** What harm could occur if it is wrong or unavailable?
3. **Dependencies:** What data, integration, policy, or operational capability must exist first?
4. **Evidence:** What test result would justify moving it forward?

The roadmap is a living product artifact. Features may move between **NOW**, **NEXT**, and **LATER** as evaluation evidence and stakeholder feedback develop.
