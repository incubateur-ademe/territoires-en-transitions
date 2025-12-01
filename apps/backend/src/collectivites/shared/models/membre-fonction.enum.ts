import { createEnumObject } from '@tet/domain/utils';
import { pgEnum } from 'drizzle-orm/pg-core';

export const MembreFonction = [
  'conseiller',
  'technique',
  'politique',
  'partenaire',
] as const;

export type MembreFonction = (typeof MembreFonction)[number];

export const MembreFonctionEnum = createEnumObject(MembreFonction);

export const membreFonctionEnum = pgEnum('membre_fonction', MembreFonction);
