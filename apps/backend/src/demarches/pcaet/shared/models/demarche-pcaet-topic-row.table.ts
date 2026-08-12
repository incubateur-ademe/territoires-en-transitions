import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import { boolean, integer, pgTable, serial, text } from 'drizzle-orm/pg-core';
import { demarchePcaetTopicTable } from './demarche-pcaet-topic.table';

/**
 * Ligne de saisie d'un topic du diagnostic. `parentId` nul désigne le premier
 * niveau, renseigné le second — les deux portent la même chose : un libellé,
 * l'indicateur dont les valeurs sont saisies, et le caractère obligatoire.
 *
 * Pas de FK sur `referentielId` : les migrations tournent avant l'import des
 * référentiels, la résolution se fait par jointure à la lecture.
 */
export const demarchePcaetTopicRowTable = pgTable('demarche_pcaet_topic_row', {
  id: serial('id').primaryKey().notNull(),
  topicId: integer('topic_id')
    .notNull()
    .references(() => demarchePcaetTopicTable.id, { onDelete: 'cascade' }),
  parentId: integer('parent_id').references(
    (): AnyPgColumn => demarchePcaetTopicRowTable.id,
    { onDelete: 'cascade' }
  ),
  label: text('label').notNull(),
  referentielId: text('referentiel_id'),
  requis: boolean('requis').notNull().default(true),
  displayOrder: integer('display_order').notNull(),
});
