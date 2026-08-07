import { index, pgTable, primaryKey, text } from 'drizzle-orm/pg-core';
import { demarcheDocumentDefinitionTable } from './demarche-document-definition.table';

/**
 * Substitution déclarative entre pièces attendues : déposer `substitutId` couvre
 * `documentId`. C'est ainsi que le document global couvre toutes les sections.
 */
export const demarcheDocumentSubstitutionTable = pgTable(
  'demarche_document_substitution',
  {
    documentId: text('document_id')
      .notNull()
      .references(() => demarcheDocumentDefinitionTable.id, {
        onDelete: 'cascade',
      }),
    substitutId: text('substitut_id')
      .notNull()
      .references(() => demarcheDocumentDefinitionTable.id, {
        onDelete: 'cascade',
      }),
  },
  (table) => [
    primaryKey({ columns: [table.documentId, table.substitutId] }),
    index('demarche_document_substitution_substitut_id_idx').on(
      table.substitutId
    ),
  ]
);
