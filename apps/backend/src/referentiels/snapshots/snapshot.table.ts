import { PersonnalisationReponsesPayload } from '@tet/domain/collectivites';
import {
  ScoresPayload,
  SnapshotJalon,
  snapshotJalonEnumValues,
} from '@tet/domain/referentiels';
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
import { collectiviteTable } from '../../collectivites/shared/models/collectivite.table';
import {
  createdAt,
  createdBy,
  modifiedAt,
  modifiedBy,
  TIMESTAMP_OPTIONS,
} from '../../utils/column.utils';
import { auditTable } from '../labellisations/audit.table';
import { referentielDefinitionTable } from '../models/referentiel-definition.table';
import { referentielIdPgEnum } from '../referentiel-id.column';

const snapshotJalonPgEnum = pgEnum('type_jalon', snapshotJalonEnumValues);

export const snapshotTable = pgTable(
  'score_snapshot',
  {
    collectiviteId: integer('collectivite_id').notNull(),
    referentielId: referentielIdPgEnum('referentiel_id').notNull(),
    referentielVersion: varchar('referentiel_version', { length: 16 }),
    auditId: integer('audit_id'),
    date: timestamp('date', TIMESTAMP_OPTIONS).notNull(),
    jalon: snapshotJalonPgEnum('type_jalon').notNull().$type<SnapshotJalon>(), // not an enum in the database but in order to type it
    ref: varchar('ref', { length: 30 }).notNull(),
    nom: varchar('nom', { length: 300 }).notNull(),
    pointFait: doublePrecision('point_fait').notNull(),
    pointProgramme: doublePrecision('point_programme').notNull(),
    pointPasFait: doublePrecision('point_pas_fait').notNull(),
    pointPotentiel: doublePrecision('point_potentiel').notNull(),
    etoiles: integer('etoiles'),
    scoresPayload: jsonb('referentiel_scores').notNull().$type<ScoresPayload>(),
    personnalisationReponses: jsonb('personnalisation_reponses')
      .$type<PersonnalisationReponsesPayload>()
      .notNull(),
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
      table.jalon,
      table.date
    ),
  ]
);
