import { collectiviteId } from '@tet/backend/collectivites/collectivite-id.column';
import { indicateurDefinitionTable } from '@tet/backend/indicateurs/definitions/indicateur-definition.table';
import { indicateurValeurTable } from '@tet/backend/indicateurs/valeurs/indicateur-valeur.table';
import { actionDefinitionTable } from '@tet/backend/referentiels/models/action-definition.table';
import { scoreIndicatifTypeEnumValues } from '@tet/domain/referentiels';
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
    typeScore: text('type_score', {
      enum: scoreIndicatifTypeEnumValues,
    }).notNull(),
  },
  (table) => [
    check(
      'action_score_indicateur_valeur_type_score_check',
      sql`${table.typeScore} = ANY (ARRAY${JSON.stringify(
        scoreIndicatifTypeEnumValues
      )})`
    ),
  ]
);
