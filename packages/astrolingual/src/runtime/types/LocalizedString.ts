import { HTMLString } from "astro/runtime/server/escape.js";

export type LocalizedString = string & {
  (...args: unknown[]): HTMLString | string;
};
