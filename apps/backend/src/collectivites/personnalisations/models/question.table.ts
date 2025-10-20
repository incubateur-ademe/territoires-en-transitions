import { collectiviteTypeEnumSchema } from '@/backend/collectivites/shared/models/collectivite.table';
import { version } from '@/backend/utils/column.utils';
import { integer, pgTable, text, varchar } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import z from 'zod';
import { questionThematiqueTable } from './question-thematique.table';
import { questionTypePgEnum } from './question-type.enum';

// Question à propos des caractéristiques de la collectivités, afin de
// personnaliser la notation des référentiels
export const questionTable = pgTable('question', {
  id: varchar('id', { length: 30 }).primaryKey().notNull(),
  thematiqueId: varchar('thematique_id', { length: 30 }).references(
    () => questionThematiqueTable.id
  ),
  ordonnancement: integer('ordonnancement'),
  // la question sera posée uniquement pour les types listés
  typesCollectivitesConcernees: text('types_collectivites_concernees').array(),
  type: questionTypePgEnum('type').notNull(),
  description: text('description').notNull(),
  formulation: text('formulation').notNull(),
  version,
});

export const questionSchema = createSelectSchema(questionTable).extend({
  typesCollectivitesConcernees: collectiviteTypeEnumSchema
    .array()
    .optional()
    .nullable(),
});
export type QuestionType = z.infer<typeof questionSchema>;

export const createQuestionSchema = createInsertSchema(questionTable).extend({
  typesCollectivitesConcernees: collectiviteTypeEnumSchema
    .array()
    .optional()
    .nullable(),
});
export type CreateQuestionType = z.infer<typeof createQuestionSchema>;
