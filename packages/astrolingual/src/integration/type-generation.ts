import { readLocale } from "./locale-files.js";

/**
 * Build the TypeScript declaration file for the schema types based on the default locale.
 *
 * The contents of the schema will be retained by the {@link Schema} type.
 *
 * @returns The content of the TypeScript declaration file.
 * @see {@link Schema}
 */
export function buildSchemaTypesDeclaration(file: string): string {
  const schema = JSON.stringify(readLocale(file));
  return `
    import "astrolingual/runtime";

    declare module "astrolingual/runtime" {
      interface Register {
        schema: ${schema};
      }
    }
      
    declare module "virtual:astrolingual" {
      const config: import("astrolingual/runtime").AstrolingualConfig;
      export default config;
    }
  `;
}
