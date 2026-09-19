import assert from "node:assert/strict";
import {
  createOrRetryHandoff,
  listHandoffs,
  updateHandoffStatus,
} from "../src/lib/carebridge-handoff";
import { getTeachBackState } from "../src/lib/carebridge-teachback";

let passed = 0;
async function check(name: string, run: () => void | Promise<void>) {
  await run();
  passed += 1;
  console.log(`PASS ${name}`);
}

const question = "How should I use stairs?";

await check("confirmed delivery requires queue ID and confirmation", () => {
  const result = createOrRetryHandoff({
    sessionId: "session-delivered",
    idempotencyKey: "delivery-key-1",
    patientId: "p1",
    question,
    demoScenario: "delivered",
  });
  assert.equal(result.deliveryConfirmed, true);
  assert.match(result.queueRequestId ?? "", /^DEMO-Q-/);
  assert.equal(result.message, "Delivered to demo review queue.");
  assert.match(result.noRealClinicianNotice, /Demo request delivered/);
  assert.doesNotMatch(result.noRealClinicianNotice, /No request was sent/);
  assert.equal(result.reviewStatus, "awaiting_review");
  assert.equal(result.sourceVersion, "v1.0.4");
  assert.match(result.noRealClinicianNotice, /No real clinician has been contacted/);
  assert.equal(result.audit.at(-1)?.status, "delivered");
});

await check("repeated submission is idempotent", () => {
  const input = {
    sessionId: "session-repeat",
    idempotencyKey: "repeat-key-1",
    patientId: "p1",
    question,
    demoScenario: "delivered" as const,
  };
  const first = createOrRetryHandoff(input);
  const repeated = createOrRetryHandoff(input);
  assert.equal(repeated.reviewRequestId, first.reviewRequestId);
  assert.equal(repeated.attemptId, first.attemptId);
  assert.equal(repeated.queueRequestId, first.queueRequestId);
  assert.equal(repeated.audit.length, first.audit.length);
});

await check("failed delivery has no success state and shows alternative guidance", () => {
  const result = createOrRetryHandoff({
    sessionId: "session-failed",
    idempotencyKey: "failed-key-1",
    patientId: "p1",
    question,
    demoScenario: "failed",
  });
  assert.equal(result.deliveryConfirmed, false);
  assert.equal(result.queueRequestId, null);
  assert.match(result.message, /Delivery was not confirmed/);
  assert.match(result.alternativeGuidance, /not configured/i);
  assert.equal(result.retryable, true);
});

await check("failed request can retry once without duplicating the logical request", () => {
  const failed = createOrRetryHandoff({
    sessionId: "session-failed-retry",
    idempotencyKey: "failed-retry-key-1",
    patientId: "p1",
    question,
    demoScenario: "failed",
  });
  const delivered = createOrRetryHandoff({
    sessionId: "session-failed-retry",
    idempotencyKey: "failed-retry-key-2",
    patientId: "p1",
    question,
    demoScenario: "delivered",
    reviewRequestId: failed.reviewRequestId,
  });
  assert.equal(delivered.reviewRequestId, failed.reviewRequestId);
  assert.notEqual(delivered.attemptId, failed.attemptId);
  assert.equal(delivered.attempts, 2);
  assert.equal(delivered.deliveryConfirmed, true);
});

await check("unconfirmed acceptance reuses queue request ID on retry", () => {
  const unconfirmed = createOrRetryHandoff({
    sessionId: "session-unconfirmed",
    idempotencyKey: "unconfirmed-key-1",
    patientId: "p1",
    question,
    demoScenario: "unconfirmed",
  });
  assert.equal(unconfirmed.deliveryConfirmed, false);
  assert.match(unconfirmed.queueRequestId ?? "", /^DEMO-Q-/);
  const delivered = createOrRetryHandoff({
    sessionId: "session-unconfirmed",
    idempotencyKey: "unconfirmed-key-2",
    patientId: "p1",
    question,
    demoScenario: "delivered",
    reviewRequestId: unconfirmed.reviewRequestId,
  });
  assert.equal(delivered.queueRequestId, unconfirmed.queueRequestId);
  assert.match(
    delivered.audit.map((event) => event.reason).join(" "),
    /no duplicate created/i,
  );
});

