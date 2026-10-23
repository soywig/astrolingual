import type { AstroConfig, InjectedRoute } from "astro";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { normalizePath } from "../shared/utilities.js";

export function generateLocaleRoutes(
  astroConfig: AstroConfig,
  defaultLocale: string,
): InjectedRoute[] {
  const languageEntries = (astroConfig.i18n?.locales ?? []).map((locale) =>
    typeof locale === "string" ? { path: locale, codes: [locale] } : locale,
  );
  const localePaths: string[] = languageEntries.map((entry) => entry.path);
  const defaultPath =
    languageEntries.find(
      (entry) =>
        entry.path === defaultLocale || entry.codes.includes(defaultLocale),
    )?.path ?? defaultLocale;

  // with prefixDefaultLocale the default locale needs copies too
  const routing = astroConfig.i18n?.routing;
  const prefixDefaultLocale: boolean =
    typeof routing === "object" && routing.prefixDefaultLocale;
  const targets = prefixDefaultLocale
    ? localePaths
    : localePaths.filter((path) => path !== defaultPath);

  const pagesDir = normalizePath(
    fileURLToPath(new URL("pages", astroConfig.srcDir)),
  );

  // if there are no locales or the pages directory doesn't exist, don't generate any routes
  if (targets.length <= 0 || !existsSync(pagesDir)) return [];

  // helper functions to filter out non-page files and hidden files
  const isPage = (filePath: string) => /\.(astro|md|mdx)$/.test(filePath);
  const hidden = (filePath: string) =>
    filePath.split("/").some((segment) => segment.startsWith("_"));
  const isLocalePage = (filePath: string) =>
    localePaths.includes(filePath.split("/")[0]);

  const pages = (readdirSync(pagesDir, { recursive: true }) as string[])
    .map((filePath) => normalizePath(filePath))
    .filter(
      (filePath) =>
        isPage(filePath) && !hidden(filePath) && !isLocalePage(filePath),
    );
  let foo: InjectedRoute[] = [];
  targets.forEach((locale) => {
    pages.forEach((page) => {
      // if a dedicated page for the language already exists, don't generate it
      const properPageExists = existsSync(join(pagesDir, locale, page));
      if (properPageExists) return;

      const route = page
        .replace(/\.(astro|md|mdx)$/, "")
        .replace(/(^|\/)index$/, "");

      foo.push({
        pattern: `/${locale}${route ? "/" + route : ""}`,
        entrypoint: `${pagesDir}/${page}`,
      });
    });
  });
  return foo;
}
