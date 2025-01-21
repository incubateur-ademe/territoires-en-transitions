import {
  doublePrecision,
  foreignKey,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  timestamp,
  unique,
  varchar,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import z from 'zod';
import { collectiviteTable } from '../../collectivites/shared/models/collectivite.table';
import { getPersonnalitionReponsesResponseSchema } from '../../personnalisations/models/get-personnalisation-reponses.response';
import {
  createdAt,
  createdBy,
  modifiedAt,
  modifiedBy,
  TIMESTAMP_OPTIONS,
} from '../../utils/column.utils';
import { getReferentielScoresResponseSchema } from '../models/get-referentiel-scores.response';
import { labellisationAuditTable } from '../models/labellisation-audit.table';
import {
  referentielDefinitionTable,
  referentielIdVarchar,
} from '../models/referentiel-definition.table';
import { SnapshotJalon } from './snapshot-jalon.enum';

const scoreJalonEnumValues = pgEnum('type_jalon', [
  SnapshotJalon.PRE_AUDIT,
  SnapshotJalon.POST_AUDIT,
  SnapshotJalon.SCORE_COURANT,
  SnapshotJalon.VISITE_ANNUELLE,
  SnapshotJalon.DATE_PERSONNALISEE,
  SnapshotJalon.JOUR_AUTO,
]);

export const scoreSnapshotTable = pgTable(
  'score_snapshot',
  {
    collectiviteId: integer('collectivite_id').notNull(),
    referentielId: referentielIdVarchar.notNull(),
    referentielVersion: varchar('referentiel_version', { length: 16 }),
    auditId: integer('audit_id'),
    date: timestamp('date', TIMESTAMP_OPTIONS).notNull(),
    ref: varchar('ref', { length: 30 }),
    nom: varchar('nom', { length: 300 }).notNull(),
    typeJalon: scoreJalonEnumValues('type_jalon').notNull(), // not an enum in the database but in order to type it
    pointFait: doublePrecision('point_fait').notNull(),
    pointProgramme: doublePrecision('point_programme').notNull(),
    pointPasFait: doublePrecision('point_pas_fait').notNull(),
    pointPotentiel: doublePrecision('point_potentiel').notNull(),
    referentielScores: jsonb('referentiel_scores').notNull(),
    personnalisationReponses: jsonb('personnalisation_reponses').notNull(),
    createdBy,
    createdAt,
    modifiedAt,
    modifiedBy,
  },
  (table) => {
    return {
      scoreSnapshotCollectiviteIdReferentielIdRefPkey: primaryKey({
        columns: [table.collectiviteId, table.referentielId, table.ref],
        name: 'score_snapshot_collectivite_id_referentiel_id_ref_pkey',
      }),
      scoreSnapshotCollectiviteIdFkey: foreignKey({
        columns: [table.collectiviteId],
        foreignColumns: [collectiviteTable.id],
        name: 'score_snapshot_collectivite_id_fkey',
      }),
      scoreSnapshotReferentielIdFkey: foreignKey({
        columns: [table.referentielId],
        foreignColumns: [referentielDefinitionTable.id],
        name: 'score_snapshot_referentiel_id_fkey',
      }),
      scoreSnapshotAuditIdFkey: foreignKey({
        columns: [table.auditId],
        foreignColumns: [labellisationAuditTable.id],
        name: 'score_snapshot_audit_id_fkey',
      }).onDelete('cascade'),
      scoreSnapshotUnique: unique().on(
        table.collectiviteId,
        table.referentielId,
        table.typeJalon,
        table.date
      ),
    };
  }
);

export const scoreSnapshotSchema = createSelectSchema(
  scoreSnapshotTable
).extend({
  referentielScores: getReferentielScoresResponseSchema,
  personnalisationReponses: getPersonnalitionReponsesResponseSchema,
});
export type ScoreSnapshotType = z.infer<typeof scoreSnapshotSchema>;

export const createScoreSnapshotSchema = createInsertSchema(
  scoreSnapshotTable
).extend({
  referentielScores: getReferentielScoresResponseSchema,
  personnalisationReponses: getPersonnalitionReponsesResponseSchema,
});
export type CreateScoreSnapshotType = z.infer<typeof createScoreSnapshotSchema>;
