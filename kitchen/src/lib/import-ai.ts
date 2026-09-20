import { jsonSchemaOutputFormat } from "@anthropic-ai/sdk/helpers/json-schema";
import { AI_MODEL, getAnthropic, hasAnthropicKey } from "@/lib/anthropic";
import type { ImportDraftShape } from "@/lib/types";
import { errorMessage, logWarn } from "@/lib/log";

const SYSTEM_PROMPT = [
  "Extract a home-cook recipe from the supplied text.",
  "Do not copy prose, marketing copy, or life stories, and do not invent steps that are not there.",
  "Keep attribution out of the body.",
].join(" ");

const DRAFT_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    ingredients: { type: "string", description: "One ingredient per line." },
    steps: { type: "string", description: "One instruction per line, in order." },
  },
  required: ["title", "ingredients", "steps"],
  additionalProperties: false,
} as const;

/** Structure an imported draft with Claude when a key is configured; otherwise pass it through. */
export async function structureWithOptionalAi(draft: ImportDraftShape): Promise<ImportDraftShape> {
  if (!hasAnthropicKey()) {
    return enrichWithVideoAnalysis(draft);
  }
  try {
    const response = await getAnthropic().messages.parse({
      model: AI_MODEL,
      max_tokens: 4096,
      output_config: { effort: "low", format: jsonSchemaOutputFormat(DRAFT_SCHEMA) },
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Title: ${draft.title}\nAttribution: ${draft.attribution}\nText:\n${draft.ingredients}\n${draft.steps}`,
        },
      ],
    });
    const parsed = response.parsed_output;
    if (parsed) {
      return enrichWithVideoAnalysis({
        ...draft,
        title: parsed.title.trim() || draft.title,
        ingredients: parsed.ingredients.trim() || draft.ingredients,
        steps: parsed.steps.trim() || draft.steps,
      });
    }
  } catch (error) {
    // The confirm screen still works on the raw draft; never fail an import
    // because AI was unavailable. Degrading quietly for the user is right;
    // degrading quietly for us was not, since a broken key looks from the
    // outside exactly like a recipe the model had nothing to add to.
    logWarn("import.ai_unavailable", { sourceType: draft.sourceType, detail: errorMessage(error) });
  }
  return enrichWithVideoAnalysis(draft);
}

/** Future hook: analyze video frames from social URLs when API support is available. */
export async function enrichWithVideoAnalysis(draft: ImportDraftShape): Promise<ImportDraftShape> {
  if (draft.sourceType !== "instagram" && draft.sourceType !== "tiktok") {
    return draft;
  }
  // Video dissection is planned; caption-based draft is returned until a video API is wired.
  return draft;
}
