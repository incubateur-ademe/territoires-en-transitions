import { createdAt, TIMESTAMP_OPTIONS } from '@tet/backend/utils/column.utils';
import type {
  DemarcheDocumentDetectionPartie,
  DemarcheDocumentDetectionStatus,
} from '@tet/domain/demarches';
import { InferSelectModel } from 'drizzle-orm';
import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core';
import { demarcheDocumentDefinitionTable } from './demarche-document-definition.table';
import { demarcheTable } from './demarche.table';

/**
 * Analyse automatique d'un fichier déposé (`documentId`) : contient-il la pièce
 * `includedDocumentId` ? Une ligne par couple, remise à `pending` à chaque
 * nouveau fichier ; `fichierId` dit lequel a été lu.
 */
export const demarcheDocumentDetectionTable = pgTable(
  'demarche_document_detection',
  {
    id: serial('id').primaryKey(),
    demarcheId: integer('demarche_id')
      .notNull()
      .references(() => demarcheTable.id, { onDelete: 'cascade' }),
    documentId: text('document_id')
      .notNull()
      .references(() => demarcheDocumentDefinitionTable.id, {
        onDelete: 'cascade',
      }),
    includedDocumentId: text('included_document_id')
      .notNull()
      .references(() => demarcheDocumentDefinitionTable.id, {
        onDelete: 'cascade',
      }),
    fichierId: integer('fichier_id').notNull(),
    status: text('status')
      .notNull()
      .default('pending')
      .$type<DemarcheDocumentDetectionStatus>(),
    isIncluded: boolean('is_included'),
    parties: text('parties')
      .array()
      .notNull()
      .default([])
      .$type<DemarcheDocumentDetectionPartie[]>(),
    sectionTitle: text('section_title'),
    pages: text('pages').array().notNull().default([]),
    justification: text('justification').notNull().default(''),
    model: text('model'),
    createdAt,
    analyzedAt: timestamp('analyzed_at', TIMESTAMP_OPTIONS),
  },
  (table) => [
    unique('demarche_document_detection_unique').on(
      table.demarcheId,
      table.documentId,
      table.includedDocumentId
    ),
  ]
);

export type DemarcheDocumentDetectionRow = InferSelectModel<
  typeof demarcheDocumentDetectionTable
>;
