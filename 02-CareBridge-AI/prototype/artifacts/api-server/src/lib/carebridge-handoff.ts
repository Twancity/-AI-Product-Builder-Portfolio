import { randomUUID } from "node:crypto";
import { isSupportedCareBridgeQuestion } from "./carebridge-explanation";
import { getCareBridgeSource } from "./carebridge-source";
import { isTeachBackHandoffEligible } from "./carebridge-teachback";

export type DemoScenario = "delivered" | "failed" | "unconfirmed";
export type StopReason =
  | "missing_guidance"
  | "ambiguous_guidance"
  | "conflicting_guidance"
  | "diagnosis_or_treatment_change";

interface HandoffInput {
  sessionId: string;
  idempotencyKey: string;
  patientId: string;
  question: string;
  demoScenario: DemoScenario;
  reviewRequestId?: string | null;
  origin?: "unsupported_question" | "teach_back_confusion";
  sectionId?: string | null;
  sourceVersion?: string | null;
}

interface AuditEvent {
  timestamp: string;
  status:
    | "attempted"
    | "accepted"
    | "delivered"
    | "failed"
    | "unconfirmed"
    | "reviewer_acknowledged"
    | "response_available"
    | "clarification_required";
  reason: string;
  attemptId: string;
  sourceReference: string;
  sourceVersion: string;
}

export interface HandoffResult {
  reviewRequestId: string;
  attemptId: string;
  queueRequestId: string | null;
  destination: string;
  status: DemoScenario;
  deliveryConfirmed: boolean;
  message: string;
  noRealClinicianNotice: string;
  alternativeGuidance: string;
  retryable: boolean;
  attempts: number;
  stopReason: StopReason;
  question: string;
  patientName: string;
  sourceReference: string;
  sourceVersion: string;
  evidenceNote: string;
  createdAt: string;
  updatedAt: string;
  reviewStatus:
    | "delivery_not_confirmed"
    | "awaiting_review"
    | "acknowledged"
    | "response_available"
    | "clarification_required";
  nextAction: string;
  demoResponse: {
    text: string;
    approvalLabel: string;
    sourceVersion: string;
    applicabilityStatus: "current";
    notice: string;
  } | null;
  responseFixtureVersion: string | null;
  responseApplicability: "not_requested" | "current" | "superseded" | "unverified";
  audit: AuditEvent[];
}

interface StoredRequest {
  sessionId: string;
  patientId: string;
  origin: "unsupported_question" | "teach_back_confusion";
  sectionId: string | null;
  sourceVersion: string | null;
  result: HandoffResult;
  idempotencyKeys: Set<string>;
  statusIdempotencyKeys: Set<string>;
}

interface IdempotentEntry {
  patientId: string;
  question: string;
  demoScenario: DemoScenario;
  reviewRequestId: string | null;
  origin: "unsupported_question" | "teach_back_confusion";
  sectionId: string | null;
  sourceVersion: string | null;
  result: HandoffResult;
}

const DESTINATION = "Simulated CareBridge review queue";
const NO_REAL_CLINICIAN =
  "Simulation only. No real clinician has been contacted. Delivery does not mean reviewed, answered, or clinically resolved.";
const RETENTION_NOTICE =
  "Demo history is accessible only with this tab's session ID and this running prototype. Closing the tab removes browser access; bounded server memory is cleared by eviction or app restart.";
const MAX_REQUESTS_PER_SESSION = 20;
const MAX_SESSIONS = 100;

const requests = new Map<string, StoredRequest>();
const idempotentResults = new Map<string, IdempotentEntry>();
const sessionRequestIds = new Map<string, string[]>();
const sessionOrder: string[] = [];
const statusIdempotentResults = new Map<
  string,
  {
    reviewRequestId: string;
    patientId: string;
    action: "acknowledge" | "make_response_available";
    responseFixture: "current" | "superseded" | "unverified" | null;
    result: HandoffResult;
  }
>();

const patients = {
  p1: {
    patientName: "John Doe (Fictional)",
    sourceReference:
      "Post-Operative Hip Replacement Discharge Plan — relevant synthetic plan evidence",
    sourceVersion: "v1.0.4",
  },
  p2: {
    patientName: "Jane Smith (Fictional)",
    sourceReference:
      "Cardiac Observation Discharge Summary — relevant synthetic plan evidence",
    sourceVersion: "v2.1.0",
  },
} as const;

