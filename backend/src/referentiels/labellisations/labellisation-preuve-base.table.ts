import { modifiedAt, modifiedBy } from '@/backend/utils/column.utils';
import { sql } from 'drizzle-orm';
import { foreignKey, integer, jsonb, text } from 'drizzle-orm/pg-core';
import { collectiviteTable } from '../../collectivites/shared/models/collectivite.table';
import { authUsersTable } from '../../users/models/auth-users.table';
import { labellisationBibliothequeFichierTable } from './labellisation-bibliotheque-fichier.table';
import { labellisationSchema } from './labellisation.schema';

export const preuveBaseInLabellisation = labellisationSchema.table(
  'preuve_base',
  {
    collectiviteId: integer('collectivite_id').notNull(),
    fichierId: integer('fichier_id'),
    url: text('url'),
    titre: text('titre').default('').notNull(),
    commentaire: text('commentaire').default('').notNull(),
    modifiedBy,
    modifiedAt,
    lien: jsonb('lien').generatedAlwaysAs(sql`
CASE
    WHEN (url IS NOT NULL) THEN jsonb_object(ARRAY['url'::text, url, 'titre'::text, titre])
    ELSE NULL::jsonb
END`),
  },
  (table) => {
    return {
      preuveBaseCollectiviteIdFkey: foreignKey({
        columns: [table.collectiviteId],
        foreignColumns: [collectiviteTable.id],
        name: 'preuve_base_collectivite_id_fkey',
      }),
      preuveBaseFichierIdFkey: foreignKey({
        columns: [table.fichierId],
        foreignColumns: [labellisationBibliothequeFichierTable.id],
        name: 'preuve_base_fichier_id_fkey',
      }),
      preuveBaseModifiedByFkey: foreignKey({
        columns: [table.modifiedBy],
        foreignColumns: [authUsersTable.id],
        name: 'preuve_base_modified_by_fkey',
      }),
    };
  }
);
