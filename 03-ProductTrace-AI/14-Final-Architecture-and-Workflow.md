# ProductTrace — Final Architecture & Workflow

## Product principle

ProductTrace is an evidence-to-decision system for Product Managers.

Its central rule is:

> **AI proposes. Evidence supports. Discovery reduces uncertainty. The Product Manager decides.**

## End-to-end workflow

### 1. Evidence Intake
Customer and product evidence enters ProductTrace.

Examples:
- customer feedback
- support issues
- workflow observations
- product usage signals
- research notes

### 2. AI Analysis
AI identifies patterns and themes from linked evidence.

Every generated theme must retain:
- supporting evidence IDs
- exact excerpts
- confidence
- provenance

### 3. Opportunity Board
AI-generated opportunities are reviewed by the PM.

PM actions:
- Accept
- Modify
- Reject
- Defer

Original AI wording is preserved.

### 4. Experiment Design
Accepted product opportunities can produce an experiment draft.

The experiment captures:
- hypothesis
- primary metric
- secondary metrics
- guardrails
- proposed design
- expected outcome
- decision threshold
- instrumentation plan

PM approval is required.

### 5. Eval Center
Real AI evaluation cases test:
- classification
- grounding
- unsupported recommendations
- critical failures
- execution errors

Failed runs remain visible.

### 6. Launch Gate
ProductTrace blocks launch approval until required governance criteria pass.

The PM retains the final Approve / Hold decision.

### 7. Market Intelligence
External market evidence is captured with provenance.

Workflow:
**Research Brief → Market Sources → Competitors → Market Themes → Opportunity Synthesis**

AI-generated market claims must retain exact source evidence.

### 8. Discovery Criteria
Before a new idea or Market Opportunity becomes a formal product commitment, it passes through structured discovery.

Workflow:
**Idea / Client Request / Market Opportunity → Discovery Criteria → Discovery Readiness → PM Discovery Decision → Feature / Value Definition → Formal Opportunity**

Readiness dimensions:
- Problem clarity
- Evidence sufficiency
- User clarity
- Impact clarity
- Assumption exposure
- Measurement readiness
- Constraint awareness
- Falsification criteria

No opaque overall AI score is used.

### 9. Decision History
Decision History spans the entire system.

It records:
- AI synthesis
- PM decisions
- rationale
- before / after state
- experiment approvals
- evaluation runs
- instrumentation validation
- launch decisions
- market decisions
- discovery decisions

## Evidence types

ProductTrace combines two evidence streams:

**Internal / Customer Evidence**
+
**External / Market Evidence**
→
**Grounded Product Decision**

## Human governance

AI may:
- synthesize
- classify
- identify themes
- draft opportunities
- suggest assumptions
- draft discovery content

AI may not:
- validate the problem
- accept a market theme
- approve an experiment
- approve instrumentation
- make the final launch decision
- approve Discovery Criteria
- promote an opportunity automatically

## Portfolio architecture summary

**Evidence**
→ **AI Synthesis**
→ **PM Review**
→ **Market Context**
→ **Discovery**
→ **Formal Opportunity**
→ **Experiment**
→ **Evaluation**
→ **Launch Governance**
→ **Decision History**

The evidence chain remains attached across the workflow.
