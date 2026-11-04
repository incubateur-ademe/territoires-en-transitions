import { boolean, index, pgTable, primaryKey, text } from 'drizzle-orm/pg-core';
import { demarcheDocumentDefinitionTable } from './demarche-document-definition.table';

/**
 * Substitution entre pièces attendues : déposer `substitutId` couvre
 * `documentId`. C'est ainsi qu'un document global couvre des sections.
 *
 * `automatic` distingue les deux sens de lecture : d'office, le dépôt du
 * substitut suffit ; sinon, il ouvre seulement à la collectivité la possibilité
 * de déclarer la pièce comprise dedans, pièce par pièce.
 *
 * `isDetectionRequired` : la case n'est proposée que si l'analyse du fichier
 * déposé pour `substitutId` y a trouvé `documentId`.
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
    automatic: boolean('automatic').notNull().default(true),
    isDetectionRequired: boolean('is_detection_required')
      .notNull()
      .default(false),
  },
  (table) => [
    primaryKey({ columns: [table.documentId, table.substitutId] }),
    index('demarche_document_substitution_substitut_id_idx').on(
      table.substitutId
    ),
  ]
);
