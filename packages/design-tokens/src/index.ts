// Extension `.js` requise par Node ESM (`"type": "module"`) ; SWC ne réécrit
// pas les chemins, donc on cible directement le fichier compilé.
export { variantClassNames } from './color-variants.js';
export { colorVariants, sizeVariants, typeVariants } from './color-variants.js';
export type {
  ColorVariant,
  SizeVariant,
  TypeVariant,
} from './color-variants.js';
export { designTokens } from './design-tokens.js';