await check("two-attempt bound rejects a third attempt", () => {
  const first = createOrRetryHandoff({
    sessionId: "session-limit",
    idempotencyKey: "limit-key-1",
    patientId: "p1",
    question,
    demoScenario: "failed",
  });
  createOrRetryHandoff({
    sessionId: "session-limit",
    idempotencyKey: "limit-key-2",
    patientId: "p1",
    question,
    demoScenario: "failed",
    reviewRequestId: first.reviewRequestId,
  });
  assert.throws(
    () =>
      createOrRetryHandoff({
        sessionId: "session-limit",
        idempotencyKey: "limit-key-3",
        patientId: "p1",
        question,
        demoScenario: "delivered",
        reviewRequestId: first.reviewRequestId,
      }),
    /RETRY_LIMIT_REACHED/,
  );
});

await check("history is isolated by session and fictional patient", () => {
  createOrRetryHandoff({
    sessionId: "session-isolation",
    idempotencyKey: "isolation-key-1",
    patientId: "p1",
    question,
    demoScenario: "delivered",
  });
  createOrRetryHandoff({
    sessionId: "session-isolation",
    idempotencyKey: "isolation-key-2",
    patientId: "p2",
    question: "The follow-up guidance is unclear.",
    demoScenario: "failed",
  });
  assert.equal(listHandoffs("session-isolation", "p1").items.length, 1);
  assert.equal(listHandoffs("session-isolation", "p2").items.length, 1);
  assert.equal(listHandoffs("other-session", "p1").items.length, 0);
});

await check("treatment changes retain a precise stop reason", () => {
  const result = createOrRetryHandoff({
    sessionId: "session-treatment",
    idempotencyKey: "treatment-key-1",
    patientId: "p1",
    question: "Can I change my medication dose?",
    demoScenario: "failed",
  });
  assert.equal(result.stopReason, "diagnosis_or_treatment_change");
  assert.match(result.evidenceNote, /must not provide/);
});

await check("supported questions are ineligible on the server", () => {
  assert.throws(
    () =>
      createOrRetryHandoff({
        sessionId: "session-supported",
        idempotencyKey: "supported-key-1",
        patientId: "p1",
        question: "When should I use my walker?",
        demoScenario: "delivered",
      }),
    /HANDOFF_NOT_ELIGIBLE/,
  );
});

await check("idempotency keys cannot cross patient or payload scope", () => {
  createOrRetryHandoff({
    sessionId: "session-scope",
    idempotencyKey: "scope-key-1",
    patientId: "p1",
    question,
    demoScenario: "failed",
  });
  assert.throws(
    () =>
      createOrRetryHandoff({
        sessionId: "session-scope",
        idempotencyKey: "scope-key-1",
        patientId: "p2",
        question: "The follow-up guidance is unclear.",
        demoScenario: "failed",
      }),
    /IDEMPOTENCY_SCOPE_MISMATCH/,
  );
});

await check("bounded session history evicts stale idempotency entries", () => {
  let oldest:
    | ReturnType<typeof createOrRetryHandoff>
    | undefined;
  for (let index = 0; index < 21; index += 1) {
    const result = createOrRetryHandoff({
      sessionId: "session-bounded",
      idempotencyKey: `bounded-key-${index}`,
      patientId: "p1",
      question,
      demoScenario: "failed",
    });
    if (index === 0) oldest = result;
  }
  assert.equal(listHandoffs("session-bounded", "p1").items.length, 20);
  const recreated = createOrRetryHandoff({
    sessionId: "session-bounded",
    idempotencyKey: "bounded-key-0",
    patientId: "p1",
    question,
    demoScenario: "failed",
  });
  assert.notEqual(recreated.reviewRequestId, oldest?.reviewRequestId);
});

await check("review acknowledgement is manual and distinct from delivery", () => {
  const delivered = createOrRetryHandoff({
    sessionId: "session-ack",
    idempotencyKey: "ack-delivery-key",
    patientId: "p1",
    question,
    demoScenario: "delivered",
  });
  const acknowledged = updateHandoffStatus({
    reviewRequestId: delivered.reviewRequestId,
    sessionId: "session-ack",
    patientId: "p1",
    idempotencyKey: "ack-status-key",
    action: "acknowledge",
  });
  assert.equal(acknowledged.reviewStatus, "acknowledged");
  assert.equal(acknowledged.demoResponse, null);
  assert.equal(acknowledged.audit.at(-1)?.status, "reviewer_acknowledged");
});

