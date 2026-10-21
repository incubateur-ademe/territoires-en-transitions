import { getTableColumns } from 'drizzle-orm';
import { actionDefinitionTable } from './action-definition.table';

const { templates: _templates, ...columns } = getTableColumns(
  actionDefinitionTable
);

/**
 * Colonnes de `action_definition` à sélectionner pour une réponse : toutes
 * sauf `templates`, les textes sources des champs balisés.
 */
export const actionDefinitionColumns = columns;
