import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';
import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { indicateurSourceMetadonneeTable } from '@tet/backend/indicateurs/shared/models/indicateur-source-metadonnee.table';
import { integer, pgTable, primaryKey } from 'drizzle-orm/pg-core';

export const demarchePcaetSourceMetadonneeTable = pgTable(
  'demarche_pcaet_source_metadonnee',
  {
    demarcheId: integer('demarche_id')
      .notNull()
      .references(() => demarcheTable.id, { onDelete: 'cascade' }),
    collectiviteId: integer('collectivite_id')
      .notNull()
      .references(() => collectiviteTable.id, { onDelete: 'cascade' }),
    metadonneeId: integer('metadonnee_id')
      .notNull()
      .references(() => indicateurSourceMetadonneeTable.id, { onDelete: 'cascade' }),
  },
  (table) => [primaryKey({ columns: [table.demarcheId, table.collectiviteId] })]
);

