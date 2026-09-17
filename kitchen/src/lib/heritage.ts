/** Pure helpers for the heritage features (provenance lines, years, memory summaries). */

export const COMMON_OCCASIONS = [
  "Sunday dinner",
  "Weeknight",
  "Birthday",
  "Thanksgiving",
  "Christmas",
  "Easter",
  "Passover",
  "Hanukkah",
  "Lunar New Year",
  "Eid",
  "Diwali",
  "Summer cookout",
  "Potluck",
] as const;

export const MIN_YEAR = 1800;

export function parseYear(raw: string | number | null | undefined, now: Date = new Date()): number | null {
  if (raw === null || raw === undefined || raw === "") {
    return null;
  }
  const value = typeof raw === "number" ? raw : Number.parseInt(String(raw).trim(), 10);
  if (!Number.isInteger(value) || value < MIN_YEAR || value > now.getFullYear()) {
    return null;
  }
  return value;
}

export type ProvenanceInput = {
  person?: { name: string; relationship?: string | null } | null;
  firstMadeYear?: number | null;
  occasion?: string | null;
};

/** "From Grandma Rose (grandmother) · first made 1974 · Sunday dinner", or "" when nothing is set. */
export function provenanceLine(input: ProvenanceInput): string {
  const parts: string[] = [];
  if (input.person?.name?.trim()) {
    const relationship = input.person.relationship?.trim();
    parts.push(`From ${input.person.name.trim()}${relationship ? ` (${relationship})` : ""}`);
  }
  if (input.firstMadeYear) {
    parts.push(`first made ${input.firstMadeYear}`);
  }
  if (input.occasion?.trim()) {
    parts.push(input.occasion.trim());
  }
  return parts.join(" · ");
}

export function formatMadeOn(date: Date, withYear = true): string {
  return date.toLocaleDateString("en-US", withYear ? { month: "short", day: "numeric", year: "numeric" } : { month: "short", day: "numeric" });
}

/** "Made 12 times · last by Mom on Sep 3, 2026". Empty string when never made. */
export function memorySummary(memories: { madeOn: Date; userName: string }[]): string {
  if (memories.length === 0) {
    return "";
  }
  const latest = [...memories].sort((a, b) => b.madeOn.getTime() - a.madeOn.getTime())[0];
  const count = memories.length;
  return `Made ${count === 1 ? "once" : `${count} times`} · last by ${latest.userName} on ${formatMadeOn(latest.madeOn)}`;
}

/** Lifespan label for a person card: "1931–2019", "b. 1958", or "". */
export function lifespan(birthYear: number | null | undefined, passedYear: number | null | undefined): string {
  if (birthYear && passedYear) {
    return `${birthYear}–${passedYear}`;
  }
  if (birthYear) {
    return `b. ${birthYear}`;
  }
  if (passedYear) {
    return `d. ${passedYear}`;
  }
  return "";
}
