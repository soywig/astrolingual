import { HTMLString, markHTMLString } from "astro/runtime/server/index.js";
import { isPluralRecord, normalizeLocale } from "../shared/utilities.js";
import { escapeHtml, render } from "./rendering.js";

/**
 * Resolve a translation string based on the provided key and arguments.
 * @param keyParts An array of strings representing the parts of the translation key.
 * @param args An optional array of arguments to be used for placeholder substitution
 *             in the translation string (only used when the key is called as a function).
 * @returns The resolved translation string, or `undefined` if the key is not found.
 */
export function resolveString(
  keyParts: string[],
  args: unknown[],
  rawLocaleData: { localeKey: string; strings: any }[],
): HTMLString | string | undefined {
  for (const candidateLocale of rawLocaleData) {
    const value = keyParts.reduce(
      (obj, key) => obj?.[key],
      candidateLocale.strings,
    );
    if (typeof value === "string") return render(value, args);
    if (isPluralRecord(value)) {
      // First resolve the plural form of the translation string.
      const resolvedPluralString = resolvePlural(
        value,
        args,
        candidateLocale.localeKey,
      );
      if (typeof resolvedPluralString === "string")
        return render(resolvedPluralString, args);
    }
  }
  return undefined;
}

export function resolvePlural(
  registryValue: unknown, // The raw value from the locale strings file, containing all the plural forms for the translation key.
  args: unknown[],
  locale: string,
): string | undefined {
  let current = registryValue;

  while (current && typeof current === "object") {
    const selector = Object.keys(current).find((key) => /^\$[0-9]$/.test(key));
    if (!selector) return undefined;

    const argument = args[Number(selector.slice(1))];
    const forms = (current as Record<string, unknown>)[selector];
    if (argument === undefined || !forms || typeof forms !== "object")
      return undefined;

    let category: Intl.LDMLPluralRule;
    try {
      category = new Intl.PluralRules(normalizeLocale(locale)).select(
        Number(argument),
      );
    } catch {
      return undefined;
    }
    current =
      (forms as Record<string, unknown>)[category] ??
      (forms as Record<string, unknown>).other;
  }

  return typeof current === "string" ? current : undefined;
}

export function missing(
  keyParts: string[],
  inLocale: string,
): HTMLString | string {
  const key = keyParts.join(".");
  console.warn(`[astrolingual] missing key "${key}" (${inLocale})`);
  return markHTMLString(escapeHtml(key));
}
