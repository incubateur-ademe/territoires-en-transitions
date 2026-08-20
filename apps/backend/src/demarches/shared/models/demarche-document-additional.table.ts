import { documentBase } from '@tet/backend/collectivites/documents/models/document.basetable';
import type { DemarcheDocumentEtape } from '@tet/domain/demarches';
import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { index, integer, pgTable, text } from 'drizzle-orm/pg-core';
import { demarcheTable } from './demarche.table';

/**
 * Pièce additionnelle par la collectivité, hors catalogue. Même tronc commun
 * que `demarche_document`, mais aucune définition ni unicité : c'est le titre —
 * saisi avant le dépôt, d'où un `fichierId` nullable — qui identifie la pièce, et
 * la collectivité en ajoute autant qu'elle veut.
 */
export const demarcheDocumentAdditionalTable = pgTable(
  'demarche_document_additional',
  {
    ...documentBase,
    demarcheId: integer('demarche_id')
      .notNull()
      .references(() => demarcheTable.id, { onDelete: 'cascade' }),
    etape: text('etape').notNull().$type<DemarcheDocumentEtape>(),
  },
  (table) => [
    index('demarche_document_additional_demarche_id_etape_idx').on(
      table.demarcheId,
      table.etape
    ),
    index('demarche_document_additional_collectivite_id_idx').on(
      table.collectiviteId
    ),
  ]
);

export type DemarcheDocumentAdditionalRow = InferSelectModel<
  typeof demarcheDocumentAdditionalTable
>;
export type DemarcheDocumentAdditionalInsert = InferInsertModel<
  typeof demarcheDocumentAdditionalTable
>;
