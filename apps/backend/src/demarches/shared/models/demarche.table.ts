import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import {
  createdAt,
  createdBy,
  modifiedAt,
  modifiedBy,
  TIMESTAMP_OPTIONS,
} from '@tet/backend/utils/column.utils';
import {
  DemarchePcaetObligationEnum,
  DEMARCHE_PCAET_INITIAL_STATUS,
  type DemarchePcaetObligation,
  type DemarchePcaetStatus,
  type DemarcheType,
} from '@tet/domain/demarches';
import { InferInsertModel, InferSelectModel, sql } from 'drizzle-orm';
import {
  boolean,
  date,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

/**
 * Table unique pour tous les types de démarches (héritage par discriminant
 * `type`). Les colonnes typées « pcaet » ci-dessous représentent l'union des
 * valeurs de tous les types — à élargir à chaque nouveau type de démarche.
 */
export const demarcheTable = pgTable(
  'demarche',
  {
    id: serial('id').primaryKey().notNull(),
    collectiviteId: integer('collectivite_id')
      .notNull()
      .references(() => collectiviteTable.id, { onDelete: 'cascade' }),
    type: text('type').notNull().$type<DemarcheType>(),
    titre: text('titre').notNull(),
    description: text('description').notNull().default(''),
    status: text('status')
      .notNull()
      .default(DEMARCHE_PCAET_INITIAL_STATUS)
      .$type<DemarchePcaetStatus>(),
    obligation: text('obligation')
      .notNull()
      .default(DemarchePcaetObligationEnum.OBLIGATOIRE)
      .$type<DemarchePcaetObligation>(),
    launchedAt: timestamp('launched_at', TIMESTAMP_OPTIONS),
    publishedAt: timestamp('published_at', TIMESTAMP_OPTIONS),
    // Date civile de la délibération, pas un instant : la validité du PCAET se
    // compte en années à partir d'elle.
    adoptedAt: date('adopted_at', { mode: 'string' }),
    transmittedAt: timestamp('transmitted_at', TIMESTAMP_OPTIONS),
    // Provenance, non pas état : le statut dit où en est le dossier et oublie
    // tout une fois publié, ce drapeau dit d'où il vient et ne bouge jamais.
    transmittedOffPlatform: boolean('transmitted_off_platform')
      .notNull()
      .default(false),
    // Déclaratif : le PCAET est porté par un SCoT-AEC, un document unique
    // valant SCoT et PCAET. La compétence Banatic 5500 décide si la question
    // est posée à la collectivité, jamais de sa réponse.
    isScotAec: boolean('is_scot_aec').notNull().default(false),
    avisDeadlineAt: timestamp('avis_deadline_at', TIMESTAMP_OPTIONS),
    createdAt,
    createdBy,
    modifiedAt,
    modifiedBy,
  },
  (table) => [
    index('demarche_collectivite_id_idx').on(table.collectiviteId),
    // Une seule démarche « en cours » par collectivité et par type.
    uniqueIndex('demarche_active_unique')
      .on(table.collectiviteId, table.type)
      .where(
        sql`status IN ('en_elaboration', 'transmis_pour_avis', 'instruit_hors_plateforme')`
      ),
  ]
);

export type DemarcheRow = InferSelectModel<typeof demarcheTable>;
export type DemarcheInsert = InferInsertModel<typeof demarcheTable>;
