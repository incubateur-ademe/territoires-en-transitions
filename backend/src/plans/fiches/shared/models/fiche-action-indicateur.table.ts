import { indicateurDefinitionTable } from '@/backend/indicateurs/shared/models/indicateur-definition.table';
import { integer, pgEnum, pgTable, primaryKey } from 'drizzle-orm/pg-core';
import z from 'zod';
import { ficheActionTable } from './fiche-action.table';

export const ficheActionIndicateurTable = pgTable(
  'fiche_action_indicateur',
  {
    ficheId: integer('fiche_id').references(() => ficheActionTable.id),
    indicateurId: integer('indicateur_id').references(
      () => indicateurDefinitionTable.id
    ),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.ficheId, table.indicateurId] }),
    };
  }
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
