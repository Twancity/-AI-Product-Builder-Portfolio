import assert from "node:assert/strict";
import {
  ProviderFailure,
  type ProviderDiagnostic,
} from "../src/lib/carebridge-explanation";
import { createGeminiProvider } from "../src/lib/gemini-provider";

const fakeSecret = "AIzaFAKE_SECRET_VALUE_THAT_MUST_NEVER_APPEAR";
const fakeQuestion = "PRIVATE FIXTURE QUESTION CONTENT";
const fakeInstruction = "PRIVATE FIXTURE SOURCE CONTENT";
const originalFetch = globalThis.fetch;
let passed = 0;

async function check(name: string, run: () => Promise<void>) {
  try {
    await run();
    passed += 1;
    console.log(`PASS ${name}`);
  } finally {
    globalThis.fetch = originalFetch;
  }
}

async function captureDiagnostic(
  status: number,
  body: unknown,
): Promise<{ failure: ProviderFailure; diagnostic: ProviderDiagnostic }> {
  globalThis.fetch = async () =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    });
  try {
    await createGeminiProvider(
      fakeSecret,
      "gemini-2.5-flash",
    ).explain({
      question: fakeQuestion,
      exactInstruction: fakeInstruction,
    });
    throw new Error("Expected provider failure");
  } catch (error) {
    assert.ok(error instanceof ProviderFailure);
    return { failure: error, diagnostic: error.diagnostic };
  }
}

await check("redacts credentials, URLs, question, and source content", async () => {
  const { diagnostic } = await captureDiagnostic(400, {
    error: {
      status: "INVALID_ARGUMENT",
      message:
        `Invalid ${fakeQuestion} ${fakeInstruction} ${fakeSecret} ` +
        `https://example.invalid/path?key=${fakeSecret}`,
      details: [{ reason: "BAD_REQUEST_FIXTURE" }],
    },
  });
  const serialized = JSON.stringify(diagnostic);
  assert.equal(diagnostic.category, "invalid_request");
  assert.equal(diagnostic.httpStatus, 400);
  assert.equal(diagnostic.reason, "BAD_REQUEST_FIXTURE");
  assert.ok(!serialized.includes(fakeSecret));
  assert.ok(!serialized.includes(fakeQuestion));
  assert.ok(!serialized.includes(fakeInstruction));
  assert.ok(!serialized.includes("https://"));
  assert.ok(diagnostic.summary.length <= 180);
});

await check("classifies model access without exposing raw payload", async () => {
  const { failure, diagnostic } = await captureDiagnostic(404, {
    error: {
      status: "NOT_FOUND",
      message: "Requested model was not found for this API version",
    },
  });
  assert.equal(failure.code, "provider_error");
  assert.equal(failure.retryable, false);
  assert.equal(diagnostic.category, "model_access");
  assert.equal(diagnostic.httpStatus, 404);
  assert.equal(diagnostic.reason, "NOT_FOUND");
});

await check("classifies authentication as non-retryable", async () => {
  const { failure, diagnostic } = await captureDiagnostic(403, {
    error: { status: "PERMISSION_DENIED", message: "Permission denied" },
  });
  assert.equal(failure.code, "authentication_error");
  assert.equal(failure.retryable, false);
  assert.equal(diagnostic.category, "authentication");
});

await check("distinguishes quota exhaustion from generic rate limiting", async () => {
  const quota = await captureDiagnostic(429, {
    error: {
      status: "RESOURCE_EXHAUSTED",
      message: "Free tier quota exhausted",
    },
  });
  assert.equal(quota.failure.retryable, false);
  assert.equal(quota.diagnostic.category, "quota_exhausted");

  const rate = await captureDiagnostic(429, {
    error: {
      status: "RESOURCE_EXHAUSTED",
      message: "Request rate limit reached",
    },
  });
  assert.equal(rate.failure.retryable, false);
  assert.equal(rate.diagnostic.category, "rate_limited");
});

await check("classifies transient provider failures as retryable", async () => {
  const { failure, diagnostic } = await captureDiagnostic(503, {
    error: { status: "UNAVAILABLE", message: "Service temporarily unavailable" },
  });
  assert.equal(failure.code, "provider_error");
  assert.equal(failure.retryable, true);
  assert.equal(diagnostic.category, "transient_failure");
});

await check("classifies malformed model output as rejected", async () => {
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        candidates: [{ content: { parts: [{ text: "{\"wrong\":true}" }] } }],
      }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  await assert.rejects(
    () =>
      createGeminiProvider(fakeSecret, "gemini-2.5-flash").explain({
        question: fakeQuestion,
        exactInstruction: fakeInstruction,
      }),
    (error: unknown) =>
      error instanceof ProviderFailure &&
      error.code === "malformed_response" &&
      error.diagnostic.category === "rejected_model_output",
  );
});

await check("rejects invented source or version metadata", async () => {
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    explanation:
                      "Keep using your walker whenever standing or walking until cleared by physical therapy.",
                    preservedFacts: [
                      "walker whenever standing",
                      "walker whenever walking",
                      "until cleared by physical therapy",
                    ],
                    unsupportedAdditions: [],
                    patientName: "Invented Patient",
                    sourceVersion: "v999",
                  }),
                },
              ],
            },
          },
        ],
      }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  await assert.rejects(
    () =>
      createGeminiProvider(fakeSecret, "gemini-3.1-flash-lite").explain({
        question: fakeQuestion,
        exactInstruction: fakeInstruction,
      }),
    (error: unknown) =>
      error instanceof ProviderFailure &&
      error.code === "malformed_response" &&
      error.diagnostic.reason === "INVALID_OUTPUT_SHAPE",
  );
});

console.log(`PASS ${passed}/${passed} provider diagnostic privacy checks`);