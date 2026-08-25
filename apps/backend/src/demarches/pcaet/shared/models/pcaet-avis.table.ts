import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { authUsersTable } from '@tet/backend/users/models/auth-users.table';
import { TIMESTAMP_OPTIONS } from '@tet/backend/utils/column.utils';
import type { PcaetAvisAuTitreDe, PcaetAvisSens } from '@tet/domain/demarches';
import {
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { pcaetDemandeAvisTable } from './pcaet-demande-avis.table';

export const pcaetAvisTable = pgTable(
  'demarche_pcaet_avis',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    demandeAvisId: integer('demande_avis_id')
      .notNull()
      .references(() => pcaetDemandeAvisTable.id, { onDelete: 'cascade' }),
    emetteurCollectiviteId: integer('emetteur_collectivite_id')
      .notNull()
      .references(() => collectiviteTable.id, { onDelete: 'cascade' }),
    auTitreDe: text('au_titre_de').notNull().$type<PcaetAvisAuTitreDe>(),
    sens: text('sens').notNull().$type<PcaetAvisSens>(),
    fichierRef: text('fichier_ref'),
    valideLe: timestamp('valide_le', TIMESTAMP_OPTIONS),
    deposePar: uuid('depose_par').references(() => authUsersTable.id, {
      onDelete: 'set null',
    }),
    deposeLe: timestamp('depose_le', TIMESTAMP_OPTIONS).defaultNow().notNull(),
    modifieLe: timestamp('modifie_le', TIMESTAMP_OPTIONS),
    envoyeLe: timestamp('envoye_le', TIMESTAMP_OPTIONS),
  },
  (table) => [
    unique('demarche_pcaet_avis_unique_au_titre_de').on(
      table.demandeAvisId,
      table.auTitreDe
    ),
  ]
);