await check("response cannot appear before acknowledgement", () => {
  const delivered = createOrRetryHandoff({
    sessionId: "session-invalid-transition",
    idempotencyKey: "invalid-delivery-key",
    patientId: "p1",
    question,
    demoScenario: "delivered",
  });
  assert.throws(
    () =>
      updateHandoffStatus({
        reviewRequestId: delivered.reviewRequestId,
        sessionId: "session-invalid-transition",
        patientId: "p1",
        idempotencyKey: "invalid-status-key",
        action: "make_response_available",
        responseFixture: "current",
      }),
    /INVALID_REVIEW_TRANSITION/,
  );
});

await check("current-version authored response preserves the original plan", () => {
  const delivered = createOrRetryHandoff({
    sessionId: "session-current-response",
    idempotencyKey: "current-delivery-key",
    patientId: "p1",
    question,
    demoScenario: "delivered",
  });
  const acknowledged = updateHandoffStatus({
    reviewRequestId: delivered.reviewRequestId,
    sessionId: "session-current-response",
    patientId: "p1",
    idempotencyKey: "current-ack-key",
    action: "acknowledge",
  });
  const responded = updateHandoffStatus({
    reviewRequestId: acknowledged.reviewRequestId,
    sessionId: "session-current-response",
    patientId: "p1",
    idempotencyKey: "current-response-key",
    action: "make_response_available",
    responseFixture: "current",
  });
  assert.equal(responded.reviewStatus, "response_available");
  assert.equal(responded.demoResponse?.sourceVersion, "v1.0.4");
  assert.match(responded.demoResponse?.text ?? "", /plan remains unchanged/i);
  assert.match(responded.demoResponse?.approvalLabel ?? "", /not clinically approved/i);
  assert.equal(responded.audit.at(-1)?.status, "response_available");
});

await check("superseded response fixture requires clarification", () => {
  const delivered = createOrRetryHandoff({
    sessionId: "session-superseded",
    idempotencyKey: "superseded-delivery-key",
    patientId: "p1",
    question,
    demoScenario: "delivered",
  });
  updateHandoffStatus({
    reviewRequestId: delivered.reviewRequestId,
    sessionId: "session-superseded",
    patientId: "p1",
    idempotencyKey: "superseded-ack-key",
    action: "acknowledge",
  });
  const result = updateHandoffStatus({
    reviewRequestId: delivered.reviewRequestId,
    sessionId: "session-superseded",
    patientId: "p1",
    idempotencyKey: "superseded-response-key",
    action: "make_response_available",
    responseFixture: "superseded",
  });
  assert.equal(result.reviewStatus, "clarification_required");
  assert.equal(result.demoResponse, null);
  assert.match(
    result.audit.at(-1)?.reason ?? "",
    /fixture source v1\.0\.3 did not match current source v1\.0\.4/i,
  );
});

await check("unverified response fixture requires clarification", () => {
  const delivered = createOrRetryHandoff({
    sessionId: "session-unverified-response",
    idempotencyKey: "unverified-delivery-key",
    patientId: "p1",
    question,
    demoScenario: "delivered",
  });
  updateHandoffStatus({
    reviewRequestId: delivered.reviewRequestId,
    sessionId: "session-unverified-response",
    patientId: "p1",
    idempotencyKey: "unverified-ack-key",
    action: "acknowledge",
  });
  const result = updateHandoffStatus({
    reviewRequestId: delivered.reviewRequestId,
    sessionId: "session-unverified-response",
    patientId: "p1",
    idempotencyKey: "unverified-response-key",
    action: "make_response_available",
    responseFixture: "unverified",
  });
  assert.equal(result.reviewStatus, "clarification_required");
  assert.equal(result.demoResponse, null);
  assert.match(result.nextAction, /Clarification is required/);
});

await check("failed or unconfirmed delivery cannot be acknowledged", () => {
  const failed = createOrRetryHandoff({
    sessionId: "session-no-ack",
    idempotencyKey: "no-ack-delivery-key",
    patientId: "p1",
    question,
    demoScenario: "failed",
  });
  assert.throws(
    () =>
      updateHandoffStatus({
        reviewRequestId: failed.reviewRequestId,
        sessionId: "session-no-ack",
        patientId: "p1",
        idempotencyKey: "no-ack-status-key",
        action: "acknowledge",
      }),
    /DELIVERY_NOT_CONFIRMED/,
  );
});

