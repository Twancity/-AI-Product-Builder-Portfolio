# CareBridge AI — AI Product Principles

## Purpose

CareBridge AI is designed to help recently discharged patients better understand and manage clinician-approved post-discharge instructions.

Because healthcare is a high-consequence environment, the product should use AI selectively. The goal is not to maximize AI autonomy. The goal is to use AI where it improves comprehension and usability while preserving clinical authority, source integrity, and human accountability.

## Core Product Principle

> **Use AI where it creates meaningful value, constrain it where uncertainty creates risk, and preserve human authority where consequences require judgment.**

CareBridge AI may help explain, simplify, organize, and translate approved information. It should not independently diagnose, prescribe, modify treatment, or create new clinical instructions.

## AI Responsibilities

CareBridge AI may:

- Simplify clinician-approved discharge instructions
- Reorganize approved information into clearer steps
- Translate approved content
- Summarize approved information
- Answer questions grounded in authorized source material
- Help patients identify what they need to do next
- Surface approved escalation guidance
- Identify when a question cannot be answered safely and transition to a human contact

These capabilities should be implemented only where AI provides more value than a deterministic software approach.

## Human-Owned Responsibilities

The following decisions should remain human-owned:

- Clinical diagnosis
- Treatment decisions
- Medication changes
- Modification of dosage or frequency
- Changes to clinician-approved care plans
- Interpretation that requires clinical judgment
- Approval of materially changed post-discharge instructions
- Decisions involving ambiguous or conflicting clinical information

CareBridge AI should support these workflows, not replace the responsible clinician or care team.

## Risk-Adjusted Autonomy

The level of AI autonomy should decrease as the consequence of an incorrect output increases.

For example:

- Reformatting approved text may require relatively low oversight.
- Simplifying medical instructions requires stronger grounding and evaluation.
- Medication-related explanations require stricter controls.
- Changes to treatment instructions should not be made autonomously.

This creates a **risk-adjusted autonomy model** in which product controls become more restrictive as potential patient harm increases.

## Source Grounding

AI-generated explanations should remain grounded in approved source material.

Potential sources include:

- Clinician-approved discharge instructions
- Medication instructions
- Follow-up appointment details
- Referral information
- Hospital-approved patient education
- Approved escalation guidance
- Relevant authorized patient-specific context

The model should not fill gaps with assumptions when the approved source does not contain the answer.

## Human-in-the-Loop Design

Human-in-the-loop should be implemented as an explicit product workflow rather than a general statement that a person will review the AI.

The system should define:

- Which human role is responsible
- What condition triggers escalation
- What authority that role has
- What happens while review is pending
- How approved changes are released
- How the event is logged

### Example Change-Control Workflow

Clinician changes an instruction → system detects the change → affected AI-generated content is held → authorized human verifies the change → approved source material is updated → CareBridge uses the updated information → event is logged.

Material clinical changes should not automatically replace patient-facing guidance without verification.

## AI Output Evaluation Framework

Because generative AI is probabilistic, CareBridge AI should not be evaluated solely by whether it produces one exact expected sentence.

Generated outputs should be evaluated across multiple quality dimensions:

### Accuracy

The output preserves the clinical facts contained in the approved source.

### Groundedness

Claims and instructions are supported by the authorized source material.

### Completeness

Clinically material information is not omitted.

### Clarity

The explanation is easier for the patient to understand without changing the underlying meaning.

### Safety

The output does not introduce recommendations, assumptions, or modifications that could create patient harm.

A response can be clear and well written while still failing accuracy, groundedness, completeness, or safety.

## Example Evaluation Principle

Approved source:

> Take Medication X, 10 mg, twice daily for seven days. Do not take more than the prescribed amount.

Acceptable transformation:

> Take 10 mg of Medication X twice each day for seven days. Do not take more than prescribed.

Unsafe transformation:

> Take Medication X twice daily. If your symptoms do not improve, you can increase your dose.

The second response fails because it introduces an unsupported medication change.

This illustrates a key CareBridge rule:

> **Clear does not mean correct.**

## Deterministic vs. Probabilistic Product Design

CareBridge AI should use a hybrid architecture.

### Deterministic Functions

Conventional software should handle tasks requiring predictable behavior, including:

- Authentication
- Authorization
- Patient record retrieval
- Access control
- Display of approved source material
- Scheduled reminders
- Audit logging
- Workflow state management

### Probabilistic Functions

Generative AI may support tasks where natural-language flexibility creates value, including:

- Simplification
- Summarization
- Translation
- Natural-language question interpretation
- Patient-friendly explanations

The product should not use an LLM for a function that conventional software can perform more reliably, safely, predictably, and efficiently.

## Fallback and Escalation

When CareBridge cannot produce a sufficiently grounded or safe response, it should not improvise.

The system should transition to an approved fallback such as:

- Displaying the original clinician-approved instruction
- Recommending that the patient contact their care team
- Routing the question for human review
- Providing approved escalation instructions

## Accountability

AI does not own the clinical or product decision.

Accountability may span:

- Clinical leadership
- Product management
- Engineering
- Security
- Privacy and compliance
- Operations

The organization remains responsible for determining when AI is appropriate, how it is constrained, how failures are detected, and whether the system should continue operating.

## Product Builder Principle

CareBridge AI should be designed as a controlled product system, not simply an LLM interface.

The product architecture should combine deterministic software, probabilistic AI, approved source data, evaluation criteria, escalation mechanisms, access controls, monitoring, and human decision authority.

This principle will guide later CareBridge work across requirements, AI evaluations, governance, IAM, workflow design, and prototype development.