const authoredResponseFixtures = {
  p1: {
    current: { sourceVersion: "v1.0.4" },
    superseded: { sourceVersion: "v1.0.3" },
    unverified: { sourceVersion: null },
  },
  p2: {
    current: { sourceVersion: "v2.1.0" },
    superseded: { sourceVersion: "v2.0.0" },
    unverified: { sourceVersion: null },
  },
} as const;

function noticeForReviewStatus(
  reviewStatus: HandoffResult["reviewStatus"],
): string {
  if (reviewStatus === "awaiting_review") {
    return `Demo request delivered and awaiting simulated review. ${NO_REAL_CLINICIAN}`;
  }
  if (reviewStatus === "acknowledged") {
    return `Demo request delivered and manually acknowledged by a simulated reviewer. ${NO_REAL_CLINICIAN}`;
  }
  if (reviewStatus === "response_available") {
    return `Demo request delivered and an illustrative authored response is available. ${NO_REAL_CLINICIAN}`;
  }
  if (reviewStatus === "clarification_required") {
    return `Demo request delivered, but the illustrative response requires source clarification. ${NO_REAL_CLINICIAN}`;
  }
  return `Demo delivery was not confirmed. ${NO_REAL_CLINICIAN}`;
}

function classifyStopReason(question: string): StopReason {
  if (
    /\b(diagnos|dose|medication|medicine|treatment|stop taking|stop using|safe to)\b/i.test(
      question,
    )
  ) {
    return "diagnosis_or_treatment_change";
  }
  if (/\b(conflict|contradict|different instructions|which instruction)\b/i.test(question)) {
    return "conflicting_guidance";
  }
  if (/\b(ambiguous|unclear|not sure what|what does this mean)\b/i.test(question)) {
    return "ambiguous_guidance";
  }
  return "missing_guidance";
}

function evidenceNote(reason: StopReason): string {
  if (reason === "missing_guidance") {
    return "The selected fictional plan does not contain evidence that answers this question.";
  }
  if (reason === "ambiguous_guidance") {
    return "The relevant fictional guidance is not specific enough to answer safely.";
  }
  if (reason === "conflicting_guidance") {
    return "The fictional plan contains or describes conflicting guidance that requires review.";
  }
  return "The question requests diagnosis or a treatment change that this educational prototype must not provide.";
}

function alternativeGuidance(): string {
  return "Illustrative and nonfunctional: alternative contact guidance is not configured in this fictional plan.";
}

