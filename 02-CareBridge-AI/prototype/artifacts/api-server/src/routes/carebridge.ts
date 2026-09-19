import { Router, type IRouter } from "express";
import {
  CreateCareBridgeHandoffBody,
  CreateCareBridgeHandoffResponse,
  CreateCareBridgeTeachBackAssessmentBody,
  CreateCareBridgeTeachBackAssessmentResponse,
  CreateCareBridgeExplanationBody,
  CreateCareBridgeExplanationResponse,
  GetCareBridgeTeachBackQueryParams,
  GetCareBridgeTeachBackResponse,
  ListCareBridgeHandoffsQueryParams,
  ListCareBridgeHandoffsResponse,
  UpdateCareBridgeHandoffStatusBody,
  UpdateCareBridgeHandoffStatusResponse,
} from "@workspace/api-zod";
import { createExplanation } from "../lib/carebridge-explanation";
import {
  createOrRetryHandoff,
  listHandoffs,
  updateHandoffStatus,
} from "../lib/carebridge-handoff";
import {
  createTeachBackAssessment,
  getTeachBackState,
} from "../lib/carebridge-teachback";
import {
  createGeminiProvider,
  createGeminiTeachBackProvider,
} from "../lib/gemini-provider";

const router: IRouter = Router();
const requestTimes = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 5;

function withinUsageLimit(clientId: string): boolean {
  const now = Date.now();
  const recent = (requestTimes.get(clientId) ?? []).filter(
    (timestamp) => now - timestamp < WINDOW_MS,
  );
  if (recent.length >= MAX_REQUESTS_PER_WINDOW) {
    requestTimes.set(clientId, recent);
    return false;
  }
  recent.push(now);
  requestTimes.set(clientId, recent);
  return true;
}

router.post("/carebridge/explanations", async (req, res): Promise<void> => {
  const parsed = CreateCareBridgeExplanationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid explanation request" });
    return;
  }

  const clientId = req.ip ?? "unknown";
  if (!withinUsageLimit(clientId)) {
    res.status(429).json({ error: "Explanation usage limit reached" });
    return;
  }

  const apiKey = process.env["GEMINI_API_KEY"];
  const model = process.env["GEMINI_MODEL"];
  const provider =
    apiKey && model ? createGeminiProvider(apiKey, model) : undefined;

  const result = await createExplanation(parsed.data, {
    apiKeyPresent: Boolean(apiKey),
    model,
    provider,
    maxAttempts: 2,
    onDiagnostic(diagnostic) {
      req.log.warn(
        { carebridgeProvider: diagnostic },
        "CareBridge Gemini provider diagnostic",
      );
    },
  });

  res.json(CreateCareBridgeExplanationResponse.parse(result));
});

router.get("/carebridge/handoffs", (req, res): void => {
  const parsed = ListCareBridgeHandoffsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid demo handoff history request" });
    return;
  }
  res.json(
    ListCareBridgeHandoffsResponse.parse(
      listHandoffs(parsed.data.sessionId, parsed.data.patientId),
    ),
  );
});

router.post("/carebridge/handoffs", (req, res): void => {
  const parsed = CreateCareBridgeHandoffBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid demo handoff request" });
    return;
  }
  try {
    res.json(
      CreateCareBridgeHandoffResponse.parse(createOrRetryHandoff(parsed.data)),
    );
  } catch (error) {
    const code = error instanceof Error ? error.message : "INVALID_REQUEST";
    res.status(400).json({ error: code });
  }
});

router.post(
  "/carebridge/handoffs/:reviewRequestId/status",
  (req, res): void => {
    const parsed = UpdateCareBridgeHandoffStatusBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid demo status update" });
      return;
    }
    try {
      res.json(
        UpdateCareBridgeHandoffStatusResponse.parse(
          updateHandoffStatus({
            ...parsed.data,
            reviewRequestId: req.params.reviewRequestId ?? "",
          }),
        ),
      );
    } catch (error) {
      const code = error instanceof Error ? error.message : "INVALID_REQUEST";
      res.status(400).json({ error: code });
    }
  },
);

router.get("/carebridge/teach-back", (req, res): void => {
  const parsed = GetCareBridgeTeachBackQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid demo teach-back history request" });
    return;
  }
  res.json(
    GetCareBridgeTeachBackResponse.parse(getTeachBackState(parsed.data)),
  );
});

router.post("/carebridge/teach-back", async (req, res): Promise<void> => {
  const parsed = CreateCareBridgeTeachBackAssessmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid demo teach-back request" });
    return;
  }
  const clientId = req.ip ?? "unknown";
  if (!withinUsageLimit(clientId)) {
    res.status(429).json({ error: "Teach-back usage limit reached" });
    return;
  }
  const apiKey = process.env["GEMINI_API_KEY"];
  const model = process.env["GEMINI_MODEL"];
  const provider =
    apiKey && model
      ? createGeminiTeachBackProvider(apiKey, model)
      : undefined;
  try {
    const result = await createTeachBackAssessment(parsed.data, {
      apiKeyPresent: Boolean(apiKey),
      model,
      provider,
      assessmentSource: "gemini_live",
      maxProviderAttempts: 2,
      onDiagnostic(diagnostic) {
        req.log.warn(
          { carebridgeTeachBackProvider: diagnostic },
          "CareBridge teach-back provider diagnostic",
        );
      },
    });
    res.json(CreateCareBridgeTeachBackAssessmentResponse.parse(result));
  } catch (error) {
    const code = error instanceof Error ? error.message : "INVALID_REQUEST";
    res.status(400).json({ error: code });
  }
});

export default router;