await check("teach-back confusion can use the existing simulated handoff", () => {
  getTeachBackState({
    sessionId: "session-teachback-handoff",
    patientId: "p1",
    sectionId: "mobility",
    sourceVersion: "v1.0.4",
  });
  const result = createOrRetryHandoff({
    sessionId: "session-teachback-handoff",
    idempotencyKey: "teachback-handoff-key",
    patientId: "p1",
    question:
      "Teach-back clarification requested for the walker instruction.",
    demoScenario: "delivered",
    origin: "teach_back_confusion",
    sectionId: "mobility",
    sourceVersion: "v1.0.4",
  });
  assert.equal(result.deliveryConfirmed, true);
  assert.equal(result.reviewStatus, "awaiting_review");
  assert.match(result.evidenceNote, /teach-back activity/i);
  assert.match(result.noRealClinicianNotice, /No real clinician has been contacted/i);
});

await check("teach-back handoff rejects a stale source version", () => {
  assert.throws(
    () =>
      createOrRetryHandoff({
        sessionId: "session-teachback-stale",
        idempotencyKey: "teachback-stale-key",
        patientId: "p1",
        question:
          "Teach-back clarification requested for the walker instruction.",
        demoScenario: "delivered",
        origin: "teach_back_confusion",
        sectionId: "mobility",
        sourceVersion: "v1.0.3",
      }),
    /HANDOFF_SOURCE_MISMATCH/,
  );
});

await check("teach-back handoff requires a server-observed current source", () => {
  assert.throws(
    () =>
      createOrRetryHandoff({
        sessionId: "session-teachback-unobserved",
        idempotencyKey: "teachback-unobserved-key",
        patientId: "p1",
        question:
          "Teach-back clarification requested for the walker instruction.",
        demoScenario: "delivered",
        origin: "teach_back_confusion",
        sectionId: "mobility",
        sourceVersion: "v1.0.4",
      }),
    /HANDOFF_NOT_ELIGIBLE/,
  );
});

await check("teach-back handoff requires explicit source binding", () => {
  assert.throws(
    () =>
      createOrRetryHandoff({
        sessionId: "session-teachback-missing-source",
        idempotencyKey: "teachback-missing-source-key",
        patientId: "p1",
        question:
          "Teach-back clarification requested for the walker instruction.",
        demoScenario: "delivered",
        origin: "teach_back_confusion",
      }),
    /HANDOFF_SOURCE_REQUIRED/,
  );
});

await check("teach-back retry cannot change its stored origin", () => {
  const sessionId = "session-teachback-origin-retry";
  getTeachBackState({
    sessionId,
    patientId: "p1",
    sectionId: "mobility",
    sourceVersion: "v1.0.4",
  });
  const first = createOrRetryHandoff({
    sessionId,
    idempotencyKey: "teachback-origin-first",
    patientId: "p1",
    question:
      "Teach-back clarification requested for the walker instruction.",
    demoScenario: "failed",
    origin: "teach_back_confusion",
    sectionId: "mobility",
    sourceVersion: "v1.0.4",
  });
  assert.throws(
    () =>
      createOrRetryHandoff({
        sessionId,
        idempotencyKey: "teachback-origin-retry",
        patientId: "p1",
        question:
          "Teach-back clarification requested for the walker instruction.",
        demoScenario: "delivered",
        reviewRequestId: first.reviewRequestId,
        origin: "unsupported_question",
        sectionId: "mobility",
        sourceVersion: "v1.0.4",
      }),
    /REQUEST_SCOPE_MISMATCH/,
  );
});

await check("teach-back retry cannot change its stored source binding", () => {
  const sessionId = "session-teachback-source-retry";
  getTeachBackState({
    sessionId,
    patientId: "p1",
    sectionId: "mobility",
    sourceVersion: "v1.0.4",
  });
  const first = createOrRetryHandoff({
    sessionId,
    idempotencyKey: "teachback-source-first",
    patientId: "p1",
    question:
      "Teach-back clarification requested for the walker instruction.",
    demoScenario: "failed",
    origin: "teach_back_confusion",
    sectionId: "mobility",
    sourceVersion: "v1.0.4",
  });
  assert.throws(
    () =>
      createOrRetryHandoff({
        sessionId,
        idempotencyKey: "teachback-source-retry",
        patientId: "p1",
        question:
          "Teach-back clarification requested for the walker instruction.",
        demoScenario: "delivered",
        reviewRequestId: first.reviewRequestId,
        origin: "teach_back_confusion",
        sectionId: "medications",
        sourceVersion: "v1.0.3",
      }),
    /REQUEST_SCOPE_MISMATCH/,
  );
});

console.log(`PASS ${passed}/${passed} simulated-handoff checks`);