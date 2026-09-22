# ProductTrace — Product Roadmap

## Current objective

Complete the ProductTrace V1 evidence-to-decision workflow with explicit human governance, then expand into Market Intelligence.

## Phase 1 — Core evidence-to-decision workflow

### Status: Completed

Capabilities:
- Evidence Inbox
- Persistent evidence
- Live AI Analysis
- Theme generation
- Evidence traceability
- Opportunity Board
- Accept / Modify / Reject / Defer
- Prioritization inputs
- Experiment Builder
- Decision History

## Phase 2 — AI quality and governance

### Status: Completed / V1 checkpoint

Capabilities:
- Real Eval Center
- 20-case test suite
- Critical cases
- Classification accuracy
- Grounding rate
- Unsupported recommendation rate
- Execution error rate
- Theme label collision rate
- Human override rate
- Configurable thresholds
- Evaluation run history
- Workflow versioning
- Immutable evaluation runs
- Launch Gate
- Immutable final launch-decision model

Latest measured result:
- 95% overall pass
- 95% classification accuracy
- 100% grounding
- 0 execution errors
- 0 unsupported recommendations
- 0 critical failures

## Phase 2.5 — Instrumentation readiness

### Status: Completed

Goal:
Ensure ProductTrace can distinguish a defined experiment from a measurable experiment.

Planned/implemented Instrumentation Plan concepts:
- Experiment assignment
- Experiment exposure
- Upload started
- Upload resumed
- Upload completed
- Upload failed
- Upload retry attempted
- Duplicate import detected
- Processing error

Metric mapping:
- Successful upload completion rate
- Median upload completion time
- Upload-related support contacts
- Duplicate record rate
- Processing error rate

Readiness should require:
- Required events defined
- Required properties defined
- Primary metric mapping complete
- Guardrail mappings complete
- Exposure tracking defined
- Baseline status documented
- External/manual data sources identified
- Explicit PM approval

## Phase 3 — Market Intelligence

### Status: Next major build after completed V1 portfolio checkpoint

Goal:
Combine internal customer evidence with external market evidence.

Planned workflow:

**Research Brief → Market Sources → Competitors → Market Signals → Competitive Analysis → Product Opportunity**

Capabilities:
- Research brief
- Market/segment definition
- Competitor profiles
- Source collection
- Source URLs
- Publication/capture dates
- External evidence excerpts
- Market-signal themes
- Competitive feature comparison
- Positioning comparison
- Market freshness
- Internal + external evidence synthesis
- Market-supported opportunities

Core principle:

> Every market insight must trace back to a source.

## Phase 4 — Portfolio polish

Planned:
- Final ProductTrace case study
- Screenshots
- Architecture diagram
- User journey
- System workflow
- Demo script
- Interview talking points
- GitHub cleanup
- Final V1 release notes

## Deferred

Not required for the current portfolio MVP:
- Authentication
- Billing
- Multi-user collaboration
- Production analytics integration
- Jira integration
- Zendesk integration
- Productboard integration
- Slack ingestion
- Production-scale data architecture


## Future Upgrade — Discovery Criteria

### Status: Deferred / future enhancement

Purpose:
Create a structured intake and discovery framework for new client or product ideas before they become formal opportunities.

Potential workflow:

**Idea Intake → Discovery Criteria → Evidence Needed → Validation Questions → Discovery Decision**

Possible criteria:
- Who is the user or client?
- What problem is being observed?
- What evidence currently exists?
- How frequently does the problem occur?
- What is the user/business impact?
- Who is affected?
- What assumptions are being made?
- What evidence is still missing?
- Is this a customer problem, internal request, market opportunity, or solution idea?
- What discovery method should be used next?
- What would invalidate the idea?
- What decision should the discovery work enable?

Product principle:

> An idea should not become a product commitment before the problem and evidence have been examined.

This feature is intentionally deferred until after Market Intelligence so the current V1-to-V2 scope remains controlled.


## Portfolio Build Status

**Development frozen — September 22, 2026**

ProductTrace is complete as the final major portfolio build. Future activity should focus on:
- real user-led research
- research finding entry
- evidence-based iteration
- bug fixes discovered during use
- portfolio presentation polish

No additional major feature phase is planned.
