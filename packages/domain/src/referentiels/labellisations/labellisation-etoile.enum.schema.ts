import { z } from 'zod/mini';

export const EtoileEnum = {
  PREMIERE_ETOILE: 1,
  DEUXIEME_ETOILE: 2,
  TROISIEME_ETOILE: 3,
  QUATRIEME_ETOILE: 4,
  CINQUIEME_ETOILE: 5,
} as const;

export const etoileEnumSchema = z.enum(EtoileEnum);

export type Etoile = (typeof EtoileEnum)[keyof typeof EtoileEnum];

// TODO delete string types when refactoring labellisation sub-domain
export const etoileAsStringEnumValues = ['1', '2', '3', '4', '5'] as const;
export const etoileAsStringEnumSchema = z.enum(etoileAsStringEnumValues);
export type EtoileAsString = (typeof etoileAsStringEnumValues)[number];
