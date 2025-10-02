import { collectiviteId } from '@/backend/collectivites/collectivite-id.column';
import { indicateurDefinitionTable } from '@/backend/indicateurs/definitions/indicateur-definition.table';
import { indicateurValeurTable } from '@/backend/indicateurs/valeurs/indicateur-valeur.table';
import { actionDefinitionTable } from '@/backend/referentiels/models/action-definition.table';
import { typeScoreIndicatif } from '@/backend/referentiels/models/type-score-indicatif.enum';
import { sql } from 'drizzle-orm';
import { check, integer, pgTable, text, varchar } from 'drizzle-orm/pg-core';

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
    typeScore: text('type_score', { enum: typeScoreIndicatif }).notNull(),
  },
  (table) => [
    check(
      'action_score_indicateur_valeur_type_score_check',
      sql`${table.typeScore} = ANY (ARRAY${JSON.stringify(typeScoreIndicatif)})`
    ),
  ]
);
