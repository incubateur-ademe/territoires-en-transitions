import { thematiqueTable } from '@/backend/shared/thematiques/thematique.table';
import { integer, pgTable, primaryKey } from 'drizzle-orm/pg-core';
import { indicateurDefinitionTable } from '../../definitions/indicateur-definition.table';

export const indicateurThematiqueTable = pgTable(
  'indicateur_thematique',
  {
    indicateurId: integer('indicateur_id').references(
      () => indicateurDefinitionTable.id,
      {
        onDelete: 'cascade',
      }
    ),
    thematiqueId: integer('thematique_id').references(
      () => thematiqueTable.id,
      {
        onDelete: 'cascade',
      }
    ),
  },
  (table) => [primaryKey({ columns: [table.indicateurId, table.thematiqueId] })]
);
