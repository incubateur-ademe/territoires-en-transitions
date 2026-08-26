import { documentBase } from '@tet/backend/collectivites/documents/models/document.basetable';
import type { DemarcheDocumentEtape } from '@tet/domain/demarches';
import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import {
  index,
  integer,
  pgTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { demarcheDocumentDefinitionTable } from './demarche-document-definition.table';
import { demarcheTable } from './demarche.table';

/**
 * Pièce déposée pour une démarche. Reprend le tronc commun des documents
 * attachés (fichier de la bibliothèque de la collectivité ou lien, commentaire,
 * auteur de la dernière modification).
 */
export const demarcheDocumentTable = pgTable(
  'demarche_document',
  {
    ...documentBase,
    demarcheId: integer('demarche_id')
      .notNull()
      .references(() => demarcheTable.id, { onDelete: 'cascade' }),
    documentId: text('document_id')
      .notNull()
      .references(() => demarcheDocumentDefinitionTable.id),
    /**
     * Temps du dossier où cette version a été déposée. Une pièce de portée
     * `both` en a jusqu'à deux : sa reprise après les avis n'écrase pas la
     * version transmise, sur laquelle l'instruction porte.
     */
    etape: text('etape').notNull().$type<DemarcheDocumentEtape>(),
  },
  (table) => [
    // « Remplacer » reste un upsert, mais à temps égal : une version par
    // (démarche, pièce, temps).
    uniqueIndex('demarche_document_demarche_id_document_id_etape_key').on(
      table.demarcheId,
      table.documentId,
      table.etape
    ),
    index('demarche_document_collectivite_id_idx').on(table.collectiviteId),
    index('demarche_document_document_id_idx').on(table.documentId),
  ]
);

export type DemarcheDocumentRow = InferSelectModel<
  typeof demarcheDocumentTable
>;
export type DemarcheDocumentInsert = InferInsertModel<
  typeof demarcheDocumentTable
>;
