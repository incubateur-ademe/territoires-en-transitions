import { collectiviteTable } from '@/backend/collectivites/shared/models/collectivite.table';
import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { boolean, integer, pgTable } from 'drizzle-orm/pg-core';
import { createSelectSchema } from 'drizzle-zod';
import { createdAt, createdBy } from '../../utils/column.utils';
import { tagTableBase } from './tag.table-base';

export const categorieTagTable = pgTable('categorie_tag', {
  ...tagTableBase,
  collectiviteId: integer('collectivite_id').references(
    () => collectiviteTable.id
  ),
  groupementId: integer('groupement_id'), // TODO .references(() => groupementTable.id)
  visible: boolean('visible').default(true),
  createdAt,
  createdBy,
});

export const categorieTagSchema = createSelectSchema(categorieTagTable);

export type CategorieTag = InferSelectModel<typeof categorieTagTable>;
export type CreateCategorieTag = InferInsertModel<typeof categorieTagTable>;
