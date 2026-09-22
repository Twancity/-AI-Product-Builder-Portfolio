# ProductTrace — Discovery Criteria Design

## Purpose

Discovery Criteria is the governed bridge between an incoming idea, client request, existing opportunity, or Market Intelligence opportunity and a formal ProductTrace opportunity.

The design exists to prevent an idea from becoming a product commitment simply because AI found supporting signals.

## Lifecycle

**Signal / Idea / Client Request / Market Opportunity**
→ **Discovery Criteria**
→ **Discovery Readiness Review**
→ **PM Discovery Decision**
→ **Feature / Value Definition**
→ **Formal Opportunity**
→ **Experiment Design**

AI can assist with synthesis and drafting, but the Product Manager remains the decision-maker.

## Discovery sections

### 1. Problem / Opportunity

Captures:
- problem or opportunity statement
- why it matters
- root cause / 5 Whys notes
- supporting evidence
- current workarounds
- missed opportunities
- falsification criteria

### 2. User & Client Discovery

Captures:
- user identity
- requester versus affected user
- expected behavior change
- measurable user outcomes
- user reach
- persona state
- impacted clients
- short- and long-term client benefits

### 3. Business Value & Impact

Captures separate dimensions rather than an opaque overall score:
- business areas impacted
- short-term value
- long-term value
- strategic alignment
- urgency
- reach
- evidence strength
- confidence
- reversibility
- stakeholders / SMEs

### 4. Guardrails / Constraints

Captures:
- risk of doing nothing
- cost / effort
- dependencies
- technical feasibility
- operational impact
- privacy / data concerns
- compliance / contract requirements
- deadlines
- MVP definition
- out of scope
- change-management needs
- explicit “What would make us NOT build this?” criterion

### 5. Value Assessment Plan

Separates:
- User Outcomes
- Client Outcomes
- Business Outcomes
- Learning Outcome

Each can capture:
- metric / learning statement
- method
- baseline state
- target / threshold
- timeframe
- source evidence
- owner

### 6. Product Team Notes

Captures:
- parent initiative
- product goal
- journey / event-storming artifacts
- mapping needs
- linked artifacts
- additional risks / ideas

## Discovery Readiness

ProductTrace deliberately avoids an arbitrary overall AI score.

Readiness dimensions:
- Problem clarity
- Evidence sufficiency
- User clarity
- Impact clarity
- Assumption exposure
- Measurement readiness
- Constraint awareness
- Falsification criteria

Statuses:
- Sufficient
- Incomplete
- Assumption-heavy
- Missing

The system shows exact missing items.

## PM Discovery Decision

Available decisions:
- Proceed to Opportunity
- More Discovery Needed
- Defer
- Reject

Every decision requires PM rationale and is stored as an immutable snapshot.

Proceed requires minimum governed criteria including:
- problem statement
- supporting evidence
- identified user
- expected user outcome
- impact statement
- assumption
- risk / constraint
- measurement or learning outcome
- falsification criterion

## Feature / Value Definition

After Proceed, ProductTrace requires an explicit Feature / Value Definition before promotion:

- Feature / Opportunity Description
- User Problem / Need Statement
- Scope of Work
- Outputs
- Assumptions
- Out of Scope
- Dependencies
- Stakeholders
- Feature Value
- Value Hypothesis
- Value Assessment Plan

PM confirmation is required before formal opportunity promotion.

Release Notes intentionally remain outside Discovery.

## AI governance

AI assistance may:
- summarize notes
- draft problem statements
- identify assumptions
- suggest missing questions
- draft value hypotheses
- suggest measurable outcomes

AI outputs remain classified as:
- Observed
- Inferred
- Assumption

Observed statements require linked evidence and exact excerpt validation where applicable.
Inferred and Assumption outputs must retain a provenance basis and may not be presented as facts.

## Research package

When more discovery is needed, ProductTrace can retain:
- semi-structured interview guide
- workflow observation checklist
- concept / prototype test guide
- falsification checks
- evidence capture template
- research synthesis placeholders

The package exists to collect evidence, not to manufacture conclusions.

## Governance principle

> AI proposes. Evidence supports. Discovery reduces uncertainty. The Product Manager decides.
