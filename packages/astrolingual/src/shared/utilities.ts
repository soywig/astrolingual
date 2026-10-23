/**
 * Normalize a file path across platforms by replacing backslashes with forward slashes.
 * @param path The file path to normalize.
 * @returns The normalized file path.
 */
export function normalizePath(path: string) {
  return path.replaceAll("\\", "/");
}

/** Check the provided locale against the `Intl.Locale` API. */
export function normalizeLocale(rawLocale: string): string {
  try {
    return new Intl.Locale(rawLocale).toString();
  } catch {
    return rawLocale;
  }
}
/** Extract the base language from a locale string. */
export function baseLanguage(value: string): string | undefined {
  try {
    return new Intl.Locale(value).language;
  } catch {
    return undefined;
  }
}
export function isPluralRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    Object.keys(value).some((key) => /^\$[0-9a-z]$/i.test(key))
  );
}

export function baseLocale(locale: string): string {
  const base = baseLanguage(locale);
  if (!base) throw new Error(`Invalid locale: ${locale}`);
  return base;
}
