import { thematiqueTable } from '@/backend/shared/thematiques/thematique.table';
import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { integer, pgTable, primaryKey } from 'drizzle-orm/pg-core';
import { createSelectSchema } from 'drizzle-zod';
import z from 'zod';
import { indicateurDefinitionTable } from './indicateur-definition.table';

export const indicateurThematiqueTable = pgTable(
  'indicateur_thematique',
  {
    indicateurId: integer('indicateur_id').references(
      () => indicateurDefinitionTable.id,
      {
        onDelete: 'cascade',
      }
    ),
    thematiqueId: integer('thematique_id').references(
      () => thematiqueTable.id,
      {
        onDelete: 'cascade',
      }
    ),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.indicateurId, table.thematiqueId] }),
    };
  }
);

export type IndicateurThematique = InferSelectModel<
  typeof indicateurThematiqueTable
>;
export type CreateIndicateurThematique = InferInsertModel<
  typeof indicateurThematiqueTable
>;

export const indicateurThematiqueSchema = createSelectSchema(
  indicateurThematiqueTable
);

export type IndicateurThematiqueSchema = z.infer<typeof indicateurThematiqueSchema>;
