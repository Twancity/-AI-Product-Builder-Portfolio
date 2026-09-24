# ProductTrace: 2 to 3 Minute Demo Script

## Opening

ProductTrace is an AI-assisted evidence-to-decision system for Product Managers.

The problem I wanted to solve was not simply generating product ideas with AI. It was making sure a product decision could be traced back to the evidence that justified it.

## Evidence and AI synthesis

I start in the Evidence Inbox, where customer and product signals are stored.

ProductTrace uses live AI to identify themes, but every generated result keeps its supporting evidence IDs and exact excerpts attached.

The AI can propose an opportunity, but it cannot approve one.

## PM governance

In the Opportunity Board, the Product Manager can Accept, Modify, Reject, or Defer.

The original AI wording stays immutable, while the PM rationale is stored separately.

That distinction is important because I wanted the system to preserve what AI proposed versus what a human actually decided.

## Evaluation

I built a real Eval Center rather than relying on a demo response.

The first live evaluation scored 65%.

Instead of hiding that result, I audited the failures, corrected taxonomy problems, removed expected-label leakage, and strengthened grounding requirements.

The second run reached 95% overall pass with 100% grounding.

## Experiment and launch governance

Accepted opportunities can move into experiment design.

ProductTrace tracks success metrics, guardrails, instrumentation, and evaluation thresholds.

A Launch Gate prevents final approval until the required criteria pass.

The final V1 approval is an explicit PM action and creates an immutable snapshot.

## Market Intelligence

I later expanded ProductTrace to combine internal evidence with external market evidence.

Official sources are captured with URLs, excerpts, freshness, and provenance.

AI can generate Market Themes, but the PM still decides whether those themes should influence opportunity discovery.

## Discovery Criteria

The most important later addition was Discovery Criteria.

I realized that even a grounded opportunity should not automatically become product work.

The workflow now asks:
- Is the problem clear?
- Is the user clear?
- Is the impact validated?
- What assumptions remain?
- How will we measure or learn?
- What would invalidate the opportunity?

In the first real test, ProductTrace stopped the opportunity and recorded **More Discovery Needed** because Root Cause and Value / Impact were still unvalidated.

That is intentional.

## Close

The product principle is:

**AI proposes. Evidence supports. Discovery reduces uncertainty. The Product Manager decides.**

ProductTrace demonstrates not just how AI can accelerate product work, but how to govern AI-assisted product decisions responsibly.
