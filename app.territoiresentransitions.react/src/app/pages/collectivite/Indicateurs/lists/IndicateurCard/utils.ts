import { IndicateurChartInfo } from '@/api/indicateurs/domain';
import { IndicateurViewParamOption } from '@/app/app/paths';

/** Permet de calculer le nombre d'indicateurs restants à compléter (parent et/ou enfants) */
export const getIndicateurRestant = (
  chartInfo: IndicateurChartInfo
): number => {
  const isIndicateurParent = chartInfo.enfants && chartInfo.enfants.length > 0;

  const indicateursEnfantsAcompleterRestant =
    chartInfo?.enfants?.filter((enfant) => !enfant.rempli).length ?? 0;

  // Si parent sans valeur
  if (chartInfo.sansValeur) {
    return indicateursEnfantsAcompleterRestant;
  }
  // Si parent
  else if (isIndicateurParent) {
    // rempli
    if (chartInfo.rempli) {
      return indicateursEnfantsAcompleterRestant;
    } else {
      return indicateursEnfantsAcompleterRestant + 1;
    }
    // Si pas d'enfant
  } else {
    return chartInfo.rempli ? 0 : 1;
  }
};

/**
 * Retourne le groupe auquel appartient l'indicateur.
 * Si l'id est undefined, on assume que c'est un indicateur personnalisé.
 */
export const getIndicateurGroup = (
  indicateur_id?: string | null
): IndicateurViewParamOption => {
  if (typeof indicateur_id === 'string') {
    return indicateur_id.split('_')[0] as IndicateurViewParamOption;
  } else {
    return 'perso';
  }
};
