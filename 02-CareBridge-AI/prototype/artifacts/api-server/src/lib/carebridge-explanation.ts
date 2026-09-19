import {
  getCareBridgeSource,
  type CareBridgeSource,
} from "./carebridge-source";

const UNSUPPORTED_MESSAGE =
  "The demo instructions cannot answer this question. Clinical clarification would be needed.";
const HANDOFF_NOTICE = "No request was sent. No clinical team was notified.";
const SUPPORTED_QUESTIONS = new Set([
  "do i need to use my walker",
  "when should i use my walker",
  "should i use my walker",
  "walker instructions",
  "how often should i use the walker",
  "use walker",
  "when to use walker",
  "do i have to use the walker",
  "do i have to use my walker",
]);
const UNSAFE_PATTERNS = [
  /stop using/i,
  /change.*dose/i,
  /diagnos/i,
  /override/i,
  /ignore/i,
  /stop taking/i,
  /more medication/i,
  /less medication/i,
  /is it safe to/i,
  /can i stop/i,
  /stairs/i,
];

export type ExplanationCode =
  | "explanation_ready"
  | "missing_credentials"
  | "model_not_configured"
  | "unsupported_request"
  | "authentication_error"
  | "timeout"
  | "rate_limited"
  | "malformed_response"
  | "source_mismatch"
  | "unsupported_addition"
  | "provider_error";

export interface ExplanationResult {
  status: "success" | "not_configured" | "unsupported" | "error";
  code: ExplanationCode;
  message: string;
  explanation: string | null;
  source: ReturnType<typeof toEvidence> | null;
  retryable: boolean;
  attempts: number;
  provider: "gemini_user_key";
  liveModelVerified: boolean;
  handoffNotice: string;
}

export interface ProviderOutput {
  explanation: string;
  preservedFacts: string[];
  unsupportedAdditions: string[];
}

export interface ExplanationProvider {
  explain(input: {
    question: string;
    exactInstruction: string;
  }): Promise<ProviderOutput>;
}

export type ProviderDiagnosticCategory =
  | "invalid_request"
  | "model_access"
  | "authentication"
  | "quota_exhausted"
  | "rate_limited"
  | "transient_failure"
  | "timeout"
  | "rejected_model_output"
  | "provider_failure";

export interface ProviderDiagnostic {
  category: ProviderDiagnosticCategory;
  httpStatus?: number;
  reason?: string;
  summary: string;
  attempt?: number;
}

export class ProviderFailure extends Error {
  constructor(
    readonly code:
      | "authentication_error"
      | "timeout"
      | "rate_limited"
      | "malformed_response"
      | "provider_error",
    readonly retryable: boolean,
    message: string,
    readonly diagnostic: ProviderDiagnostic = {
      category: "provider_failure",
      summary: "Provider request failed",
    },
  ) {
    super(message);
  }
}

