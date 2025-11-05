import { version } from '@/backend/utils/column.utils';
import { questionTypeEnumValues } from '@/domain/collectivites';
import { integer, pgEnum, pgTable, text, varchar } from 'drizzle-orm/pg-core';
import { questionThematiqueTable } from './question-thematique.table';

const questionTypePgEnum = pgEnum('question_type', questionTypeEnumValues);

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
