# ProductTrace: Instrumentation Plan

## Purpose

ProductTrace uses instrumentation readiness as a Launch Gate dependency so an experiment cannot be considered launch-ready merely because a hypothesis and metrics have been written down.

This plan documents how the current resumable-upload experiment would be measured.

> This is a portfolio prototype instrumentation design. ProductTrace does not currently ingest live production upload telemetry.

## Experiment

**Experiment:** Release resumable uploads to 25% of eligible workspaces for 21 days.

**Hypothesis:** If interrupted uploads can resume automatically, enterprise teams will complete more imports without support.

## Primary metric

**Successful upload completion rate**

Planned calculation:

Completed logical uploads / started logical uploads

Required safeguards:
- stable upload identity
- no duplicate denominator entries on retry or resume
- variant assignment retained across upload lifecycle

## Secondary metrics

### Median time to complete upload

Requires:
- upload_started
- upload_completed
- duration or timestamp calculation

### Upload-related support tickets

Source type:
**External/manual**

ProductTrace does not currently instrument support-ticket systems directly.

## Guardrail metrics

### Duplicate record rate

Measures whether retry/resume behavior creates duplicate imports.

### Processing error rate

Measures whether resumable-upload behavior increases backend processing failures.

## Planned events

### experiment_assigned
Required properties:
- workspace_id
- experiment_id
- variant

### experiment_exposed
Required properties:
- workspace_id
- experiment_id
- variant
- exposure_timestamp

### upload_started
Required properties:
- workspace_id
- experiment_id
- variant
- upload_id
- file_size_mb
- start_timestamp

### upload_resumed
Required properties:
- workspace_id
- experiment_id
- variant
- upload_id
- file_size_mb
- resumed
- retry_count

### upload_completed
Required properties:
- workspace_id
- experiment_id
- variant
- upload_id
- file_size_mb
- completion_timestamp
- duration_ms
- resumed
- retry_count

### upload_failed
Required properties:
- workspace_id
- experiment_id
- variant
- upload_id
- file_size_mb
- failure_reason
- duration_ms
- retry_count

### upload_retry_attempted
Required properties:
- workspace_id
- experiment_id
- variant
- upload_id
- file_size_mb
- retry_count

Optional:
- failure_reason

### duplicate_import_detected
Required properties:
- workspace_id
- experiment_id
- variant
- upload_id
- file_size_mb
- duplicate_detected
- retry_count

### processing_error
Required properties:
- workspace_id
- experiment_id
- variant
- upload_id
- file_size_mb
- processing_error_type

Optional:
- failure_reason

## Baseline status

The experiment references an **81% upload completion baseline**.

Current status:

**Unverified demo assumption**

This value is:
- not measured ProductTrace telemetry
- not derived from a connected analytics system
- not independently verified

It is retained only to illustrate experiment planning and Launch Gate governance in the portfolio prototype.

Before a production launch decision, the baseline must be replaced with a measured value from a documented source.

## Required data-quality checks

ProductTrace requires validation of:

1. Assignment integrity
2. Upload identity continuity
3. Event ordering
4. Event deduplication
5. Variant coverage

These checks should only be marked complete when supported by controlled prototype/test evidence.

## Synthetic validation approach

A controlled synthetic validation suite is being added to ProductTrace to test the instrumentation design without pretending synthetic results are production telemetry.

The validation suite is intended to verify:

- one stable experiment variant per workspace
- assignment before exposure
- stable upload_id across retry/resume
- valid lifecycle event order
- nonnegative durations
- duplicate-event handling
- no metric inflation from replay
- control/treatment segmentation
- primary and guardrail metric computability

## Governance rule

Instrumentation readiness may become **Ready** only when:

- required events are defined
- required properties are defined
- experiment assignment/exposure tracking is defined
- primary metric mapping is complete
- guardrail mappings are complete
- baseline status is documented
- external/manual sources are identified
- data-quality checks are complete
- PM explicitly approves instrumentation readiness

ProductTrace does not auto-approve instrumentation.

## Current status

- Plan status: Draft
- Telemetry status: Planned only
- PM instrumentation approval: Not yet provided
- Synthetic validation suite: **Completed**
- Validation result: **PASS: 30/30 assertions, zero violations**
- Validation report: [Instrumentation Validation](07-Instrumentation-Validation.md)
- Launch Gate dependency: Open, pending explicit PM acceptance of the unverified demo baseline and PM instrumentation approval

## Product principle

> A defined metric is not the same as a measurable metric, and a measurable metric is not the same as observed production evidence.
