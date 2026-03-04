import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { integer, pgView, text } from 'drizzle-orm/pg-core';

export const questionThematiqueCompletudeView = pgView(
  'question_thematique_completude',
  {
    collectiviteId: integer('collectivite_id').references(
      () => collectiviteTable.id
    ),
    id: text('id'),
    nom: text('nom'),
    referentiels: text('referentiels').array(),
    completude: text('completude'),
  }
).existing();
