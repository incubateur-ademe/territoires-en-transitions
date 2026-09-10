import type { IndicateurPeriodicite } from '@tet/domain/indicateurs';
import { sql } from 'drizzle-orm';
import { indicateurCollectiviteTable } from './indicateur-collectivite.table';
import { indicateurDefinitionTable } from './indicateur-definition.table';

/** Requires a collectivité-scoped left join to indicateur_collectivite. */
export const indicateurEffectivePeriodicite = sql<IndicateurPeriodicite>`
  case when ${indicateurDefinitionTable.periodiciteMode} = 'imposee'
    then ${indicateurDefinitionTable.periodicite}
    else coalesce(${indicateurCollectiviteTable.periodicite}, ${indicateurDefinitionTable.periodicite})
  end`;

export const indicateurCollectivitePeriodiciteSelection = {
  periodicite: indicateurEffectivePeriodicite,
  periodiciteParDefaut: indicateurDefinitionTable.periodicite,
  periodicitePersonnalisee: indicateurCollectiviteTable.periodicite,
};
