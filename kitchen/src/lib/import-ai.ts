import type { ImportDraftShape } from "@/lib/types";

const SYSTEM_PROMPT =
  "Extract a home-cook recipe as JSON with keys title, ingredients (newline-separated), steps (newline-separated). Do not copy prose or download video. Keep attribution out of the body.";

function userPrompt(draft: ImportDraftShape): string {
  return `Title: ${draft.title}\nAttribution: ${draft.attribution}\nText:\n${draft.ingredients}\n${draft.steps}`;
}

function applyParsedJson(draft: ImportDraftShape, content: string): ImportDraftShape {
  try {
    const parsed = JSON.parse(content) as { title?: string; ingredients?: string; steps?: string };
    return {
      ...draft,
      title: parsed.title?.trim() || draft.title,
      ingredients: parsed.ingredients?.trim() || draft.ingredients,
      steps: parsed.steps?.trim() || draft.steps,
    };
  } catch {
    return draft;
  }
}

async function structureWithAnthropic(draft: ImportDraftShape, key: string): Promise<ImportDraftShape> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: `${SYSTEM_PROMPT} Reply with JSON only.`,
      messages: [{ role: "user", content: userPrompt(draft) }],
    }),
  });
  if (!response.ok) {
    return draft;
  }
  const payload = (await response.json()) as { content?: Array<{ type?: string; text?: string }> };
  const text = payload.content?.find((block) => block.type === "text")?.text;
  if (!text) {
    return draft;
  }
  return applyParsedJson(draft, text);
}

async function structureWithOpenAi(draft: ImportDraftShape, key: string): Promise<ImportDraftShape> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      authorization: `Bearer ${key}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt(draft) },
      ],
    }),
  });
  if (!response.ok) {
    return draft;
  }
  const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    return draft;
  }
  return applyParsedJson(draft, content);
}

export async function structureWithOptionalAi(draft: ImportDraftShape): Promise<ImportDraftShape> {
  const anthropicKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (anthropicKey) {
    return structureWithAnthropic(draft, anthropicKey);
  }
  const openAiKey = process.env.OPENAI_API_KEY?.trim();
  if (openAiKey) {
    return structureWithOpenAi(draft, openAiKey);
  }
  return draft;
}
