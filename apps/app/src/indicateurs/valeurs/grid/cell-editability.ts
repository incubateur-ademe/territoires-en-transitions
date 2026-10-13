import { IndicateurPeriode } from '@tet/domain/indicateurs';
import { PcaetIndicateurValeurType } from './types';

export const isResultatEditable = (
  periode: IndicateurPeriode,
  currentPeriode: IndicateurPeriode
): boolean => periode.dateDebut <= currentPeriode.dateDebut;

/** Résultat pour une période passée ou courante, objectif pour une période future. */
export const valueFieldsForPeriode = (
  periode: IndicateurPeriode,
  currentPeriode: IndicateurPeriode
): readonly PcaetIndicateurValeurType[] =>
  isResultatEditable(periode, currentPeriode) ? ['resultat'] : ['objectif'];
