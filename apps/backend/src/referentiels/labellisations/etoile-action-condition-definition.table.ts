import { actionDefinitionTable } from '@tet/backend/referentiels/models/action-definition.table';
import {
  doublePrecision,
  integer,
  pgTable,
  text,
  varchar,
} from 'drizzle-orm/pg-core';
import { referentielDefinitionTable } from '../models/referentiel-definition.table';
import { etoileToInteger } from './etoile-definition.table';

export const etoileActionConditionDefinitionTable = pgTable(
  'labellisation_action_critere',
  {
    etoile: etoileToInteger('etoile').notNull(),
    priorite: integer('prio').notNull(),
    referentielId: varchar('referentiel', { length: 30 })
      .notNull()
      .references(() => referentielDefinitionTable.id),
    actionId: varchar('action_id', { length: 30 })
      .references(() => actionDefinitionTable.actionId)
      .notNull(),
    formulation: text('formulation').notNull(),
    minRealisePercentage: integer('min_realise_percentage').notNull(),
    minProgrammePercentage: integer('min_programme_percentage'),
    minRealiseScore: doublePrecision('min_realise_score'),
    minProgrammeScore: doublePrecision('min_programme_score'),
  }
);

export type EtoileActionConditionDefinition =
  typeof etoileActionConditionDefinitionTable.$inferSelect;
