# AI Product Builder Portfolio

A hands-on product management portfolio focused on **AI-enabled products, technical product strategy, product discovery, PRDs, evaluation, governance, experimentation, and roadmap decisions**.

This portfolio is designed to show how I move from a user problem to a defined MVP, make scope and risk tradeoffs, validate acceptance criteria, and sequence future product bets.

## Featured Projects

| Project | Stage | What it demonstrates |
| --- | --- | --- |
| **[Stash](https://github.com/Twancity/item-stash)** | **Working product — V1, V1.1, and V1.2 shipped** ([Live demo](https://stash-home-inventory.lovable.app)) | Problem framing, MVP scoping, PRD development, voice-enabled feature iteration, acceptance testing, product tradeoffs, and roadmap sequencing |
| **[CareBridge AI](02-CareBridge-AI/)** | **Working fictional-data prototype — verified, unpublished** | Responsible AI boundaries, exact-source retrieval, bounded AI evaluation, simulated human escalation, teach-back, product requirements, and governance thinking |
| **[AI Foundations](01-AI-Foundations/01-AI-Fluency.md)** | **Completed learning artifact** | Practical AI fluency and product-management application |

## 1. Stash — Working Product

**Tagline:** *Remember where you put everything.*

Stash is a mobile-first web application that helps people record where household items are stored and retrieve the location later in seconds.

### Product progression

- **V1 — MVP:** Add, search, view, edit, and delete stored items with local persistence.
- **V1.1 — Voice Search:** Added browser-native speech recognition to reduce retrieval friction.
- **V1.2 — Voice Add:** Added a guided voice flow to reduce capture friction while retaining explicit user review before save.

### Product evidence

- **[Live Product](https://stash-home-inventory.lovable.app)**
- **[Repository](https://github.com/Twancity/item-stash)**
- **[Product Requirements Document](https://github.com/Twancity/item-stash/blob/main/PRD.md)**
- **[Product Roadmap](https://github.com/Twancity/item-stash/blob/main/docs/ROADMAP.md)**
- **[Acceptance Testing](https://github.com/Twancity/item-stash/blob/main/docs/TESTING.md)**

The shipped releases were manually validated against defined acceptance criteria: V1 **10/10**, V1.1 **10/10**, and V1.2 **14/14**. These are acceptance-test results, not user-adoption or business-outcome claims.

## 2. CareBridge AI — Responsible AI Product Case Study and Prototype

CareBridge AI began as a concept-stage Patient Discharge Guidance Agent and now includes a working, unpublished portfolio prototype. It helps visitors explore fictional discharge instructions while keeping clinical judgment, real messaging, and real patient data outside the prototype.

### Product artifacts

1. [Problem Discovery](02-CareBridge-AI/01-Problem-Discovery.md)
2. [AI Product Principles](02-CareBridge-AI/02-AI-Product-Principles.md)
3. [AI Output Evaluation](02-CareBridge-AI/03-AI-Output-Evaluation.md)
4. [Visual Product Roadmap](02-CareBridge-AI/04-Product-Roadmap.md)
5. [Product Requirements Document](02-CareBridge-AI/05-Product-Requirements-Document.md)
6. [Working Prototype Source and Documentation](02-CareBridge-AI/prototype/artifacts/carebridge/README.md)
7. [Prototype Case Study](02-CareBridge-AI/prototype/artifacts/carebridge/CASE_STUDY.md)

The implemented prototype demonstrates exact-source retrieval, bounded rule-based Q&A, grounded explanation safeguards, simulated clarification handoff/status, and optional teach-back for one fictional walker instruction. Recorded verification includes **25/25 teach-back**, **23/23 handoff/status**, and **24/24 browser interaction** checks, with the existing Q&A, grounding, and diagnostic/privacy suites passing.

> CareBridge AI uses fictional data only. It is not published or deployed for clinical use, does not contact real clinicians or systems, and does not represent achieved clinical outcomes.

## What This Portfolio Demonstrates

- **Product discovery:** Define the user problem before selecting the solution.
- **MVP discipline:** Separate must-have workflow value from attractive but nonessential features.
- **PRD ownership:** Translate product intent into user stories, functional requirements, acceptance criteria, constraints, and success metrics.
- **Product judgment:** Document tradeoffs and explain why capabilities are included, deferred, or intentionally excluded.
- **Iteration:** Ship a narrow baseline, validate it, and sequence enhancements around specific user friction.
- **AI product thinking:** Define model boundaries, fallback behavior, human escalation, evaluation criteria, and governance controls.
- **Technical fluency:** Work across application architecture, browser capabilities, persistence, AI workflows, and implementation constraints without treating technology as the product strategy.
- **Evidence over claims:** Distinguish completed functionality, manual testing, proposed metrics, and unvalidated hypotheses.

## Portfolio Standard

Every product project is structured around the same core artifacts:

**Problem → Target User → Goal → Non-Goals → MVP → User Stories → Requirements → Acceptance Criteria → Success Metrics → Risks/Constraints → Roadmap**

The objective is not to showcase code volume. It is to demonstrate **product reasoning, execution, and learning** through working products and decision artifacts.

## Current Focus

Future projects will continue expanding the portfolio into **agentic AI, AI evaluation, governance, IAM/identity, workflow automation, and practical product-building** while maintaining the same evidence-based PM standard.
