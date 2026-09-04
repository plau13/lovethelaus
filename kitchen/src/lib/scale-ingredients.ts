/**
 * Best-effort scaling for free-text ingredient lines.
 * Parses a leading quantity (whole, decimal, fraction, or mixed) and multiplies by factor.
 * Lines without a parseable leading quantity are returned unchanged.
 */

const QUANTITY_PATTERN =
  /^(\d+\s+\d+\s*\/\s*\d+|\d+\s*\/\s*\d+|\d*\.\d+|\d+)(\s+|$)/;

const UNICODE_FRACTIONS: Record<string, string> = {
  "0.125": "⅛",
  "0.25": "¼",
  "0.333": "⅓",
  "0.375": "⅜",
  "0.5": "½",
  "0.625": "⅝",
  "0.667": "⅔",
  "0.75": "¾",
  "0.875": "⅞",
};

function parseQuantity(token: string): number | null {
  const trimmed = token.trim();
  const mixed = trimmed.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if (mixed) {
    const whole = Number.parseInt(mixed[1], 10);
    const num = Number.parseInt(mixed[2], 10);
    const den = Number.parseInt(mixed[3], 10);
    if (den === 0) {
      return null;
    }
    return whole + num / den;
  }

  const fraction = trimmed.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (fraction) {
    const num = Number.parseInt(fraction[1], 10);
    const den = Number.parseInt(fraction[2], 10);
    if (den === 0) {
      return null;
    }
    return num / den;
  }

  const value = Number.parseFloat(trimmed);
  return Number.isFinite(value) ? value : null;
}

function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const temp = y;
    y = x % y;
    x = temp;
  }
  return x;
}

function formatQuantity(value: number): string {
  if (value <= 0) {
    return String(value);
  }

  const rounded = Math.round(value * 1000) / 1000;
  const whole = Math.floor(rounded);
  const fractional = rounded - whole;

  if (fractional < 0.001) {
    return String(whole);
  }

  for (const [decimal, symbol] of Object.entries(UNICODE_FRACTIONS)) {
    if (Math.abs(fractional - Number.parseFloat(decimal)) < 0.02) {
      return whole > 0 ? `${whole} ${symbol}` : symbol;
    }
  }

  const denominator = [2, 3, 4, 8].find((den) => {
    const num = Math.round(fractional * den);
    return Math.abs(fractional - num / den) < 0.02;
  });

  if (denominator) {
    const numerator = Math.round(fractional * denominator);
    const divisor = gcd(numerator, denominator);
    const num = numerator / divisor;
    const den = denominator / divisor;
    if (whole > 0) {
      return `${whole} ${num}/${den}`;
    }
    return `${num}/${den}`;
  }

  const formatted = Number.isInteger(rounded * 10) ? rounded.toFixed(1) : rounded.toFixed(2);
  return formatted.replace(/\.?0+$/, "");
}

export function scaleIngredientLine(line: string, factor: number): string {
  if (factor === 1) {
    return line;
  }

  const match = line.match(QUANTITY_PATTERN);
  if (!match) {
    return line;
  }

  const quantityToken = match[1];
  const parsed = parseQuantity(quantityToken);
  if (parsed === null) {
    return line;
  }

  const scaled = formatQuantity(parsed * factor);
  const rest = line.slice(match[0].length);
  return `${scaled}${rest.startsWith(" ") ? "" : " "}${rest}`.trimEnd();
}

export function scaleIngredientLines(lines: string[], factor: number): string[] {
  return lines.map((line) => scaleIngredientLine(line, factor));
}
