import { LocaleNode } from "./LocaleNode.js";
import { Schema } from "./Schema.js";

/**
 * A {@link LocaleNode} containing the entire schema. It will be `any` instead if the schema is not available.
 */
export type LocaleTree = 0 extends 1 & Schema ? any : LocaleNode<Schema>;
