# ProductTrace — Interview Talking Points

## 30-second description

ProductTrace is an AI-assisted evidence-to-decision system for Product Managers. It connects customer evidence, market research, AI synthesis, structured discovery, experiment design, evaluation, and launch governance while preserving the evidence and human decision history behind each step.

## Why I built it

The problem I wanted to explore was not “How can AI generate more product ideas?”

It was:

**How can AI accelerate product work without removing evidence traceability or PM accountability?**

That led to a system where AI proposes and synthesizes, but humans retain control over validation, prioritization, experimentation, discovery, and launch.

## What makes it different from a generic AI wrapper

Even with AI disabled, ProductTrace still has value through:
- evidence persistence
- decision history
- structured discovery
- opportunity governance
- experiment design
- evaluation thresholds
- launch gates
- auditability

AI is a component of the workflow, not the workflow itself.

## Where AI is used

AI assists with:
- evidence synthesis
- theme detection
- opportunity drafting
- Market Theme synthesis
- Market Opportunity synthesis
- discovery drafting / gap identification
- evaluation

AI does not make the final product decisions.

## Human-in-the-loop controls

Explicit PM decisions exist for:
- opportunity status
- problem validation
- experiment approval
- instrumentation readiness
- final launch approval
- Market Theme disposition
- Market Opportunity disposition
- Discovery decision
- Feature / Value Definition confirmation
- formal opportunity promotion

## How I evaluated the AI

I created a real Eval Center rather than treating a successful demo response as proof.

Run 1:
- 65% overall pass
- 70% classification accuracy
- 85% grounding

I preserved the failed run and analyzed the failures.

The audit found:
- taxonomy mismatch
- bad expected labels
- exact-string scoring problems
- missing citations
- expected-label leakage

After remediation:

Run 2:
- 95% overall pass
- 95% classification accuracy
- 100% grounding
- 0% unsupported recommendations
- 0 critical failures

## What I learned from the failed evaluation

The biggest lesson was that evaluation quality depends as much on the test design as the model.

Some “AI failures” were actually:
- bad labels
- weak taxonomy
- flawed evaluation assumptions

That changed how I think about AI product evaluation.

## Why I preserved failed runs

Because hiding failed runs produces a false product narrative.

The 65% run is part of the portfolio because it shows:
- diagnosis
- iteration
- measurable improvement
- governance maturity

## Instrumentation story

I created a structured instrumentation plan with:
- 9 events
- 5 metric mappings
- assignment / exposure tracking
- product telemetry mappings
- guardrails
- data-quality checks

The prototype synthetic validation suite passed **30 / 30 assertions**.

I explicitly kept that labeled as synthetic validation rather than claiming it proved production telemetry quality.

## Market Intelligence story

I extended ProductTrace from internal evidence to external market evidence.

The workflow became:

**Research Brief → Verified Sources → Competitor Context → Market Themes → Market Opportunity**

Official-source research was captured with source URLs, excerpts, freshness, and provenance.

AI could synthesize themes, but could not promote them without PM decisions.

## Discovery Criteria story

Market Intelligence exposed a gap in my own product architecture.

The system could generate a grounded opportunity, but it could still move too quickly toward execution.

So I added Discovery Criteria between opportunity generation and formal product commitment.

The first live Discovery case ended with:

**More Discovery Needed**

because Root Cause and Value / Impact were still unvalidated.

That outcome is one of the strongest parts of the project because the system correctly refused to turn incomplete discovery into product commitment.

## How I handled hallucination / unsupported claims

Controls include:
- exact evidence IDs
- verbatim excerpt validation
- structured AI output
- unsupported claim rejection
- source-status requirements
- evidence provenance
- preserved original AI text
- deterministic readiness rules
- human approval gates

## Why I avoided an AI priority score

I did not want ProductTrace to hide product judgment behind an opaque number.

Instead it exposes separate dimensions such as:
- impact
- evidence strength
- confidence
- risk
- reversibility
- reach
- strategic alignment

The PM still makes the decision.

## Strong interview takeaway

The core lesson from ProductTrace is:

> The best AI product improvements did not come from adding more AI. They came from adding better evidence requirements, evaluations, provenance, discovery, and human decision boundaries.
