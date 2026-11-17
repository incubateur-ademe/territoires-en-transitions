import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';
import { createdAt, createdBy } from '@tet/backend/utils/column.utils';
import { DemarchePcaetTransitionEnum } from '@tet/domain/demarches';
import { InferSelectModel } from 'drizzle-orm';
import { integer, pgTable, serial, text, unique } from 'drizzle-orm/pg-core';

/** Les deux transitions qui figent les classeurs d'un dépôt. */
export const DEMARCHE_PCAET_EXPORT_TRANSITIONS = [
  DemarchePcaetTransitionEnum.TRANSMETTRE_POUR_AVIS,
  DemarchePcaetTransitionEnum.PUBLIER,
] as const;
export type DemarchePcaetExportTransition =
  (typeof DEMARCHE_PCAET_EXPORT_TRANSITIONS)[number];

/**
 * `plan_expurge` est le classeur plan sans les fiches restreintes, servi aux
 * lecteurs qui ne les voient pas à l'écran. Il n'existe que si le plan en
 * compte au moins une, et n'est pas la version de la consultation publique.
 */
export const DEMARCHE_PCAET_EXPORT_TYPES = [
  'plan',
  'plan_expurge',
  'indicateurs',
] as const;
export type DemarchePcaetExportType =
  (typeof DEMARCHE_PCAET_EXPORT_TYPES)[number];

/**
 * Classeurs figés à la soumission d'un PCAET. Les lignes d'une transition sont
 * écrites ensemble, dans la transaction de la transition : l'absence de
 * `plan_expurge` veut dire « aucune fiche restreinte », jamais « génération
 * incomplète ».
 */
export const demarchePcaetExportTable = pgTable(
  'demarche_pcaet_export',
  {
    id: serial('id').primaryKey().notNull(),
    demarcheId: integer('demarche_id')
      .notNull()
      .references(() => demarcheTable.id, { onDelete: 'cascade' }),
    transition: text('transition', {
      enum: DEMARCHE_PCAET_EXPORT_TRANSITIONS,
    }).notNull(),
    type: text('type', { enum: DEMARCHE_PCAET_EXPORT_TYPES }).notNull(),
    /** Chemin de l'objet dans le bucket des exports. */
    storagePath: text('storage_path').notNull(),
    /** Nom proposé au téléchargement. */
    filename: text('filename').notNull(),
    createdAt,
    createdBy,
  },
  (table) => [
    unique('demarche_pcaet_export_demarche_transition_type_key').on(
      table.demarcheId,
      table.transition,
      table.type
    ),
  ]
);

export type DemarchePcaetExportRow = InferSelectModel<
  typeof demarchePcaetExportTable
>;
