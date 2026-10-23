import type {
  AstroConfig,
  AstroIntegration,
  InjectedRoute,
  InjectedType,
} from "astro";
import { existsSync, readdirSync, utimesSync, writeFileSync } from "node:fs";
import { basename, dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { ViteDevServer } from "vite";
import { DeepPartial } from "../../../node_modules/astro/dist/type-utils.js";
import { readLocale } from "./integration/locale-files.js";
import { IntegrationOptions } from "./integration/options.js";
import { generateLocaleRoutes } from "./integration/routes.js";
import { buildSchemaTypesDeclaration } from "./integration/type-generation.js";
import { normalizePath } from "./shared/utilities.js";

const VIRTUAL = "virtual:astrolingual";

let localesPath = "";
export let defaultLocale = "en";
let files = new Map<string, string>(); // locale -> absolute file path
let typesUrl: URL;
let pagesPath = "";
let configFile: string | undefined; // astro.config.* (touching it makes astro restart)
let watchPages = false; // only true when autoRoutes is on

export default function astrolingual(
  userIntegrationOptions: IntegrationOptions = {},
): AstroIntegration {
  function configSetup({
    config: astroConfig,
    updateConfig: applyAstroConfig,
    injectRoute,
  }: {
    config: AstroConfig;
    updateConfig: (newConfig: DeepPartial<AstroConfig>) => AstroConfig;
    injectRoute: (injectRoute: InjectedRoute) => void;
  }) {
    // ----- Load configuration -----

    localesPath = normalizePath(
      fileURLToPath(
        new URL(
          userIntegrationOptions.localesDir ?? "src/locales",
          astroConfig.root,
        ),
      ),
    );

    defaultLocale =
      userIntegrationOptions.defaultLocale ??
      astroConfig.i18n?.defaultLocale ??
      "en"; // fallback to English in any case

    registerLocaleFiles();

    pagesPath = normalizePath(
      fileURLToPath(new URL("pages", astroConfig.srcDir)), // not defined by user, only defined
    );

    watchPages = userIntegrationOptions.autoRoutes ?? true;

    // find the config file location
    const possibleExtensions = ["mjs", "ts", "js", "mts", "cjs", "cts"];
    configFile = possibleExtensions
      .map((possibleExtension) =>
        join(
          fileURLToPath(astroConfig.root),
          `astro.config.${possibleExtension}`,
        ),
      )
      .find(existsSync);

    if (userIntegrationOptions.autoRoutes ?? true)
      generateLocaleRoutes(astroConfig, defaultLocale)?.forEach((route) => {
        injectRoute(route);
      });

    applyAstroConfig({
      vite: {
        plugins: [
          {
            name: "astrolingual-virtual",
            resolveId: (id: string) => (id === VIRTUAL ? "\0" + VIRTUAL : null),
            load: (id: string) => {
              if (id !== "\0" + VIRTUAL) return null;
              const locales = Object.fromEntries(
                [...files].map(([l, f]) => [l, readLocale(f)]),
              );
              return `export default ${JSON.stringify({ defaultLocale, locales })};`;
            },
          },
        ],
      },
    });
  }

  function configDone({
    injectTypes,
  }: {
    injectTypes: (injectedType: InjectedType) => URL;
  }) {
    typesUrl = injectTypes({
      filename: "astrolingual.d.ts",
      content: buildSchemaTypesDeclaration(files.get(defaultLocale)!),
    });
  }

  function devServerSetup({ server }: { server: ViteDevServer }) {
    /**
     * Check whether a file is a locale strings file.
     */
    function isLocaleStringsFile(file: string) {
      return (
        normalizePath(dirname(file)) === localesPath &&
        [".json", ".jsonc"].includes(extname(file))
      );
    }

    /**
     * Reload the virtual module and trigger a full reload of the server.
     */
    function reloadVirtualModule() {
      const module = server.moduleGraph.getModuleById("\0" + VIRTUAL);
      if (module) server.moduleGraph.invalidateModule(module);
      server.ws.send({ type: "full-reload" });
    }

    /**
     * Refresh the generated `astrolingual.d.ts` types file with the latest locale data.
     */
    function refreshTypes() {
      if (files.has(defaultLocale))
        writeFileSync(
          typesUrl,
          buildSchemaTypesDeclaration(files.get(defaultLocale)!),
        );
    }

    /**
     * Rescan the locales directory and reload the virtual module if a locale file is added or removed.
     * @param file The path to the file that was added or removed.
     */
    function rescanLocalesDir(file: string) {
      // first check whether the change is related to a locale file
      if (!isLocaleStringsFile(file)) return;

      // if so, rescan the locales directory and update the files registry
      registerLocaleFiles();
      reloadVirtualModule();
      refreshTypes();
    }

    function isPageFile(filePath: string) {
      return (
        normalizePath(filePath).startsWith(pagesPath + "/") &&
        /\.(astro|md|mdx)$/.test(filePath)
      );
    }

    let timer: ReturnType<typeof setTimeout> | undefined;

    function restartDevServer(triggerFile: string | undefined) {
      if (
        !watchPages || !configFile || triggerFile
          ? !isPageFile(triggerFile!)
          : false
      )
        return;
      clearTimeout(timer); // debounce: many events at once = one restart
      timer = setTimeout(() => {
        const now = new Date();
        utimesSync(configFile!, now, now);
      }, 100);
    }

    server.watcher.on("add", rescanLocalesDir);
    server.watcher.on("add", restartDevServer);
    server.watcher.on("change", (file: string) => {
      if (!isLocaleStringsFile(file)) return;
      reloadVirtualModule();
      const isDefaultLocale = normalizePath(file) === files.get(defaultLocale);
      if (isDefaultLocale) refreshTypes();
    });
    server.watcher.on("unlink", rescanLocalesDir);
    server.watcher.on("unlink", restartDevServer);
  }

  return {
    name: "astrolingual",
    hooks: {
      "astro:config:setup": configSetup,
      "astro:config:done": configDone,
      "astro:server:setup": devServerSetup,
    },
  };
}

/**
 * Rescan the locales directory and update the files registry.
 */
function registerLocaleFiles() {
  // empty files registry
  files = new Map();

  for (const file of readdirSync(localesPath)) {
    // skip non-JSON files
    const extension = extname(file);
    if (![".json", ".jsonc"].includes(extension)) continue;

    const locale = basename(file, extension);

    // check for duplicates
    if (files.has(locale)) {
      console.warn(
        `[astrolingual] duplicate locale "${locale}": ${files.get(locale)} and ${file}, using ${file}`,
      );
    }

    // register the file for this locale
    files.set(locale, `${localesPath}/${file}`);
  }
}


