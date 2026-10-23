import { type ParseError, parse, printParseErrorCode } from "jsonc-parser";
import { readFileSync } from "node:fs";

/**
 * Read a locale file and parse its content.
 * @param file The path to the locale file.
 * @returns The parsed content of the file.
 */
export function readLocale(file: string): any {
  const errors: ParseError[] = [];
  const data = parse(readFileSync(file, "utf8"), errors, {
    allowTrailingComma: true,
  });
  if (errors.length) {
    const e = errors[0];
    throw new Error(
      `[astrolingual] ${file}: ${printParseErrorCode(e.error)} at offset ${e.offset}`,
    );
  }
  return data;
}
