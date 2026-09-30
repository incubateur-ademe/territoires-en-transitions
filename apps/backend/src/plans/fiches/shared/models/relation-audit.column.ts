import {
  SQL_CURRENT_TIMESTAMP,
  TIMESTAMP_OPTIONS,
} from '@tet/backend/utils/column.utils';
import { timestamp, uuid } from 'drizzle-orm/pg-core';

/**
 * Auteur et date de création d'une relation entre une fiche (ou un axe) et
 * l'objet qui lui est rattaché.
 *
 * Nullables, comme en base : les relations antérieures à l'ajout de ces
 * colonnes n'ont ni auteur ni date connus. createdBy n'a pas de défaut
 * auth.uid() (toujours null sous connexion Drizzle) : l'application le
 * renseigne à chaque insertion, et une contrainte CHECK NOT VALID rejette en
 * base toute nouvelle ligne qui en serait dépourvue.
 */
export const relationAuditColumns = {
  createdAt: timestamp('created_at', TIMESTAMP_OPTIONS).default(
    SQL_CURRENT_TIMESTAMP
  ),
  createdBy: uuid('created_by'),
};
