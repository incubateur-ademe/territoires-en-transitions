import {
  IndicateurPeriodicite,
  IndicateurPeriodiciteEnum,
} from '@tet/domain/indicateurs';
import { sql } from 'drizzle-orm';

/** Annual storage compatibility. PR #4981 replaces these constants with database columns. */
export const indicateurDefinitionPeriodiciteSelection = {
  periodicite: sql<IndicateurPeriodicite>`${IndicateurPeriodiciteEnum.ANNUELLE}`,
};
export const indicateurValeurPeriodiciteSelection = {
  periodicite: indicateurDefinitionPeriodiciteSelection.periodicite,
};
