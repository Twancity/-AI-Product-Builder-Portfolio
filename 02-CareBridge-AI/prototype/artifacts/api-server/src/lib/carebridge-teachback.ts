import { createHash, randomUUID } from "node:crypto";
import { ProviderFailure, type ProviderDiagnostic } from "./carebridge-explanation";
import { getCareBridgeSource, type CareBridgeSource } from "./carebridge-source";

export type TeachBackFactState = "supported" | "missing" | "contradicted";
export type TeachBackOutcome =
  | "complete"
  | "incomplete"
  | "unclear"
  | "contradictory"
  | "provider_error"
  | "source_mismatch";
export type TeachBackAssessmentSource =
  | "fixed_safety_rules"
  | "simulated_provider"
  | "gemini_live";

export interface TeachBackProviderOutput {
  standing: TeachBackFactState;
  walking: TeachBackFactState;
  clearance: TeachBackFactState;
  confidence: "high" | "low";
}

export interface TeachBackProvider {
  assess(input: {
    answer: string;
    exactInstruction: string;
  }): Promise<TeachBackProviderOutput>;
}

interface TeachBackAuditEvent {
  timestamp: string;
  outcome: TeachBackOutcome;
  comprehensionAttempt: number;
  providerAttempts: number;
  sourceReference: string;
  sourceVersion: string;
  assessmentSource: TeachBackAssessmentSource;
}

export interface TeachBackResult {
  activityId: string;
  patientId: string;
  sectionId: string;
  sourceVersion: string;
  originalInstruction: string;
  outcome: TeachBackOutcome;
  feedback: string;
  comprehensionAttempts: number;
  retryAvailable: boolean;
  handoffAvailable: boolean;
  providerAttempts: number;
  assessmentSource: TeachBackAssessmentSource;
  liveModelVerified: boolean;
  updatedAt: string;
  audit: TeachBackAuditEvent[];
  retentionNotice: string;
}

interface StoredActivity {
  sessionId: string;
  result: TeachBackResult;
  idempotencyKeys: Set<string>;
}

interface IdempotentEntry {
  patientId: string;
  sectionId: string;
  sourceVersion: string;
  answerDigest: string;
  result: TeachBackResult;
}

const MAX_SESSIONS = 100;
const MAX_ACTIVITIES_PER_SESSION = 20;
const MAX_OBSERVED_SCOPES = MAX_SESSIONS * MAX_ACTIVITIES_PER_SESSION;
const RETENTION_NOTICE =
  "Teach-back history stores only bounded outcome, attempt, timestamp, and source-reference data for this tab session in the running prototype. Raw responses are not retained; history is cleared by eviction or app restart.";
const activities = new Map<string, StoredActivity>();
const sessionActivityKeys = new Map<string, string[]>();
const sessionOrder: string[] = [];
const idempotentResults = new Map<string, IdempotentEntry>();
const observedScopes = new Map<string, true>();

function sourceReference(source: CareBridgeSource): string {
  return `${source.documentTitle} — ${source.sectionTitle}`;
}

function activityKey(
  sessionId: string,
  patientId: string,
  sectionId: string,
  sourceVersion: string,
): string {
  return `${sessionId}:${patientId}:${sectionId}:${sourceVersion}`;
}

function idempotencyMapKey(sessionId: string, key: string): string {
  return `${sessionId}:${key}`;
}

function answerDigest(answer: string): string {
  return createHash("sha256").update(answer).digest("hex");
}

function appendActivity(sessionId: string, key: string): void {
  const sessionIndex = sessionOrder.indexOf(sessionId);
  if (sessionIndex >= 0) sessionOrder.splice(sessionIndex, 1);
  sessionOrder.unshift(sessionId);

  while (sessionOrder.length > MAX_SESSIONS) {
    const removedSession = sessionOrder.pop();
    if (!removedSession) break;
    for (const removedKey of sessionActivityKeys.get(removedSession) ?? []) {
      const removed = activities.get(removedKey);
      if (removed) {
        for (const idempotencyKey of removed.idempotencyKeys) {
          idempotentResults.delete(idempotencyKey);
        }
      }
      activities.delete(removedKey);
      observedScopes.delete(removedKey);
    }
    sessionActivityKeys.delete(removedSession);
  }

  const keys = sessionActivityKeys.get(sessionId) ?? [];
  if (!keys.includes(key)) keys.unshift(key);
  while (keys.length > MAX_ACTIVITIES_PER_SESSION) {
    const removedKey = keys.pop();
    if (!removedKey) continue;
    const removed = activities.get(removedKey);
    if (removed) {
      for (const idempotencyKey of removed.idempotencyKeys) {
        idempotentResults.delete(idempotencyKey);
      }
    }
    activities.delete(removedKey);
    observedScopes.delete(removedKey);
  }
  sessionActivityKeys.set(sessionId, keys);
}

