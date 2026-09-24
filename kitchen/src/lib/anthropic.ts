import Anthropic from "@anthropic-ai/sdk";

/** Every AI feature runs on this model; see docs/HERITAGE.md and docs/ARCHITECTURE.md. */
export const AI_MODEL = "claude-sonnet-5";

let client: Anthropic | undefined;

export function hasAnthropicKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}

/** Lazy client: the key is a Worker secret, so never construct at module scope. */
export function getAnthropic(): Anthropic {
  if (!hasAnthropicKey()) {
    throw new Error("AI features are not configured (ANTHROPIC_API_KEY is missing).");
  }
  return (client ??= new Anthropic());
}
