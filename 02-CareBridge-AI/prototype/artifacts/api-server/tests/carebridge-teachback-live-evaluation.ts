import assert from "node:assert/strict";
import { createTeachBackAssessment } from "../src/lib/carebridge-teachback";
import { createGeminiTeachBackProvider } from "../src/lib/gemini-provider";
import type { ProviderDiagnostic } from "../src/lib/carebridge-explanation";

const apiKey = process.env["GEMINI_API_KEY"];
const model = process.env["GEMINI_MODEL"];
assert.ok(apiKey, "GEMINI_API_KEY is required for the authorized live evaluation");
assert.ok(model, "GEMINI_MODEL is required for the authorized live evaluation");

const scenarios = [
  {
    name: "complete_paraphrase",
    answer:
      "I need my walking aid any time I am on my feet, whether stationary or moving, and I will keep using it until my physiotherapist clears me.",
  },
  {
    name: "incomplete_walking_only",
    answer: "I will use the walker whenever I am walking.",
  },
  {
    name: "ambiguous_reference",
    answer:
      "I will use it in the situations we discussed until someone says otherwise.",
  },
  {
    name: "subtle_contradiction",
    answer:
      "Once I feel steady, the walker becomes a choice, even if physiotherapy has not yet signed off.",
  },
  {
    name: "synonym_and_spelling_variation",
    answer:
      "I will use my walking frame whenever I am stood up or getting about, till the physio gives clearance.",
  },
] as const;

const provider = createGeminiTeachBackProvider(apiKey, model);
let actualGenerationAttempts = 0;
const results: Array<{
  name: string;
  outcome: string;
  comprehensionAttempts: number;
  providerAttempts: number;
  assessmentSource: string;
  liveModelVerified: boolean;
  diagnosticCategory: string | null;
}> = [];

for (const [index, scenario] of scenarios.entries()) {
  let diagnostic: ProviderDiagnostic | null = null;
  const result = await createTeachBackAssessment(
    {
      sessionId: `live-teachback-session-${index}`,
      idempotencyKey: `live-teachback-key-${index}`,
      patientId: "p1",
      sectionId: "mobility",
      sourceVersion: "v1.0.4",
      answer: scenario.answer,
    },
    {
      apiKeyPresent: true,
      model,
      provider,
      assessmentSource: "gemini_live",
      maxProviderAttempts: 1,
      onDiagnostic(value) {
        diagnostic = value;
      },
    },
  );
  actualGenerationAttempts += result.providerAttempts;
  assert.ok(
    actualGenerationAttempts <= 6,
    "Authorized six-attempt live evaluation cap exceeded",
  );
  results.push({
    name: scenario.name,
    outcome: result.outcome,
    comprehensionAttempts: result.comprehensionAttempts,
    providerAttempts: result.providerAttempts,
    assessmentSource: result.assessmentSource,
    liveModelVerified: result.liveModelVerified,
    diagnosticCategory: diagnostic?.category ?? null,
  });
  if (
    diagnostic &&
    ["authentication", "quota_exhausted", "rate_limited", "model_access"].includes(
      diagnostic.category,
    )
  ) {
    break;
  }
}

console.log(
  JSON.stringify(
    {
      actualGenerationAttempts,
      scenarioResults: results,
      rawResponsesRetained: false,
    },
    null,
    2,
  ),
);