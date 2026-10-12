import { IndicateurPeriod } from '@tet/domain/indicateurs';
import { PcaetIndicateurValeurType } from './types';

export const isResultatEditable = (
  period: IndicateurPeriod,
  currentPeriod: IndicateurPeriod
): boolean => period.dateDebut <= currentPeriod.dateDebut;

/** Résultat pour une période passée ou courante, objectif pour une période future. */
export const valueFieldsForPeriod = (
  period: IndicateurPeriod,
  currentPeriod: IndicateurPeriod
): readonly PcaetIndicateurValeurType[] =>
  isResultatEditable(period, currentPeriod) ? ['resultat'] : ['objectif'];
