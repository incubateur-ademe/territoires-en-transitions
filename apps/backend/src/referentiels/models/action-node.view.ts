import { boolean, integer, pgSchema, varchar } from 'drizzle-orm/pg-core';
import { referentielIdPgEnum } from '../referentiel-id.column';
import { actionTypePgEnum } from './action-type.column';

export const privateSchema = pgSchema('private');

/**
 * Vue matérialisée `private.action_node` : synthétise pour chaque action son
 * référentiel, son type, sa profondeur et ses descendants/ascendants. Utilisée
 * pour résoudre l'action parente d'une tâche dans l'historique.
 *@deprecated used for legacy, should be avoided
 */
export const actionNodeView = privateSchema
  .view('action_node', {
    actionId: varchar('action_id', { length: 30 }).notNull(),
    referentiel: referentielIdPgEnum('referentiel'),
    descendants: varchar('descendants', { length: 30 }).array(),
    leaves: varchar('leaves', { length: 30 }).array(),
    haveChildren: boolean('have_children'),
    ascendants: varchar('ascendants', { length: 30 }).array(),
    depth: integer('depth'),
    type: actionTypePgEnum('type'),
  })
  .existing();
