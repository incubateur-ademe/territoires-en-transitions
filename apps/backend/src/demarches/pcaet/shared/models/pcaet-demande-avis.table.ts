import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';
import { createdAt } from '@tet/backend/utils/column.utils';
import { index, integer, pgTable, text, unique } from 'drizzle-orm/pg-core';

export const demandeAvisSourceValues = ['seed', 'transmission'] as const;
export type DemandeAvisSource = (typeof demandeAvisSourceValues)[number];

export const pcaetDemandeAvisTable = pgTable(
  'demarche_pcaet_demande_avis',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    demarcheId: integer('demarche_id')
      .notNull()
      .references(() => demarcheTable.id, { onDelete: 'restrict' }),
    instructeurCollectiviteId: integer('instructeur_collectivite_id')
      .notNull()
      .references(() => collectiviteTable.id, { onDelete: 'cascade' }),
    source: text('source', { enum: demandeAvisSourceValues }).notNull(),
    createdAt,
  },
  (table) => [
    unique('demarche_pcaet_demande_avis_unique_demarche_instructeur').on(
      table.demarcheId,
      table.instructeurCollectiviteId
    ),
    index('demarche_pcaet_demande_avis_instructeur').on(
      table.instructeurCollectiviteId
    ),
  ]
);
