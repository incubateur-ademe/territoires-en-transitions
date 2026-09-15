import {
  IndicateurPeriodiciteModeEnum,
  type IndicateurPeriodicite,
} from '@tet/domain/indicateurs';
import { sql } from 'drizzle-orm';
import { indicateurCollectiviteTable } from './indicateur-collectivite.table';
import { indicateurDefinitionTable } from './indicateur-definition.table';
import { indicateurValeurTable } from '../valeurs/indicateur-valeur.table';

export const indicateurDefinitionPeriodiciteSelection = {
  periodicite: indicateurDefinitionTable.periodicite,
  periodiciteMode: indicateurDefinitionTable.periodiciteMode,
};
export const indicateurValeurPeriodiciteSelection = {
  periodicite: indicateurValeurTable.periodicite,
};

/** Requires a collectivité-scoped left join to indicateur_collectivite. */
export const indicateurEffectivePeriodicite = sql<IndicateurPeriodicite>`
  case when ${indicateurDefinitionTable.periodiciteMode} = ${IndicateurPeriodiciteModeEnum.IMPOSEE}
    then ${indicateurDefinitionTable.periodicite}
    else coalesce(${indicateurCollectiviteTable.periodicite}, ${indicateurDefinitionTable.periodicite})
  end`;

export const indicateurCollectivitePeriodiciteSelection = {
  periodicite: indicateurEffectivePeriodicite,
  periodiciteMode: indicateurDefinitionTable.periodiciteMode,
  periodiciteParDefaut: indicateurDefinitionTable.periodicite,
  periodicitePersonnalisee: indicateurCollectiviteTable.periodicite,
};
