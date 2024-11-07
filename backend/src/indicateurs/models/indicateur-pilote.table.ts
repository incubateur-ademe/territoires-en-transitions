import { integer, pgTable, uuid } from 'drizzle-orm/pg-core';
import { personneTagTable } from '../../taxonomie/models/personne-tag.table';
import { serial } from 'drizzle-orm/pg-core';
import { collectiviteTable } from '../../collectivites/models/collectivite.table';
import { indicateurDefinitionTable } from './indicateur-definition.table';

export const indicateurPiloteTable = pgTable('indicateur_pilote', {
  id: serial('id').primaryKey(),
  indicateurId: integer('indicateur_id').references(
    () => indicateurDefinitionTable.id
  ),
  tagId: integer('tag_id').references(() => personneTagTable.id),
  userId: uuid('user_id'),
  collectiviteId: integer('collectivite_id').references(
    () => collectiviteTable.id
  ),
});