function fixedContradiction(answer: string): boolean {
  return [
    /\b(ignore|disregard|forget|bypass|override|jailbreak)\b.{0,55}\b(previous|prior|above|system|prompt|rule|instruction|safeguard)s?\b/i,
    /\b(output|return|respond|label|classify|mark|say)\b.{0,35}\b(supported|complete|pass|matches)\b/i,
    /\b(needn['’]?t|need not|don['’]?t need|do not need|doesn['’]?t need|does not need|don['’]?t have to|do not have to|doesn['’]?t have to|not required|no need|optional|unnecessary)\b.{0,55}\b(walker|walking aid|walking frame)\b/i,
    /\b(walker|walking aid|walking frame)\b.{0,55}\b(needn['’]?t|need not|don['’]?t need|do not need|doesn['’]?t need|does not need|don['’]?t have to|do not have to|doesn['’]?t have to|not required|no need|optional|unnecessary|becomes? (?:a )?choice)\b/i,
    /\b(don['’]?t|do not|doesn['’]?t|does not|won['’]?t|will not)\b.{0,25}\b(use|take|bring)\b.{0,25}\b(walker|walking aid|walking frame)\b/i,
    /\b(go|walk|stand|move|get around)\b.{0,30}\bwithout\b.{0,30}\b(walker|walking aid|walking frame)\b/i,
    /\b(leave|skip|stop|quit|discontinue|drop)\b.{0,35}\b(walker|walking aid|walking frame)\b/i,
    /\b(walker|walking aid|walking frame)\b.{0,35}\b(skip|stop|quit|discontinue|drop)\b/i,
    /\b(before|without)\b.{0,35}\b(clear|cleared|clearance|physical therapy|physio|pt)\b/i,
    /\b(only|just)\b.{0,20}\b(standing|walking|on my feet|moving around)\b/i,
    /\b(for|after|until)\s+(?:a|one|two|three|\d+)\s+(?:hour|day|week|month)s?\b/i,
    /\b(through|until|after|by)\s+(?:next\s+)?(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|weekend|tomorrow)\b/i,
    /\b(once|when|if)\b.{0,40}\b(feel|seem|am|become)\b.{0,25}\b(steady|better|safe|ready|strong)\b.{0,45}\b(choice|optional|without|stop|quit|done)\b/i,
    /\b(replace|swap|substitute|trade)\b.{0,35}\b(walker|walking aid|walking frame|cane|crutches)\b/i,
    /\b(cane|crutches)\b.{0,25}\b(instead of|rather than|replace)\b.{0,25}\b(walker|walking aid|walking frame)\b/i,
    /\b(therapist|doctor|provider|clinician|physio|physical therapy|pt)\b.{0,35}\b(changed|switched|moved)\b.{0,20}\b(?:me\s+)?to\b.{0,20}\b(cane|crutches)\b/i,
    /\b(change|increase|decrease|stop taking|start taking)\b.{0,30}\b(dose|medication|medicine)\b/i,
    /\b(diagnos|treatment change|clinically approved|doctor approved|cleared myself)\b/i,
  ].some((pattern) => pattern.test(answer));
}

function feedbackFor(
  outcome: TeachBackOutcome,
  output: TeachBackProviderOutput | null,
  source: CareBridgeSource,
): string {
  if (outcome === "complete") {
    return "That matches the demo instruction: use the walker whenever standing and whenever walking, until physical therapy clears you. This limited check is not proof of real understanding, adherence, or clinical readiness.";
  }
  if (outcome === "incomplete" && output) {
    const missing: string[] = [];
    if (output.standing !== "supported") {
      missing.push("use it whenever standing");
    }
    if (output.walking !== "supported") {
      missing.push("use it whenever walking");
    }
    if (output.clearance !== "supported") {
      missing.push("continue until cleared by physical therapy");
    }
    return `Almost. The stored instruction also says to ${missing.join(", and ")}. Try once more using only the original instruction shown below.`;
  }
  if (outcome === "unclear") {
    return "I could not confidently establish the meaning of that response. Please try once more using only the original instruction shown below.";
  }
  if (outcome === "contradictory") {
    return "That response conflicts with or adds to the stored instruction, so it cannot pass this limited check. Use only the original instruction shown below.";
  }
  if (outcome === "source_mismatch") {
    return "The selected source version no longer matches this activity. No comprehension result was recorded. Reopen the current original instruction.";
  }
  return `Feedback is temporarily unavailable. No comprehension attempt was consumed. The original remains: "${source.exactInstruction}"`;
}

function outcomeFromProvider(output: TeachBackProviderOutput): TeachBackOutcome {
  if (
    output.standing === "contradicted" ||
    output.walking === "contradicted" ||
    output.clearance === "contradicted"
  ) {
    return "contradictory";
  }
  if (output.confidence === "low") return "unclear";
  if (
    output.standing === "supported" &&
    output.walking === "supported" &&
    output.clearance === "supported"
  ) {
    return "complete";
  }
  return "incomplete";
}

function makeResult(input: {
  prior?: TeachBackResult;
  source: CareBridgeSource;
  outcome: TeachBackOutcome;
  feedback: string;
  comprehensionAttempts: number;
  providerAttempts: number;
  assessmentSource: TeachBackAssessmentSource;
  liveModelVerified: boolean;
}): TeachBackResult {
  const now = new Date().toISOString();
  const event: TeachBackAuditEvent = {
    timestamp: now,
    outcome: input.outcome,
    comprehensionAttempt: input.comprehensionAttempts,
    providerAttempts: input.providerAttempts,
    sourceReference: sourceReference(input.source),
    sourceVersion: input.source.version,
    assessmentSource: input.assessmentSource,
  };
  return {
    activityId: input.prior?.activityId ?? `DEMO-TB-${randomUUID().slice(0, 8).toUpperCase()}`,
    patientId: input.source.patientId,
    sectionId: input.source.sectionId,
    sourceVersion: input.source.version,
    originalInstruction: input.source.exactInstruction,
    outcome: input.outcome,
    feedback: input.feedback,
    comprehensionAttempts: input.comprehensionAttempts,
    retryAvailable:
      input.outcome !== "complete" && input.comprehensionAttempts < 2,
    handoffAvailable: input.outcome !== "complete",
    providerAttempts: input.providerAttempts,
    assessmentSource: input.assessmentSource,
    liveModelVerified: input.liveModelVerified,
    updatedAt: now,
    audit: [...(input.prior?.audit ?? []), event],
    retentionNotice: RETENTION_NOTICE,
  };
}

export async function createTeachBackAssessment(
  input: {
    sessionId: string;
    idempotencyKey: string;
    patientId: string;
    sectionId: string;
    sourceVersion: string;
    answer: string;
  },
  options: {
    apiKeyPresent: boolean;
    model: string | undefined;
    provider?: TeachBackProvider;
    assessmentSource?: "simulated_provider" | "gemini_live";
    maxProviderAttempts?: number;
    onDiagnostic?: (diagnostic: ProviderDiagnostic) => void;
  },
): Promise<TeachBackResult> {
  const answer = input.answer.trim();
  if (!answer) throw new Error("INVALID_ANSWER");
  if (answer.length > 300) throw new Error("ANSWER_TOO_LONG");

  const source = getCareBridgeSource(input.patientId, input.sectionId);
  if (!source) throw new Error("UNSUPPORTED_SOURCE");
  const key = activityKey(
    input.sessionId,
    input.patientId,
    input.sectionId,
    input.sourceVersion,
  );
  const mapKey = idempotencyMapKey(input.sessionId, input.idempotencyKey);
  const digest = answerDigest(answer);
  const cached = idempotentResults.get(mapKey);
  if (cached) {
    if (
      cached.patientId !== input.patientId ||
      cached.sectionId !== input.sectionId ||
      cached.sourceVersion !== input.sourceVersion ||
      cached.answerDigest !== digest
    ) {
      throw new Error("IDEMPOTENCY_SCOPE_MISMATCH");
    }
    return cached.result;
  }

  const stored = activities.get(key);
  const prior = stored?.result;
  if (source.version !== input.sourceVersion) {
    return makeResult({
      prior,
      source,
      outcome: "source_mismatch",
      feedback: feedbackFor("source_mismatch", null, source),
      comprehensionAttempts: prior?.comprehensionAttempts ?? 0,
      providerAttempts: 0,
      assessmentSource: "fixed_safety_rules",
      liveModelVerified: false,
    });
  }
  if (prior?.outcome === "complete") throw new Error("ACTIVITY_ALREADY_COMPLETE");
  if ((prior?.comprehensionAttempts ?? 0) >= 2) {
    throw new Error("COMPREHENSION_LIMIT_REACHED");
  }

  let result: TeachBackResult;
  if (fixedContradiction(answer)) {
    const comprehensionAttempts = (prior?.comprehensionAttempts ?? 0) + 1;
    result = makeResult({
      prior,
      source,
      outcome: "contradictory",
      feedback: feedbackFor("contradictory", null, source),
      comprehensionAttempts,
      providerAttempts: 0,
      assessmentSource: "fixed_safety_rules",
      liveModelVerified: false,
    });
  } else if (!options.apiKeyPresent || !options.model?.trim() || !options.provider) {
    result = makeResult({
      prior,
      source,
      outcome: "provider_error",
      feedback: feedbackFor("provider_error", null, source),
      comprehensionAttempts: prior?.comprehensionAttempts ?? 0,
      providerAttempts: 0,
      assessmentSource: options.assessmentSource ?? "gemini_live",
      liveModelVerified: false,
    });
  } else {
    const maxProviderAttempts = Math.min(
      Math.max(options.maxProviderAttempts ?? 2, 1),
      2,
    );
    let providerAttempts = 0;
    try {
      let output: TeachBackProviderOutput | undefined;
      while (!output && providerAttempts < maxProviderAttempts) {
        providerAttempts += 1;
        try {
          output = await options.provider.assess({
            answer,
            exactInstruction: source.exactInstruction,
          });
        } catch (error) {
          const failure =
            error instanceof ProviderFailure
              ? error
              : new ProviderFailure(
                  "provider_error",
                  false,
                  "Unexpected provider failure",
                );
          options.onDiagnostic?.({
            ...failure.diagnostic,
            attempt: providerAttempts,
          });
          if (!failure.retryable || providerAttempts >= maxProviderAttempts) {
            throw failure;
          }
        }
      }
      if (!output) throw new Error("MISSING_PROVIDER_OUTPUT");
      const outcome = outcomeFromProvider(output);
      const comprehensionAttempts = (prior?.comprehensionAttempts ?? 0) + 1;
      result = makeResult({
        prior,
        source,
        outcome,
        feedback: feedbackFor(outcome, output, source),
        comprehensionAttempts,
        providerAttempts,
        assessmentSource: options.assessmentSource ?? "simulated_provider",
        liveModelVerified: options.assessmentSource === "gemini_live",
      });
    } catch {
      result = makeResult({
        prior,
        source,
        outcome: "provider_error",
        feedback: feedbackFor("provider_error", null, source),
        comprehensionAttempts: prior?.comprehensionAttempts ?? 0,
        providerAttempts,
        assessmentSource: options.assessmentSource ?? "gemini_live",
        liveModelVerified: false,
      });
    }
  }

  const activity =
    stored ??
    ({
      sessionId: input.sessionId,
      result,
      idempotencyKeys: new Set<string>(),
    } satisfies StoredActivity);
  activity.result = result;
  activity.idempotencyKeys.add(mapKey);
  activities.set(key, activity);
  appendActivity(input.sessionId, key);
  idempotentResults.set(mapKey, {
    patientId: input.patientId,
    sectionId: input.sectionId,
    sourceVersion: input.sourceVersion,
    answerDigest: digest,
    result,
  });
  return result;
}

export function getTeachBackState(input: {
  sessionId: string;
  patientId: string;
  sectionId: string;
  sourceVersion: string;
}): { activity: TeachBackResult | null; retentionNotice: string } {
  const key = activityKey(
    input.sessionId,
    input.patientId,
    input.sectionId,
    input.sourceVersion,
  );
  const stored = activities.get(key);
  const source = getCareBridgeSource(input.patientId, input.sectionId);
  if (source?.version === input.sourceVersion) {
    observedScopes.delete(key);
    observedScopes.set(key, true);
    while (observedScopes.size > MAX_OBSERVED_SCOPES) {
      const oldest = observedScopes.keys().next().value;
      if (typeof oldest !== "string") break;
      observedScopes.delete(oldest);
    }
  }
  if (!stored || stored.sessionId !== input.sessionId) {
    return { activity: null, retentionNotice: RETENTION_NOTICE };
  }
  return { activity: stored.result, retentionNotice: RETENTION_NOTICE };
}

export function isTeachBackHandoffEligible(input: {
  sessionId: string;
  patientId: string;
  sectionId: string;
  sourceVersion: string;
}): boolean {
  const key = activityKey(
    input.sessionId,
    input.patientId,
    input.sectionId,
    input.sourceVersion,
  );
  if (!observedScopes.has(key)) return false;
  const activity = activities.get(key)?.result;
  return activity?.outcome !== "complete";
}