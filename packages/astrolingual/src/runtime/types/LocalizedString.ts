import { HTMLString } from "astro/runtime/server/escape.js";

export type LocalizedString = {
  (...args: unknown[]): HTMLString | string;
  toString(): string;
};
