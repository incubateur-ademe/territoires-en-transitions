import { createEnumObject } from '@/backend/utils/index-domain';
import { pgEnum } from 'drizzle-orm/pg-core';

export const MembreFonction = [
  'conseiller',
  'technique',
  'politique',
  'partenaire',
] as const;

export const MembreFonctionEnum = createEnumObject(MembreFonction);

export const membreFonctionEnum = pgEnum('membre_fonction', MembreFonction);
