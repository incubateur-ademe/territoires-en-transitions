import { createdAt, modifiedAt } from '@tet/backend/utils/column.utils';
import type {
  DemarcheDocumentEtape,
  DemarcheType,
} from '@tet/domain/demarches';
import { InferSelectModel } from 'drizzle-orm';
import { boolean, index, integer, pgTable, text } from 'drizzle-orm/pg-core';

/**
 * Catalogue des pièces attendues au dépôt, par type de démarche (même héritage
 * par discriminant que `demarche`). Données de référence seedées par la
 * migration, pas de liste en dur dans le code.
 */
export const demarcheDocumentDefinitionTable = pgTable(
  'demarche_document_definition',
  {
    id: text('id').primaryKey().notNull(),
    demarcheType: text('demarche_type').notNull().$type<DemarcheType>(),
    nom: text('nom').notNull(),
    description: text('description').notNull().default(''),
    requis: boolean('requis').notNull().default(true),
    ordre: integer('ordre').notNull(),
    etape: text('etape')
      .notNull()
      .default('amont')
      .$type<DemarcheDocumentEtape>(),
    /** Condition d'assujettissement de la collectivité ; nulle = pièce attendue de tous. */
    exprApplicable: text('expr_applicable'),
    createdAt,
    modifiedAt,
  },
  (table) => [
    index('demarche_document_definition_demarche_type_ordre_idx').on(
      table.demarcheType,
      table.ordre
    ),
  ]
);

export type DemarcheDocumentDefinitionRow = InferSelectModel<
  typeof demarcheDocumentDefinitionTable
>;
