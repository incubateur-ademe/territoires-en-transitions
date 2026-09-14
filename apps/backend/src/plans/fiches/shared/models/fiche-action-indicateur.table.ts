import { indicateurDefinitionTable } from '@tet/backend/indicateurs/definitions/indicateur-definition.table';
import { createdAt } from '@tet/backend/utils/column.utils';
import { integer, pgEnum, pgTable, primaryKey, uuid } from 'drizzle-orm/pg-core';
import z from 'zod';
import { ficheActionTable } from './fiche-action.table';

export const ficheActionIndicateurTable = pgTable(
  'fiche_action_indicateur',
  {
    ficheId: integer('fiche_id')
      .notNull()
      .references(() => ficheActionTable.id),
    indicateurId: integer('indicateur_id')
      .notNull()
      .references(() => indicateurDefinitionTable.id),
    createdAt,
    // Pas de defaut auth.uid() : renseigné obligatoirement par l'application
    // (le backend n'utilise pas la connexion Supabase authentifiée).
    createdBy: uuid('created_by').notNull(),
  },
  (table) => [primaryKey({ columns: [table.ficheId, table.indicateurId] })]
);

export const indicateurAssociesValues = [
  'Fiches avec indicateurs',
  'Fiches sans indicateurs',
] as const;
export const indicateurAssociesEnumSchema = z.enum(indicateurAssociesValues);
export const indicateurAssociesPgEnum = pgEnum(
  'fiche_action_indicateurs_associes',
  indicateurAssociesValues
);
export type IndicateurAssocies = z.infer<typeof indicateurAssociesEnumSchema>;