function normalizeQuestion(question: string): string {
  return question
    .toLowerCase()
    .trim()
    .replace(/[.,?!'"]/g, "")
    .replace(/\s+/g, " ");
}

function isSupportedQuestion(question: string): boolean {
  const normalized = normalizeQuestion(question);
  return (
    !UNSAFE_PATTERNS.some((pattern) => pattern.test(normalized)) &&
    SUPPORTED_QUESTIONS.has(normalized)
  );
}

export function isSupportedCareBridgeQuestion(
  patientId: string,
  sectionId: string,
  question: string,
): boolean {
  return Boolean(getCareBridgeSource(patientId, sectionId)) && isSupportedQuestion(question);
}

function toEvidence(source: CareBridgeSource) {
  return {
    patientName: source.patientName,
    documentTitle: source.documentTitle,
    sectionTitle: source.sectionTitle,
    version: source.version,
    simulatedApprovalDate: source.simulatedApprovalDate,
    exactInstruction: source.exactInstruction,
    sourceType: "synthetic_demo_source" as const,
  };
}

function baseResult(
  overrides: Pick<ExplanationResult, "status" | "code" | "message"> &
    Partial<ExplanationResult>,
): ExplanationResult {
  return {
    status: overrides.status,
    code: overrides.code,
    message: overrides.message,
    explanation: overrides.explanation ?? null,
    source: overrides.source ?? null,
    retryable: overrides.retryable ?? false,
    attempts: overrides.attempts ?? 0,
    provider: "gemini_user_key",
    liveModelVerified: false,
    handoffNotice: HANDOFF_NOTICE,
  };
}

type GroundingFailure = {
  code: "source_mismatch" | "unsupported_addition";
  check:
    | "unsupported_additions_reported"
    | "preserved_facts_count"
    | "preserved_facts_vocabulary"
    | "explanation_too_short"
    | "explanation_too_long"
    | "missing_walker_term"
    | "missing_standing_condition"
    | "missing_walking_condition"
    | "missing_until_condition"
    | "missing_clearance_condition"
    | "missing_physical_therapy_condition"
    | "negation_or_early_stop"
    | "treatment_change_or_extra_advice"
    | "contradictory_requirement";
};

function outputPreservesSource(
  output: ProviderOutput,
): GroundingFailure | null {
  if (output.unsupportedAdditions.length > 0) {
    return {
      code: "unsupported_addition",
      check: "unsupported_additions_reported",
    };
  }

  const requiredFacts = new Set([
    "walker whenever standing",
    "walker whenever walking",
    "until cleared by physical therapy",
  ]);
  if (
    output.preservedFacts.length !== requiredFacts.size
  ) {
    return { code: "source_mismatch", check: "preserved_facts_count" };
  }
  if (output.preservedFacts.some((fact) => !requiredFacts.has(fact))) {
    return { code: "source_mismatch", check: "preserved_facts_vocabulary" };
  }

  const explanation = output.explanation.toLowerCase();
  if (output.explanation.length < 10) {
    return { code: "source_mismatch", check: "explanation_too_short" };
  }
  if (output.explanation.length > 280) {
    return { code: "source_mismatch", check: "explanation_too_long" };
  }
  const requiredTerms: Array<[string, GroundingFailure["check"]]> = [
    ["walker", "missing_walker_term"],
    ["standing", "missing_standing_condition"],
    ["walking", "missing_walking_condition"],
    ["until", "missing_until_condition"],
    ["cleared", "missing_clearance_condition"],
    ["physical therapy", "missing_physical_therapy_condition"],
  ];
  for (const [term, check] of requiredTerms) {
    if (!explanation.includes(term)) {
      return { code: "source_mismatch", check };
    }
  }

  if (
    /\b(stop|stopping|discontinue|without the walker|before (?:being )?cleared|no longer need)\b/i.test(
      explanation,
    )
  ) {
    return { code: "unsupported_addition", check: "negation_or_early_stop" };
  }
  if (
    /\b(dose|medication|medicine|diagnos|surgery|exercise|stairs?|wound|pain treatment|therapy plan)\b/i.test(
      explanation,
    )
  ) {
    return {
      code: "unsupported_addition",
      check: "treatment_change_or_extra_advice",
    };
  }
  if (
    /\b(walker (?:is )?(?:optional|unnecessary|not required)|do not use (?:the |your )?walker|skip (?:using )?(?:the |your )?walker)\b/i.test(
      explanation,
    )
  ) {
    return {
      code: "unsupported_addition",
      check: "contradictory_requirement",
    };
  }

  return null;
}

export async function createExplanation(
  input: { patientId: string; sectionId: string; question: string },
  options: {
    apiKeyPresent: boolean;
    model: string | undefined;
    provider?: ExplanationProvider;
    maxAttempts?: number;
    onDiagnostic?: (diagnostic: ProviderDiagnostic) => void;
  },
): Promise<ExplanationResult> {
  const source = getCareBridgeSource(input.patientId, input.sectionId);
  if (!source || !isSupportedQuestion(input.question)) {
    return baseResult({
      status: "unsupported",
      code: "unsupported_request",
      message: UNSUPPORTED_MESSAGE,
      source: source ? toEvidence(source) : null,
    });
  }

  if (!options.apiKeyPresent) {
    return baseResult({
      status: "not_configured",
      code: "missing_credentials",
      message:
        "AI not connected. The owner must add a Gemini key in Replit Secrets before live explanations can be tested.",
      source: toEvidence(source),
    });
  }

  if (!options.model?.trim()) {
    return baseResult({
      status: "not_configured",
      code: "model_not_configured",
      message:
        "AI not connected. The owner must confirm an available Gemini model and configure GEMINI_MODEL.",
      source: toEvidence(source),
    });
  }

  if (!options.provider) {
    return baseResult({
      status: "error",
      code: "provider_error",
      message:
        "The explanation provider is unavailable. The exact synthetic instruction is shown instead.",
      source: toEvidence(source),
    });
  }

  const maxAttempts = Math.min(Math.max(options.maxAttempts ?? 2, 1), 2);
  let attempts = 0;

  while (attempts < maxAttempts) {
    attempts += 1;
    try {
      const output = await options.provider.explain({
        question: input.question,
        exactInstruction: source.exactInstruction,
      });
      const validationFailure = outputPreservesSource(output);
      if (validationFailure) {
        options.onDiagnostic?.({
          category: "rejected_model_output",
          reason: validationFailure.check,
          summary: "Model output failed source-grounding validation",
          attempt: attempts,
        });
        return baseResult({
          status: "error",
          code: validationFailure.code,
          message:
            "The AI output could not be verified against the selected synthetic instruction. The exact original is shown instead.",
          source: toEvidence(source),
          attempts,
        });
      }

      return baseResult({
        status: "success",
        code: "explanation_ready",
        message:
          "Gemini returned a short explanation grounded in the selected synthetic instruction. This is not proof of clinical correctness.",
        explanation: output.explanation,
        source: toEvidence(source),
        attempts,
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
        attempt: attempts,
      });
      if (!failure.retryable || attempts >= maxAttempts) {
        return baseResult({
          status: "error",
          code: failure.code,
          message:
            failure.code === "authentication_error"
              ? "Gemini authentication failed. Check the owner-managed secret; no explanation was produced."
              : `Gemini could not produce a verified explanation (${failure.code.replaceAll("_", " ")}). The exact synthetic instruction is shown instead.`,
          source: toEvidence(source),
          retryable: failure.retryable,
          attempts,
        });
      }
      await new Promise((resolve) => setTimeout(resolve, 150 * attempts));
    }
  }

  return baseResult({
    status: "error",
    code: "provider_error",
    message:
      "Gemini could not produce a verified explanation. The exact synthetic instruction is shown instead.",
    source: toEvidence(source),
    attempts,
  });
}