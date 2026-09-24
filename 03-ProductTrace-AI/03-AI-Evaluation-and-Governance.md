# ProductTrace: AI Evaluation and Governance

## Why evaluation is a product feature

ProductTrace does not treat model output quality as an implementation detail.

The product includes an explicit evaluation layer because PMs need to know whether AI-assisted synthesis is reliable enough to influence product decisions.

## Evaluation design

The ProductTrace evaluation suite contains 20 editable demo cases.

Each case can include:

- Test input
- Expected canonical theme
- Expected grounding behavior
- Notes
- Active/inactive state
- Critical flag

The evaluation workflow records:

- Expected theme
- Actual theme
- Classification result
- Grounding result
- Citation outcome
- Model/integration
- Workflow version
- Timestamp
- Workspace revision

## Governance metrics

### Overall evaluation pass rate
Share of active cases that fully pass required checks.

### Theme classification accuracy
Share of cases assigned to the expected canonical theme.

### Evidence grounding rate
Share of applicable cases with valid supporting evidence.

### Unsupported recommendation rate
Produced recommendations lacking adequate support.

Execution failures are excluded from this quality metric.

### Execution error rate
AI/API/parsing failures.

### Theme label collision rate
Cases where the same produced canonical label spans different expected labels.

This is intentionally **not** presented as semantic duplicate-theme detection.

### Human override rate
Derived from relevant Decision History events, including meaningful PM modification and Accept / Reject / Defer actions.

## Live evaluation history

### Run 1

**Run ID:** `eval-run-1789988725815`  
**Workflow:** `eval-workflow-v2`

| Metric | Result |
| --- | ---: |
| Overall pass rate | 65% |
| Classification accuracy | 70% |
| Evidence grounding | 85% |
| Unsupported recommendation rate | 0% |
| Execution error rate | 0% |
| Theme label collision rate | 20% |
| Critical cases | 4/4 passed |

### What failed

Seven cases did not fully pass.

Root causes:

1. Expected-theme labels did not match several test inputs.
2. The model could generate free-form labels outside the intended taxonomy.
3. Empty citations were schema-valid.
4. Expected-theme information was visible to the model during evaluation.

## Corrective actions

The evaluation workflow was changed to:

- Correct clearly mislabeled demo cases
- Use a controlled canonical taxonomy
- Score canonical labels rather than free-form phrasing
- Remove expected-theme information from model input
- Require grounding where applicable
- Preserve failures rather than silently substitute results
- Version the workflow for reproducibility

Governance thresholds were left unchanged.

## Live evaluation Run 2

**Run ID:** `eval-run-1789990808113`  
**Workflow:** `eval-workflow-v4`

| Metric | Run 1 | Run 2 | Delta |
| --- | ---: | ---: | ---: |
| Overall pass rate | 65% | **95%** | **+30 pts** |
| Classification accuracy | 70% | **95%** | **+25 pts** |
| Evidence grounding | 85% | **100%** | **+15 pts** |
| Unsupported recommendation rate | 0% | **0%** | 0 |
| Execution error rate | 0% | **0%** | 0 |
| Theme label collision rate | 20% | 25% | +5 pts |

Run 2 outcome:
- **19 PASS**
- **1 FAIL**
- **0 ERROR**
- **0 critical failures**
- All 4 critical cases passed

The single remaining noncritical miss was a theme-classification disagreement while grounding remained valid.

## Governance thresholds

The current Launch Gate evaluates the latest completed real run against workspace thresholds including:

- Minimum overall evaluation pass rate
- Minimum grounding rate
- Maximum unsupported recommendation rate
- Maximum critical failures

Run 2 passed all evaluation-related Launch Gate checks.

## Launch governance model

ProductTrace separates:

- **System Calculated** criteria
- **PM Controlled** validation
- **Governance Threshold** criteria
- **Final Human Decision**

The product cannot automatically choose Approve.

When all prerequisites pass, a PM must explicitly record:
- Approve or Hold
- Rationale
- Timestamp

The final launch-decision record is immutable.

## Principle

> AI evaluation should make uncertainty visible, not make the product look better than it is.
