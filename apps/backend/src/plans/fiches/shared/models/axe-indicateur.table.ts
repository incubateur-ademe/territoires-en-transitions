import { axeTable } from './axe.table';
import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { integer, pgTable, primaryKey } from 'drizzle-orm/pg-core';
import { createSelectSchema } from 'drizzle-zod';
import z from 'zod';
import { indicateurDefinitionTable } from '@/backend/indicateurs/definitions/indicateur-definition.table';

export const axeIndicateurTable = pgTable(
  'axe_indicateur',
  {
    indicateurId: integer('indicateur_id').references(
      () => indicateurDefinitionTable.id,
      { onDelete: 'cascade' }
    ),
    axeId: integer('axe_id').references(() => axeTable.id, {
      onDelete: 'cascade',
    }),
  },
  (table) => [primaryKey({ columns: [table.indicateurId, table.axeId] })]
);

export type AxeIndicateur = InferSelectModel<typeof axeIndicateurTable>;
export type CreateAxeIndicateur = InferInsertModel<typeof axeIndicateurTable>;

export const axeIndicateurSchema = createSelectSchema(axeIndicateurTable);

export type AxeIndicateurSchema = z.infer<typeof axeIndicateurSchema>;
