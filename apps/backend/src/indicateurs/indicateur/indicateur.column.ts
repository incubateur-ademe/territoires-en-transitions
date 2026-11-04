import { getTableColumns } from 'drizzle-orm';
import { indicateurDefinitionTable } from './indicateur-definition.table';
import { indicateurDefinitionPeriodiciteSelection } from './indicateur-periodicite.column';

export const indicateurSelection = {
  ...getTableColumns(indicateurDefinitionTable),
  ...indicateurDefinitionPeriodiciteSelection,
};
