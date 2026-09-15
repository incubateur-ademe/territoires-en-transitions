import {
  IndicateurPeriodicite,
  IndicateurPeriodiciteEnum,
  IndicateurPeriodiciteMode,
  IndicateurPeriodiciteModeEnum,
} from '@tet/domain/indicateurs';
import { sql } from 'drizzle-orm';

/** Annual storage compatibility. PR #4981 replaces these constants with database columns. */
export const indicateurDefinitionPeriodiciteSelection = {
  periodicite: sql<IndicateurPeriodicite>`${IndicateurPeriodiciteEnum.ANNUELLE}`,
  periodiciteMode: sql<IndicateurPeriodiciteMode>`${IndicateurPeriodiciteModeEnum.IMPOSEE}`,
};
export const indicateurValeurPeriodiciteSelection = {
  periodicite: indicateurDefinitionPeriodiciteSelection.periodicite,
};
export const indicateurEffectivePeriodicite =
  indicateurDefinitionPeriodiciteSelection.periodicite;
export const indicateurCollectivitePeriodiciteSelection = {
  periodicite: indicateurEffectivePeriodicite,
  periodiciteMode: indicateurDefinitionPeriodiciteSelection.periodiciteMode,
  periodiciteParDefaut: indicateurEffectivePeriodicite,
  periodicitePersonnalisee: sql<IndicateurPeriodicite | null>`null`,
};
