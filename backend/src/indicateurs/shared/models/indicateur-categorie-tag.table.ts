import { categorieTagTable } from '@/domain/collectivites';
import { integer, pgTable, primaryKey } from 'drizzle-orm/pg-core';
import { indicateurDefinitionTable } from './indicateur-definition.table';

export const indicateurCategorieTagTable = pgTable(
  'indicateur_categorie_tag',
  {
    categorieTagId: integer('categorie_tag_id').references(
      () => categorieTagTable.id,
      {
        onDelete: 'cascade',
      }
    ),
    indicateurId: integer('indicateur_id').references(
      () => indicateurDefinitionTable.id,
      {
        onDelete: 'cascade',
      }
    ),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.categorieTagId, table.indicateurId] }),
    };
  }
);
