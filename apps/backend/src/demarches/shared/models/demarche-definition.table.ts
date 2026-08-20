import { createdAt, modifiedAt } from '@tet/backend/utils/column.utils';
import type { DemarcheType } from '@tet/domain/demarches';
import { InferSelectModel } from 'drizzle-orm';
import { boolean, pgTable, text } from 'drizzle-orm/pg-core';

/**
 * Configuration d'un type de démarche : ce que le dépôt autorise, au-delà du
 * catalogue des pièces attendues (`demarche_document_definition`). Une ligne par
 * type, seedée par migration — un nouveau type se configure sans toucher au code.
 */
export const demarcheDefinitionTable = pgTable('demarche_definition', {
  demarcheType: text('demarche_type')
    .primaryKey()
    .notNull()
    .$type<DemarcheType>(),
  documentsAdditionalAmont: boolean('documents_additional_amont')
    .notNull()
    .default(false),
  documentsAdditionalAval: boolean('documents_additional_aval')
    .notNull()
    .default(false),
  /** Extensions acceptées, sans le point. `null` : aucune restriction propre au type. */
  documentsFormatsAutorises: text('documents_formats_autorises').array(),
  documentsMimeTypesAutorises: text('documents_mime_types_autorises').array(),
  createdAt,
  modifiedAt,
});

export type DemarcheDefinitionRow = InferSelectModel<
  typeof demarcheDefinitionTable
>;
