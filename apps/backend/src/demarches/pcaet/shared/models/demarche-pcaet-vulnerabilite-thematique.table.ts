import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import {
  createdAt,
  createdBy,
  modifiedAt,
  modifiedBy,
} from '@tet/backend/utils/column.utils';
import { boolean, integer, pgTable, serial, text } from 'drizzle-orm/pg-core';

/**
 * Thématiques et milieux de vulnérabilité du territoire. Une seule table pour le
 * socle du cadre de dépôt (`collectiviteId` nul, ni renommable ni supprimable)
 * et les thématiques ajoutées par une collectivité, partagées par toutes ses
 * démarches : les valeurs n'ont ainsi qu'une clé étrangère à suivre.
 */
export const demarchePcaetVulnerabiliteThematiqueTable = pgTable(
  'demarche_pcaet_vulnerabilite_thematique',
  {
    id: serial('id').primaryKey().notNull(),
    /** Identifiant métier stable du socle, nul pour une thématique ajoutée. */
    code: text('code'),
    label: text('label').notNull(),
    /** Collectivité propriétaire de la thématique ajoutée, nul pour le socle. */
    collectiviteId: integer('collectivite_id').references(
      () => collectiviteTable.id,
      { onDelete: 'cascade' }
    ),
    /** Une thématique requise doit être renseignée pour que le volet soit complet. */
    requis: boolean('requis').notNull().default(true),
    displayOrder: integer('display_order').notNull(),
    createdAt,
    createdBy,
    modifiedAt,
    modifiedBy,
  }
);