function makeId(prefix: string): string {
  return `${prefix}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

function idempotencyMapKey(sessionId: string, key: string): string {
  return `${sessionId}:${key}`;
}

function appendSessionRequest(sessionId: string, reviewRequestId: string): void {
  const existingSessionIndex = sessionOrder.indexOf(sessionId);
  if (existingSessionIndex >= 0) sessionOrder.splice(existingSessionIndex, 1);
  sessionOrder.unshift(sessionId);
  while (sessionOrder.length > MAX_SESSIONS) {
    const removedSessionId = sessionOrder.pop();
    if (!removedSessionId) break;
    for (const id of sessionRequestIds.get(removedSessionId) ?? []) {
      const removed = requests.get(id);
      if (removed) {
        for (const key of removed.idempotencyKeys) idempotentResults.delete(key);
        for (const key of removed.statusIdempotencyKeys) {
          statusIdempotentResults.delete(key);
        }
      }
      requests.delete(id);
    }
    sessionRequestIds.delete(removedSessionId);
  }

  const ids = sessionRequestIds.get(sessionId) ?? [];
  if (!ids.includes(reviewRequestId)) ids.unshift(reviewRequestId);
  while (ids.length > MAX_REQUESTS_PER_SESSION) {
    const removed = ids.pop();
    if (removed) {
      const removedRequest = requests.get(removed);
      if (removedRequest) {
        for (const key of removedRequest.idempotencyKeys) {
          idempotentResults.delete(key);
        }
        for (const key of removedRequest.statusIdempotencyKeys) {
          statusIdempotentResults.delete(key);
        }
      }
      requests.delete(removed);
    }
  }
  sessionRequestIds.set(sessionId, ids);
}

export function createOrRetryHandoff(input: HandoffInput): HandoffResult {
  const patient = patients[input.patientId as keyof typeof patients];
  if (!patient) throw new Error("UNKNOWN_PATIENT");
  const prior = input.reviewRequestId
    ? requests.get(input.reviewRequestId)
    : undefined;
  if (
    prior &&
    (prior.sessionId !== input.sessionId || prior.patientId !== input.patientId)
  ) {
    throw new Error("REQUEST_SCOPE_MISMATCH");
  }
  if (input.reviewRequestId && !prior) throw new Error("REQUEST_NOT_FOUND");
  if (
    prior &&
    ((input.origin !== undefined && input.origin !== prior.origin) ||
      (input.sectionId !== undefined && input.sectionId !== prior.sectionId) ||
      (input.sourceVersion !== undefined &&
        input.sourceVersion !== prior.sourceVersion))
  ) {
    throw new Error("REQUEST_SCOPE_MISMATCH");
  }
  const origin = prior?.origin ?? input.origin ?? "unsupported_question";
  const boundSectionId = prior?.sectionId ?? input.sectionId ?? null;
  const boundSourceVersion =
    prior?.sourceVersion ?? input.sourceVersion ?? null;
  if (origin === "teach_back_confusion") {
    if (!boundSectionId || !boundSourceVersion) {
      throw new Error("HANDOFF_SOURCE_REQUIRED");
    }
    const source = getCareBridgeSource(input.patientId, boundSectionId);
    if (
      !source ||
      source.version !== boundSourceVersion
    ) {
      throw new Error("HANDOFF_SOURCE_MISMATCH");
    }
    if (
      !isTeachBackHandoffEligible({
        sessionId: input.sessionId,
        patientId: input.patientId,
        sectionId: boundSectionId,
        sourceVersion: boundSourceVersion,
      })
    ) {
      throw new Error("HANDOFF_NOT_ELIGIBLE");
    }
  } else if (
    isSupportedCareBridgeQuestion(
      input.patientId,
      "mobility",
      input.question,
    )
  ) {
    throw new Error("HANDOFF_NOT_ELIGIBLE");
  }

  const mapKey = idempotencyMapKey(input.sessionId, input.idempotencyKey);
  const existingIdempotent = idempotentResults.get(mapKey);
  if (existingIdempotent) {
    if (
      existingIdempotent.patientId !== input.patientId ||
      existingIdempotent.question !== input.question ||
      existingIdempotent.demoScenario !== input.demoScenario ||
      existingIdempotent.reviewRequestId !== (input.reviewRequestId ?? null) ||
      existingIdempotent.origin !== origin ||
      existingIdempotent.sectionId !== boundSectionId ||
      existingIdempotent.sourceVersion !== boundSourceVersion
    ) {
      throw new Error("IDEMPOTENCY_SCOPE_MISMATCH");
    }
    return existingIdempotent.result;
  }

  if (prior && prior.result.attempts >= 2) throw new Error("RETRY_LIMIT_REACHED");
  if (prior?.result.deliveryConfirmed) return prior.result;

  const now = new Date().toISOString();
  const attemptId = makeId("DEMO-ATT");
  const reviewRequestId = prior?.result.reviewRequestId ?? makeId("DEMO-RVW");
  const stopReason =
    prior?.result.stopReason ??
    (origin === "teach_back_confusion"
      ? "ambiguous_guidance"
      : classifyStopReason(input.question));
  const sourceReference = patient.sourceReference;
  const sourceVersion = patient.sourceVersion;
  const audit: AuditEvent[] = [
    ...(prior?.result.audit ?? []),
    {
      timestamp: now,
      status: "attempted",
      reason: prior ? "Manual retry started" : "Demo review request submitted",
      attemptId,
      sourceReference,
      sourceVersion,
    },
  ];

  let queueRequestId = prior?.result.queueRequestId ?? null;
  let message: string;
  if (input.demoScenario !== "failed") {
    queueRequestId ??= makeId("DEMO-Q");
    audit.push({
      timestamp: now,
      status: "accepted",
      reason: prior?.result.queueRequestId
        ? "Existing queue request located; no duplicate created"
        : "Simulated queue accepted the request",
      attemptId,
      sourceReference,
      sourceVersion,
    });
  }

  if (input.demoScenario === "delivered") {
    message = "Delivered to demo review queue.";
    audit.push({
      timestamp: now,
      status: "delivered",
      reason: "Receiving queue returned explicit delivery confirmation",
      attemptId,
      sourceReference,
      sourceVersion,
    });
  } else if (input.demoScenario === "unconfirmed") {
    message =
      "Delivery was not confirmed. The simulated queue accepted the request but no delivery acknowledgement was received.";
    audit.push({
      timestamp: now,
      status: "unconfirmed",
      reason: "Queue acceptance did not include delivery confirmation",
      attemptId,
      sourceReference,
      sourceVersion,
    });
  } else {
    message =
      "Delivery was not confirmed. The simulated receiving queue reported a delivery failure.";
    audit.push({
      timestamp: now,
      status: "failed",
      reason: prior?.result.queueRequestId
        ? "Delivery confirmation retry failed; existing queue request was not duplicated"
        : "Simulated queue delivery failed before acceptance",
      attemptId,
      sourceReference,
      sourceVersion,
    });
  }

  const attempts = (prior?.result.attempts ?? 0) + 1;
  const result: HandoffResult = {
    reviewRequestId,
    attemptId,
    queueRequestId,
    destination: DESTINATION,
    status: input.demoScenario,
    deliveryConfirmed: input.demoScenario === "delivered" && Boolean(queueRequestId),
    message,
    noRealClinicianNotice: noticeForReviewStatus(
      input.demoScenario === "delivered"
        ? "awaiting_review"
        : "delivery_not_confirmed",
    ),
    alternativeGuidance: alternativeGuidance(),
    retryable: input.demoScenario !== "delivered" && attempts < 2,
    attempts,
    stopReason,
    question: prior?.result.question ?? input.question,
    patientName: patient.patientName,
    sourceReference,
    sourceVersion,
    evidenceNote:
      prior?.result.evidenceNote ??
      (origin === "teach_back_confusion"
        ? "The visitor requested simulated clarification after the bounded teach-back activity. This does not indicate clinical review or resolution."
        : evidenceNote(stopReason)),
    createdAt: prior?.result.createdAt ?? now,
    updatedAt: now,
    reviewStatus:
      input.demoScenario === "delivered"
        ? "awaiting_review"
        : "delivery_not_confirmed",
    nextAction:
      input.demoScenario === "delivered"
        ? "Await simulated reviewer acknowledgement or use the manual demo acknowledgement control."
        : attempts < 2
          ? "Retry demo delivery or use the illustrative alternative guidance."
          : "Use the illustrative alternative guidance; no further demo retries are available.",
    demoResponse: null,
    responseFixtureVersion: null,
    responseApplicability: "not_requested",
    audit,
  };

  const stored = prior ?? {
    sessionId: input.sessionId,
    patientId: input.patientId,
    origin,
    sectionId: boundSectionId,
    sourceVersion: boundSourceVersion,
    result,
    idempotencyKeys: new Set<string>(),
    statusIdempotencyKeys: new Set<string>(),
  };
  stored.result = result;
  stored.idempotencyKeys.add(mapKey);
  requests.set(reviewRequestId, stored);
  appendSessionRequest(input.sessionId, reviewRequestId);
  idempotentResults.set(mapKey, {
    patientId: input.patientId,
    question: input.question,
    demoScenario: input.demoScenario,
    reviewRequestId: input.reviewRequestId ?? null,
    origin,
    sectionId: boundSectionId,
    sourceVersion: boundSourceVersion,
    result,
  });
  return result;
}

export function listHandoffs(sessionId: string, patientId: string) {
  const items = (sessionRequestIds.get(sessionId) ?? [])
    .map((id) => requests.get(id))
    .filter(
      (entry): entry is StoredRequest =>
        Boolean(entry) &&
        entry?.sessionId === sessionId &&
        entry.patientId === patientId,
    )
    .map((entry) => entry.result);
  return { items, retentionNotice: RETENTION_NOTICE };
}

export function updateHandoffStatus(input: {
  reviewRequestId: string;
  sessionId: string;
  patientId: string;
  idempotencyKey: string;
  action: "acknowledge" | "make_response_available";
  responseFixture?: "current" | "superseded" | "unverified" | null;
}): HandoffResult {
  const stored = requests.get(input.reviewRequestId);
  if (
    !stored ||
    stored.sessionId !== input.sessionId ||
    stored.patientId !== input.patientId
  ) {
    throw new Error("REQUEST_SCOPE_MISMATCH");
  }

  const mapKey = idempotencyMapKey(input.sessionId, input.idempotencyKey);
  const cached = statusIdempotentResults.get(mapKey);
  if (cached) {
    if (
      cached.reviewRequestId !== input.reviewRequestId ||
      cached.patientId !== input.patientId ||
      cached.action !== input.action ||
      cached.responseFixture !== (input.responseFixture ?? null)
    ) {
      throw new Error("IDEMPOTENCY_SCOPE_MISMATCH");
    }
    return cached.result;
  }

  const current = stored.result;
  if (!current.deliveryConfirmed || current.reviewStatus === "delivery_not_confirmed") {
    throw new Error("DELIVERY_NOT_CONFIRMED");
  }

  const now = new Date().toISOString();
  const audit = [...current.audit];
  let result: HandoffResult;

  if (input.action === "acknowledge") {
    if (current.reviewStatus !== "awaiting_review") {
      throw new Error("INVALID_REVIEW_TRANSITION");
    }
    audit.push({
      timestamp: now,
      status: "reviewer_acknowledged",
      reason: "Manual demo control recorded reviewer acknowledgement",
      attemptId: current.attemptId,
      sourceReference: current.sourceReference,
      sourceVersion: current.sourceVersion,
    });
    result = {
      ...current,
      updatedAt: now,
      reviewStatus: "acknowledged",
      noRealClinicianNotice: noticeForReviewStatus("acknowledged"),
      nextAction:
        "Await a response or use the manual demo response-availability control.",
      audit,
    };
  } else {
    if (current.reviewStatus !== "acknowledged") {
      throw new Error("INVALID_REVIEW_TRANSITION");
    }
    const fixture = input.responseFixture;
    if (!fixture) throw new Error("RESPONSE_FIXTURE_REQUIRED");

    const authoredFixture =
      authoredResponseFixtures[input.patientId as keyof typeof authoredResponseFixtures][fixture];
    const applicability =
      authoredFixture.sourceVersion === null
        ? "unverified"
        : authoredFixture.sourceVersion === current.sourceVersion
          ? "current"
          : "superseded";

    if (applicability === "current") {
      audit.push({
        timestamp: now,
        status: "response_available",
        reason:
          "Fixed authored demo response matched the current synthetic source version",
        attemptId: current.attemptId,
        sourceReference: current.sourceReference,
        sourceVersion: current.sourceVersion,
      });
      result = {
        ...current,
        updatedAt: now,
        reviewStatus: "response_available",
        noRealClinicianNotice: noticeForReviewStatus("response_available"),
        nextAction:
          "Read the illustrative response and continue following the unchanged original synthetic plan.",
        demoResponse: {
          text: "The original synthetic discharge plan remains unchanged. This illustrative response adds no clearance, diagnosis, treatment change, or new activity advice.",
          approvalLabel: "Authored demo fixture — not clinically approved",
          sourceVersion: authoredFixture.sourceVersion ?? current.sourceVersion,
          applicabilityStatus: "current",
          notice:
            "Illustrative only. No real clinician authored or approved this response, and the original instruction was not overwritten.",
        },
        responseFixtureVersion: authoredFixture.sourceVersion,
        responseApplicability: "current",
        audit,
      };
    } else {
      audit.push({
        timestamp: now,
        status: "clarification_required",
        reason:
          applicability === "superseded"
            ? `Authored demo fixture source ${authoredFixture.sourceVersion} did not match current source ${current.sourceVersion}`
            : `Authored demo fixture source was unverified against current source ${current.sourceVersion}`,
        attemptId: current.attemptId,
        sourceReference: current.sourceReference,
        sourceVersion: current.sourceVersion,
      });
      result = {
        ...current,
        updatedAt: now,
        reviewStatus: "clarification_required",
        noRealClinicianNotice: noticeForReviewStatus("clarification_required"),
        nextAction:
          "Clarification is required. Continue using the unchanged current synthetic plan and the illustrative fallback guidance.",
        demoResponse: null,
        responseFixtureVersion: authoredFixture.sourceVersion,
        responseApplicability: applicability,
        audit,
      };
    }
  }

  stored.result = result;
  stored.statusIdempotencyKeys.add(mapKey);
  statusIdempotentResults.set(mapKey, {
    reviewRequestId: input.reviewRequestId,
    patientId: input.patientId,
    action: input.action,
    responseFixture: input.responseFixture ?? null,
    result,
  });
  return result;
}