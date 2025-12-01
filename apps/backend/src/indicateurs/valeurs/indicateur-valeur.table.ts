import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import {
  createdAt,
  createdBy,
  modifiedAt,
  modifiedBy,
} from '@tet/backend/utils/column.utils';
import {
  IndicateurDefinition,
  IndicateurSourceMetadonnee,
  IndicateurValeur,
} from '@tet/domain/indicateurs';
import {
  boolean,
  date,
  doublePrecision,
  integer,
  pgTable,
  serial,
  text,
} from 'drizzle-orm/pg-core';
import { indicateurDefinitionTable } from '../definitions/indicateur-definition.table';
import { indicateurSourceMetadonneeTable } from '../shared/models/indicateur-source-metadonnee.table';

export const indicateurValeurTable = pgTable('indicateur_valeur', {
  id: serial('id').primaryKey(),
  collectiviteId: integer('collectivite_id')
    .notNull()
    .references(() => collectiviteTable.id, {
      onDelete: 'cascade',
    }),
  indicateurId: integer('indicateur_id')
    .notNull()
    .references(() => indicateurDefinitionTable.id, {
      onDelete: 'cascade',
    }),
  dateValeur: date('date_valeur').notNull(),
  metadonneeId: integer('metadonnee_id').references(
    () => indicateurSourceMetadonneeTable.id,
    {
      onDelete: 'cascade',
    }
  ),
  resultat: doublePrecision('resultat'),
  resultatCommentaire: text('resultat_commentaire'),
  objectif: doublePrecision('objectif'),
  objectifCommentaire: text('objectif_commentaire'),
  estimation: doublePrecision('estimation'),
  calculAuto: boolean('calcul_auto').default(false),
  calculAutoIdentifiantsManquants: text(
    'calcul_auto_identifiants_manquants'
  ).array(),
  createdAt,
  modifiedAt,
  createdBy,
  modifiedBy,
});

export interface IndicateurValeurAvecMetadonnesDefinition {
  indicateur_valeur: IndicateurValeur;

  indicateur_definition: IndicateurDefinition | null;

  indicateur_source_metadonnee: IndicateurSourceMetadonnee | null;

  confidentiel?: boolean | null;
}
