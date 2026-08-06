import { createdAt, createdBy } from '@tet/backend/utils/column.utils';
import type { DemarcheDocumentCouvertureSource } from '@tet/domain/demarches';
import { index, integer, pgTable, primaryKey, text } from 'drizzle-orm/pg-core';
import { demarcheDocumentDefinitionTable } from './demarche-document-definition.table';
import { demarcheTable } from './demarche.table';

/**
 * Déclaration qu'une pièce attendue est couverte sans dépôt de document
 * (aujourd'hui : comprise dans le plan d'actions suivi sur la plateforme).
 * Table distincte de `demarche_document`, dont le tronc commun impose un
 * fichier ou un lien.
 */
export const demarcheDocumentCouvertureTable = pgTable(
  'demarche_document_couverture',
  {
    demarcheId: integer('demarche_id')
      .notNull()
      .references(() => demarcheTable.id, { onDelete: 'cascade' }),
    documentId: text('document_id')
      .notNull()
      .references(() => demarcheDocumentDefinitionTable.id),
    source: text('source').notNull().$type<DemarcheDocumentCouvertureSource>(),
    createdAt,
    createdBy,
  },
  (table) => [
    primaryKey({
      columns: [table.demarcheId, table.documentId, table.source],
    }),
    index('demarche_document_couverture_document_id_idx').on(table.documentId),
  ]
);
