import config from "virtual:astrolingual";
import { missing, resolveString } from "./runtime/resolver.js";
import { LocaleTree } from "./runtime/types/LocaleTree.js";
import { baseLanguage, normalizeLocale } from "./shared/utilities.js";

export type { AstrolingualConfig } from "./runtime/types/AstrolingualConfig.js";

export namespace Astrolingual {
  export function use(locale?: string): LocaleTree {
    const usedLocale = locale ?? config.defaultLocale;

    /** List of fallback locales to try in order when retrieving translations, including fallbacks. */
    const candidateLocales = [
      usedLocale,
      baseLanguage(usedLocale),
      config.defaultLocale,
    ].filter((candidate): candidate is string => Boolean(candidate));

    /** List of candidate locales and their strings, in the order they will be tried when retrieving translations. */
    const retrievedLocaleData = candidateLocales
      .map((candidate) => retrieveLocaleStrings(candidate))
      .filter(
        (candidate): candidate is { localeKey: string; strings: any } =>
          candidate !== undefined,
      )
      .filter(
        (candidate, index, all) =>
          all.findIndex((item) => item.localeKey === candidate.localeKey) ===
          index,
      );

    function retrieveLocaleStrings(
      value: string,
    ): { localeKey: string; strings: any } | undefined {
      const normalizedLocale = normalizeLocale(value);
      const key = Object.keys(config.locales).find(
        (candidate) => normalizeLocale(candidate) === normalizedLocale,
      );
      return key ? { localeKey: key, strings: config.locales[key] } : undefined;
    }

    function createProxy(prefix: string[] = []): any {
      return new Proxy(() => {}, {
        // when accessed as a property
        get(_target, prop) {
          // ignore symbol properties (e.g., `Symbol.toStringTag`, `Symbol.iterator`)
          // which are not part of the translation schema and should not be handled by the proxy
          if (typeof prop === "symbol") return undefined;

          if (prop === "toString") {
            return () => {
              const value = resolveString(prefix, [], retrievedLocaleData);
              return value
                ? String(value)
                : String(missing(prefix, usedLocale));
            };
          }

          return createProxy([...prefix, String(prop)]);
        },

        // when called as a function
        apply(_target, _thisArg, args: unknown[]) {
          return (
            resolveString(prefix, args, retrievedLocaleData) ??
            missing(prefix, usedLocale)
          );
        },
      }) as unknown as any;
    }

    return createProxy();
  }

  export function skip() {
    return new Response(null, { status: 404 });
  }
}
