import { historiqueSchema } from '@tet/backend/collectivites/personnalisations/models/historique-reponse-choix.table';
import {
  boolean,
  integer,
  serial,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { TIMESTAMP_OPTIONS } from '../../../../utils/column.utils';

export const historiqueFicheActionTable = historiqueSchema.table(
  'fiche_action',
  {
    id: serial('id').primaryKey(),
    ficheId: integer('fiche_id'),
    collectiviteId: integer('collectivite_id'),
    titre: varchar('titre', { length: 300 }),
    previousTitre: varchar('previous_titre', { length: 300 }),
    description: varchar('description', { length: 20000 }),
    previousDescription: varchar('previous_description', { length: 20000 }),
    statut: text('statut'),
    previousStatut: text('previous_statut'),
    jauge: integer('jauge'),
    previousJauge: integer('previous_jauge'),
    createdAt: timestamp('created_at', TIMESTAMP_OPTIONS),
    modifiedAt: timestamp('modified_at', TIMESTAMP_OPTIONS),
    previousModifiedAt: timestamp('previous_modified_at', TIMESTAMP_OPTIONS),
    modifiedBy: uuid('modified_by'),
    previousModifiedBy: uuid('previous_modified_by'),
    restreint: boolean('restreint'),
    previousRestreint: boolean('previous_restreint'),
    deleted: boolean('deleted').default(false),
  }
);
