import { secteurReglementaireEnumValues } from '@tet/domain/plans';
import { pgEnum } from 'drizzle-orm/pg-core';

export const secteurReglementairePgEnum = pgEnum(
  'secteur_reglementaire',
  secteurReglementaireEnumValues
);
