import { integer, pgTable, text, varchar } from 'drizzle-orm/pg-core';
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
  type: questionTypePgEnum('question_type').notNull(),
  description: text('description').notNull(),
  formulation: text('formulation').notNull(),
});
