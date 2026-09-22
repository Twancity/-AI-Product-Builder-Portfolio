# AI Product Builder Portfolio

A hands-on product management portfolio focused on **AI-enabled products, technical product strategy, product discovery, PRDs, evaluation, governance, experimentation, and roadmap decisions**.

This portfolio is designed to show how I move from a user problem to a defined MVP, make scope and risk tradeoffs, validate acceptance criteria, and sequence future product bets.

## Featured Projects

| Project | Stage | What it demonstrates |
| --- | --- | --- |
| **[Stash](https://github.com/Twancity/item-stash)** | **Working product — V1, V1.1, and V1.2 shipped** ([Live demo](https://stash-home-inventory.lovable.app)) | Problem framing, MVP scoping, PRD development, voice-enabled feature iteration, acceptance testing, product tradeoffs, and roadmap sequencing |
| **[StudySteps](https://github.com/Twancity/studysteps)** | **Working multimodal AI product — V1 frozen portfolio baseline** | AI product design, multimodal input, human-in-the-loop review, teach-before-answer guardrails, accessibility, product iteration, acceptance testing, and submission tracking |
| **[CareBridge AI](02-CareBridge-AI/)** | **Working fictional-data prototype — verified, unpublished** | Responsible AI boundaries, exact-source retrieval, bounded AI evaluation, simulated human escalation, teach-back, product requirements, and governance thinking |
| **[ProductTrace AI](03-ProductTrace-AI/)** | **Final capstone — development frozen** | Evidence traceability, live AI evaluation, Market Intelligence, structured Discovery Criteria, experiment/launch governance, immutable decision history, and human-in-the-loop AI product management |
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

## 2. StudySteps — Multimodal AI Learning and Planning Product

**Tagline:** *Turn confusing schoolwork into clear next steps.*

StudySteps is a multimodal AI study assistant designed to help students understand schoolwork, work through problems without immediately receiving the answer, explore project directions, build editable plans, and remember what still needs to be turned in.

### Product progression

- **Concept help:** Grade-aware explanations, worked examples, guided practice, hints, answer checking, and explicit answer reveal.
- **Worksheet/problem help:** Photo understanding, editable extraction review, skill identification, method-first guidance, and teach-before-answer controls.
- **Project Launchpad:** **Understand → Explore → Choose → Plan → Build → Track** rather than a generic checklist.
- **Accessibility:** Text, photo, drag-and-drop, voice input, and Read to Me.
- **Done & Due:** Separates work completion from actual submission and retains turned-in work for 30 days before cleanup.

### Product evidence

- **[Repository and Visual Walkthrough](https://github.com/Twancity/studysteps)**
- **[Product Case Study](https://github.com/Twancity/studysteps/blob/main/docs/PRODUCT_CASE_STUDY.md)**
- **[Product Requirements Document](https://github.com/Twancity/studysteps/blob/main/PRD.md)**
- **[Acceptance Testing](https://github.com/Twancity/studysteps/blob/main/docs/TESTING.md)**
- **[AI Guardrails](https://github.com/Twancity/studysteps/blob/main/docs/AI_GUARDRAILS.md)**
- **[Decision Log](https://github.com/Twancity/studysteps/blob/main/docs/DECISION_LOG.md)**
- **[Demo Guide](https://github.com/Twancity/studysteps/blob/main/docs/DEMO_GUIDE.md)**

A key product lesson from V1 was that **technically valid AI output is not the same as useful learning support**. Manual testing exposed generic responses and an early photo-preview-only implementation. Those failures drove the product toward separate concept/problem/project experiences, grounded multimodal input, teach-before-answer, student-controlled answer reveal, and explicit human review.

> StudySteps is a portfolio product build. V1 evidence is limited to implemented functionality, manual acceptance testing, responsive review, API/build checks, and documented product decisions; it does not claim public adoption or measured learning outcomes.

## 3. CareBridge AI — Responsible AI Product Case Study and Prototype

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

## 4. ProductTrace AI — Evidence-to-Decision Product System

**Tagline:** *From customer signal to product decision — with the evidence attached.*

ProductTrace is the portfolio's final major capstone: an AI-assisted product-management system that connects customer evidence, external market research, AI synthesis, structured discovery, experiments, evaluation, and launch decisions while preserving explicit PM authority.

### Capstone evidence

- **[ProductTrace Project Overview](03-ProductTrace-AI/README.md)**
- **[Final Portfolio Case Study](03-ProductTrace-AI/20-Final-Portfolio-Case-Study.md)**
- **[Final Architecture & Workflow](03-ProductTrace-AI/14-Final-Architecture-and-Workflow.md)**
- **[First Live Discovery Case](03-ProductTrace-AI/13-First-Live-Discovery-Case.md)**
- **[Development Freeze](03-ProductTrace-AI/17-Development-Freeze.md)**
- **[2–3 Minute Demo Script](03-ProductTrace-AI/16-Demo-Script.md)**

### Final proof points

- **43/43 API regression tests passed** at development freeze.
- Two genuine live AI evaluation runs are preserved: **65% → 95% overall**, **70% → 95% classification accuracy**, and **85% → 100% evidence grounding**.
- Synthetic instrumentation validation passed **30/30 assertions** while remaining explicitly labeled synthetic rather than production telemetry.
- Market Intelligence added **12 verified external sources**, **3 competitor profiles**, **3 Market Themes**, and **1 grounded Market Opportunity**.
- The first live Discovery Criteria case ended **More Discovery Needed** because Root Cause and Value/Impact were still unvalidated.
- Final engineering audit found **no high- or medium-severity defects**.

The project intentionally preserves failed evaluations, assumptions, governance blocks, and incomplete discovery rather than manufacturing a perfect product narrative.

> ProductTrace is a portfolio prototype and development is now frozen. Its evidence demonstrates implemented workflow behavior, live AI evaluation, governance, market-research provenance, and structured discovery; it does not claim market adoption, production telemetry, or validated business outcomes.

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

ProductTrace is now **development frozen** as the final major capstone build. Current learning is shifting toward the **Anthropic course**, personally testing the existing portfolio products, and building smaller Lovable experiments that apply new AI concepts without turning every lesson into another large platform.
