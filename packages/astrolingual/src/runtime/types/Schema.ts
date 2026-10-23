import { buildSchemaTypesDeclaration } from "../../integration/type-generation.js";
import { Register } from "./Register.js";

/**
 * A type representing the schema of the registered translations.
 * It is inferred from the `Register` interface, which is generated based on the default locale.
 * Falls back to `any` if the `Register` interface does not contain a `schema` property yet.
 * @see {@link buildSchemaTypesDeclaration} for more details.
 */

export type Schema = Register extends { schema: infer ExtractedSchema }
  ? ExtractedSchema
  : any;
