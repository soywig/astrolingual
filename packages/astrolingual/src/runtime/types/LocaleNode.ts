import { LocalizedString } from "./LocalizedString.js";

/**
 * A bit of the locale tree that can either be a string itself or contain multiple of them.
 */
export type LocaleNode<Node> = Node extends string // all straight strings become a LocalizedString
  ? LocalizedString
  : Node extends object // if it's an object...
    ? IsPluralObject<Node> extends true // ...it might be a plural
      ? LocalizedString
      : {
          // if it's not then it's just another collection of strings; it calls itself
          [Key in keyof Node]: LocaleNode<Node[Key]>;
        }
    : never; // this shouldn't happen

type IsPluralObject<Node> =
  Extract<keyof Node, `$${string}`> extends never ? false : true;
