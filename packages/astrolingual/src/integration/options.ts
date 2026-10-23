/**
 * Options for the Astrolingual integration.
 * @param localesDir The directory containing the locale files. Default: "src/locales"
 * @param defaultLocale The default locale. Default: astro's i18n.defaultLocale, else "en"
 * @param autoRoutes Whether to automatically generate routes for each locale. Default: true
 */
export interface IntegrationOptions {
  localesDir?: string;
  defaultLocale?: string;
  autoRoutes?: boolean;
}
