import { pgTable, unique, varchar } from 'drizzle-orm/pg-core';
import { actionDefinitionTable } from '../models/action-definition.table';
import { referentielDefinitionTable } from '../models/referentiel-definition.table';

/**
 * Lien complémentaire (colonne `origineTexte`) entre une action du nouveau référentiel
 * et une action d'un ancien référentiel, sans pondération
 */
export const actionOrigineTexteTable = pgTable(
  'action_origine_texte',
  {
    referentielId: varchar('referentiel_id', { length: 30 })
      .references(() => referentielDefinitionTable.id)
      .notNull(),
    actionId: varchar('action_id', { length: 30 })
      .references(() => actionDefinitionTable.actionId)
      .notNull(),
    origineReferentielId: varchar('origine_referentiel_id', {
      length: 30,
    })
      .references(() => referentielDefinitionTable.id)
      .notNull(),
    origineActionId: varchar('origine_action_id', { length: 30 })
      .references(() => actionDefinitionTable.actionId)
      .notNull(),
  },
  (t) => [
    unique().on(
      t.referentielId,
      t.actionId,
      t.origineReferentielId,
      t.origineActionId
    ),
  ]
);
