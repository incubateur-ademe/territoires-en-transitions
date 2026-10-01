import { sql } from 'drizzle-orm';
import { actionDefinitionTable } from './action-definition.table';

/**
 * Profondeur de l'action, d'après le nombre de points de son identifiant
 * Ex: 1.1   => 2
 *     1.1.1 => 3
 */
export const actionDepth = sql<number>`CASE
  WHEN ${actionDefinitionTable.identifiant} IS NULL OR ${actionDefinitionTable.identifiant} LIKE '' THEN 0
  ELSE REGEXP_COUNT(${actionDefinitionTable.identifiant}, '\\.') + 1
  END`;
