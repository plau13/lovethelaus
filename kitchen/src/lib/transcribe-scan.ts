import { jsonSchemaOutputFormat } from "@anthropic-ai/sdk/helpers/json-schema";
import { AI_MODEL, getAnthropic } from "@/lib/anthropic";

const RECIPE_CARD_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string", description: "The recipe name as written on the card. Empty string if it has none." },
    ingredients: { type: "string", description: "One ingredient per line, exactly as written, including amounts." },
    steps: { type: "string", description: "One instruction per line, in order." },
    notes: { type: "string", description: "Margin notes, dedications, or asides. Empty string if none." },
  },
  required: ["title", "ingredients", "steps", "notes"],
  additionalProperties: false,
} as const;

const SYSTEM_PROMPT = [
  "You transcribe photographs of handwritten and printed family recipe cards.",
  "Copy what is written; do not modernise measurements, correct the cook, or invent steps.",
  "Keep the original spelling and abbreviations (tsp, T, pt) as they appear.",
  "If a word is genuinely illegible, write [?] in its place rather than guessing.",
].join(" ");

const VISION_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
type VisionType = (typeof VISION_TYPES)[number];

function visionType(contentType: string): VisionType {
  const found = VISION_TYPES.find((type) => type === contentType);
  if (!found) {
    throw new Error("That card photo is in a format Claude cannot read.");
  }
  return found;
}

export type ScanTranscription = {
  title: string;
  ingredients: string;
  steps: string;
  notes: string;
};

/** Human-readable transcript stored on the media row and shown beside the scan. */
export function formatTranscript(result: ScanTranscription): string {
  const sections = [
    result.title.trim(),
    result.ingredients.trim(),
    result.steps.trim(),
    result.notes.trim() ? `Notes: ${result.notes.trim()}` : "",
  ].filter(Boolean);
  return sections.join("\n\n");
}

/**
 * Read a photographed recipe card with Claude's vision input.
 * Throws when the key is missing or the model returns nothing usable — the caller reports it.
 */
export async function transcribeRecipeCard(image: { base64: string; contentType: string }): Promise<ScanTranscription> {
  const response = await getAnthropic().messages.parse({
    model: AI_MODEL,
    max_tokens: 4096,
    // Plain transcription; thinking is adaptive-on for this model, so keep the effort low.
    output_config: { effort: "low", format: jsonSchemaOutputFormat(RECIPE_CARD_SCHEMA) },
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: visionType(image.contentType),
              data: image.base64,
            },
          },
          { type: "text", text: "Transcribe this recipe card." },
        ],
      },
    ],
  });

  const parsed = response.parsed_output;
  if (!parsed) {
    throw new Error("Could not read that card. Try a straighter, better-lit photo.");
  }
  return parsed;
}
