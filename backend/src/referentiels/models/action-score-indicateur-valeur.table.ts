import { collectiviteId } from '@/backend/collectivites/collectivite-id.column';
import {
  indicateurDefinitionTable,
  indicateurValeurTable,
} from '@/backend/indicateurs/index-domain';
import { actionDefinitionTable } from '@/backend/referentiels/index-domain';
import { createEnumObject } from '@/backend/utils/enum.utils';
import { sql } from 'drizzle-orm';
import { check, integer, pgTable, text, varchar } from 'drizzle-orm/pg-core';

const typeScore = ['fait', 'programme'] as const;
export const typeScoreEnum = createEnumObject(typeScore);

export const actionScoreIndicateurValeurTable = pgTable(
  'action_score_indicateur_valeur',
  {
    ...collectiviteId,
    actionId: varchar('action_id', { length: 30 })
      .references(() => actionDefinitionTable.actionId, { onDelete: 'cascade' })
      .notNull(),
    indicateurId: integer('indicateur_id')
      .references(() => indicateurDefinitionTable.id, { onDelete: 'cascade' })
      .notNull(),
    indicateurValeurId: integer('indicateur_valeur_id')
      .references(() => indicateurValeurTable.id, { onDelete: 'cascade' })
      .notNull(),
    typeScore: text('type_score', { enum: typeScore }).notNull(),
  },
  (table) => [
    check(
      'action_score_indicateur_valeur_type_score_check',
      sql`${table.typeScore} = ANY (ARRAY${JSON.stringify(typeScore)})`
    ),
  ]
);
