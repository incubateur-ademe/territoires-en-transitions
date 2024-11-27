import { pgEnum } from 'drizzle-orm/pg-core';

export enum MembreFonctionEnum {
  CONSEILLER = 'conseiller',
  TECHNIQUE = 'technique',
  POLITIQUE = 'politique',
  PARTENAIRE = 'partenaire',
}

export const membreFonctionEnum = pgEnum('membre_fonction', [
  MembreFonctionEnum.CONSEILLER,
  MembreFonctionEnum.TECHNIQUE,
  MembreFonctionEnum.POLITIQUE,
  MembreFonctionEnum.PARTENAIRE,
] as const);
