import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import {
  createdAt,
  createdBy,
  modifiedAt,
  modifiedBy,
} from '@tet/backend/utils/column.utils';
import { boolean, integer, pgTable, serial, text } from 'drizzle-orm/pg-core';

/**
 * Domaines et milieux de vulnérabilité du territoire. Une seule table pour le
 * socle du cadre de dépôt (`collectiviteId` nul, ni renommable ni supprimable)
 * et les domaines ajoutés par une collectivité, partagés par toutes ses
 * démarches : les valeurs n'ont ainsi qu'une clé étrangère à suivre.
 */
export const demarchePcaetVulnerabiliteDomaineTable = pgTable(
  'demarche_pcaet_vulnerabilite_domaine',
  {
    id: serial('id').primaryKey().notNull(),
    /** Identifiant métier stable du socle, nul pour un domaine ajouté. */
    code: text('code'),
    label: text('label').notNull(),
    /** Collectivité propriétaire du domaine ajouté, nul pour le socle. */
    collectiviteId: integer('collectivite_id').references(
      () => collectiviteTable.id,
      { onDelete: 'cascade' }
    ),
    /** Un domaine requis doit être renseigné pour que le volet soit complet. */
    requis: boolean('requis').notNull().default(true),
    displayOrder: integer('display_order').notNull(),
    createdAt,
    createdBy,
    modifiedAt,
    modifiedBy,
  }
);
