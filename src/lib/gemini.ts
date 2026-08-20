import "server-only";

import { GoogleGenAI } from "@google/genai";

import {
  getGeminiRetryDelay,
  isTransientGeminiError,
} from "@/lib/gemini-retry";
import {
  buildIncidentDraftPrompt,
  parseIncidentDraftResponse,
} from "@/lib/incident-draft-prompt";
import type { IncidentDraft } from "@/lib/incidents";
import { buildSummaryPrompt } from "@/lib/summary-prompt";
import type { GenerateSummaryInput } from "@/lib/summaries";

const GEMINI_MODEL = "gemini-3.6-flash";

export class GeminiConfigurationError extends Error {
  constructor() {
    super("Add GEMINI_API_KEY to .env before generating a report.");
    this.name = "GeminiConfigurationError";
  }
}

export class GeminiRateLimitError extends Error {
  constructor() {
    super(
      "Gemini is busy or rate-limited after several retries. Wait a minute, then generate the draft again.",
    );
    this.name = "GeminiRateLimitError";
  }
}

export class GeminiResponseError extends Error {
  constructor() {
    super("Gemini returned an empty report. Try generating the draft again.");
    this.name = "GeminiResponseError";
  }
}

async function wait(milliseconds: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export async function generateWeeklySummary(
  input: GenerateSummaryInput,
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new GeminiConfigurationError();

  const ai = new GoogleGenAI({ apiKey });

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: buildSummaryPrompt(input),
        config: {
          temperature: 0.2,
        },
      });
      const text = response.text?.trim();

      if (!text) throw new GeminiResponseError();
      return text;
    } catch (error: unknown) {
      if (error instanceof GeminiResponseError) throw error;

      if (isTransientGeminiError(error)) {
        if (attempt < 2) {
          await wait(getGeminiRetryDelay(attempt));
          continue;
        }
        throw new GeminiRateLimitError();
      }

      console.error("Gemini summary generation failed", error);
      throw new Error(
        "Gemini could not generate the report. Your reviewed incident text was not saved or finalized.",
      );
    }
  }

  throw new GeminiRateLimitError();
}

export async function generateIncidentDraft(
  notes: string,
): Promise<IncidentDraft> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new GeminiConfigurationError();

  const ai = new GoogleGenAI({ apiKey });

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: buildIncidentDraftPrompt(notes),
        config: { temperature: 0.2 },
      });
      const text = response.text?.trim();
      if (!text) throw new GeminiResponseError();

      return parseIncidentDraftResponse(text);
    } catch (error: unknown) {
      if (
        error instanceof GeminiResponseError ||
        error instanceof Error && error.message.includes("validation failed")
      ) {
        throw error;
      }

      if (isTransientGeminiError(error)) {
        if (attempt < 2) {
          await wait(getGeminiRetryDelay(attempt));
          continue;
        }
        throw new GeminiRateLimitError();
      }

      console.error("Gemini incident draft generation failed", error);
      throw new Error("Gemini could not generate the draft. Try again later.");
    }
  }

  throw new GeminiRateLimitError();
}
