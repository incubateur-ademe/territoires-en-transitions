import { createdAt, modifiedAt } from '@tet/backend/utils/column.utils';
import type { DemarchePcaetTopicKind } from '@tet/domain/demarches';
import { integer, pgTable, serial, text } from 'drizzle-orm/pg-core';

/**
 * Référentiel des topics du diagnostic PCAET : un onglet de l'écran
 * « Compléter le diagnostic et les objectifs », avec l'unité et les horizons
 * réglementaires communs à ses lignes.
 */
export const demarchePcaetTopicTable = pgTable('demarche_pcaet_topic', {
  id: serial('id').primaryKey().notNull(),
  code: text('code').notNull(),
  label: text('label').notNull(),
  /** Nom de l'icône RemixIcon de l'onglet. */
  icon: text('icon').notNull(),
  kind: text('kind').notNull().$type<DemarchePcaetTopicKind>(),
  /** Nom métier des lignes de premier niveau (Secteur, Polluant, Vecteur…). */
  groupLabel: text('group_label'),
  /** Nom métier des lignes de second niveau, NULL si le topic est à un niveau. */
  rowLabel: text('row_label'),
  unit: text('unit'),
  /** Indicateur agrégé du topic. */
  referentielId: text('referentiel_id'),
  horizons: integer('horizons').array().notNull(),
  displayOrder: integer('display_order').notNull(),
  createdAt,
  modifiedAt,
});
