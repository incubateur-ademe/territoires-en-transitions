import { collectiviteTable } from '@/backend/collectivites/shared/models/collectivite.table';
import { personneTagTable } from '@/backend/collectivites/tags/personnes/personne-tag.table';
import { integer, pgTable, serial, uuid } from 'drizzle-orm/pg-core';
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
