const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseEmailList(raw: string): string[] {
  const trimmed = raw.trim();
  if (!trimmed) {
    return [];
  }

  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (Array.isArray(parsed)) {
        return parsed
          .map((entry) => String(entry).trim().toLowerCase())
          .filter((email) => EMAIL_PATTERN.test(email));
      }
    } catch {
      // fall through to comma split
    }
  }

  return trimmed
    .split(/[,;\s]+/)
    .map((email) => email.trim().toLowerCase())
    .filter((email) => EMAIL_PATTERN.test(email));
}

export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email.trim());
}
