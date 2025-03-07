import { getEnumValues } from '@/domain/utils';
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
import { getReferentielScoresResponseSchema } from '../compute-score/get-referentiel-scores.response';
import { auditTable } from '../labellisations/audit.table';
import {
  referentielDefinitionTable,
  referentielIdVarchar,
} from '../models/referentiel-definition.table';

export const SnapshotJalonEnum = {
  SCORE_COURANT: 'score_courant', // Score courant
  DATE_PERSONNALISEE: 'date_personnalisee', // Date personnalisée
  PRE_AUDIT: 'pre_audit',
  POST_AUDIT: 'post_audit',
  VISITE_ANNUELLE: 'visite_annuelle',
  JOUR_AUTO: 'jour_auto',
} as const;

export const snapshotJalonEnumSchema = z.enum(getEnumValues(SnapshotJalonEnum));

export type SnapshotJalon = z.infer<typeof snapshotJalonEnumSchema>;

const snapshotJalonPgEnum = pgEnum('type_jalon', [
  SnapshotJalonEnum.PRE_AUDIT,
  SnapshotJalonEnum.POST_AUDIT,
  SnapshotJalonEnum.SCORE_COURANT,
  SnapshotJalonEnum.VISITE_ANNUELLE,
  SnapshotJalonEnum.DATE_PERSONNALISEE,
  SnapshotJalonEnum.JOUR_AUTO,
]);

export const snapshotTable = pgTable(
  'score_snapshot',
  {
    collectiviteId: integer('collectivite_id').notNull(),
    referentielId: referentielIdVarchar.notNull(),
    referentielVersion: varchar('referentiel_version', { length: 16 }),
    auditId: integer('audit_id'),
    date: timestamp('date', TIMESTAMP_OPTIONS).notNull(),
    ref: varchar('ref', { length: 30 }),
    nom: varchar('nom', { length: 300 }).notNull(),
    typeJalon: snapshotJalonPgEnum('type_jalon').notNull(), // not an enum in the database but in order to type it
    pointFait: doublePrecision('point_fait').notNull(),
    pointProgramme: doublePrecision('point_programme').notNull(),
    pointPasFait: doublePrecision('point_pas_fait').notNull(),
    pointPotentiel: doublePrecision('point_potentiel').notNull(),
    scores: jsonb('referentiel_scores').notNull(),
    personnalisationReponses: jsonb('personnalisation_reponses').notNull(),
    createdBy,
    createdAt,
    modifiedAt,
    modifiedBy,
  },
  (table) => [
    primaryKey({
      columns: [table.collectiviteId, table.referentielId, table.ref],
      name: 'score_snapshot_collectivite_id_referentiel_id_ref_pkey',
    }),
    foreignKey({
      columns: [table.collectiviteId],
      foreignColumns: [collectiviteTable.id],
      name: 'score_snapshot_collectivite_id_fkey',
    }),
    foreignKey({
      columns: [table.referentielId],
      foreignColumns: [referentielDefinitionTable.id],
      name: 'score_snapshot_referentiel_id_fkey',
    }),
    foreignKey({
      columns: [table.auditId],
      foreignColumns: [auditTable.id],
      name: 'score_snapshot_audit_id_fkey',
    }).onDelete('cascade'),
    unique().on(
      table.collectiviteId,
      table.referentielId,
      table.typeJalon,
      table.date
    ),
  ]
);

export const snapshotSchema = createSelectSchema(snapshotTable).extend({
  scores: getReferentielScoresResponseSchema,
  personnalisationReponses: getPersonnalitionReponsesResponseSchema,
});
export type ScoreSnapshotType = z.infer<typeof snapshotSchema>;

export const snapshotSchemaInsert = createInsertSchema(snapshotTable).extend({
  scores: getReferentielScoresResponseSchema,
  personnalisationReponses: getPersonnalitionReponsesResponseSchema,
});
export type SnapshotInsert = z.infer<typeof snapshotSchemaInsert>;
