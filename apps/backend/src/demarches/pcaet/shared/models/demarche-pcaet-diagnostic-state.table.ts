import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';
import {
  createdAt,
  createdBy,
  modifiedAt,
  modifiedBy,
} from '@tet/backend/utils/column.utils';
import { integer, pgTable, primaryKey } from 'drizzle-orm/pg-core';
import { demarchePcaetTopicTable } from './demarche-pcaet-topic.table';

/**
 * Réglages du diagnostic propres à une démarche. Les valeurs elles-mêmes vivent
 * dans `indicateur_valeur`, partagées avec les pages indicateurs : seule
 * l'année de comptabilisation appartient au dépôt.
 */
export const demarchePcaetDiagnosticStateTable = pgTable(
  'demarche_pcaet_diagnostic_state',
  {
    demarcheId: integer('demarche_id')
      .notNull()
      .references(() => demarcheTable.id, { onDelete: 'cascade' }),
    topicId: integer('topic_id')
      .notNull()
      .references(() => demarchePcaetTopicTable.id, { onDelete: 'cascade' }),
    /** Année de comptabilisation choisie par la collectivité. */
    referenceYear: integer('reference_year').notNull(),
    /** Années ajoutées en colonnes, au-delà des horizons réglementaires. */
    extraYears: integer('extra_years').array().notNull(),
    createdAt,
    createdBy,
    modifiedAt,
    modifiedBy,
  },
  (table) => [primaryKey({ columns: [table.demarcheId, table.topicId] })]
);
