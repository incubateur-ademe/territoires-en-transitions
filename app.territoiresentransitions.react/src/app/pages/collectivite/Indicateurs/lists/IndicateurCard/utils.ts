import {
  Indicateur,
  TIndicateurChartInfo,
} from 'app/pages/collectivite/Indicateurs/types';

/** Permet de calculer le nombre d'indicateurs restants à compléter (parent et/ou enfants) */
export const getIndicateurRestant = (
  chartInfo: TIndicateurChartInfo
): number => {
  const isIndicateurParent = chartInfo.enfants && chartInfo.enfants.length > 0;

  const indicateursEnfantsAcompleterRestant =
    chartInfo?.enfants?.filter(enfant => !enfant.rempli).length ?? 0;

  // Si parent
  if (isIndicateurParent) {
    // sans valeur, uniquement des enfants
    if (chartInfo.sans_valeur) {
      return indicateursEnfantsAcompleterRestant;
      // avec valeur
    } else {
      // rempli
      if (chartInfo.rempli) {
        return indicateursEnfantsAcompleterRestant;
      } else {
        return indicateursEnfantsAcompleterRestant + 1;
      }
    }
    // Si pas d'enfant
  } else {
    return chartInfo.rempli ? 0 : 1;
  }
};

/**
 * Permet d'ajouter ou retirer un indicateur d'une liste d'indicateurs.
 * Renvoi la liste d'indicateurs mise à jour.
 */
export const selectIndicateur = ({
  indicateur,
  selected,
  selectedIndicateurs,
}: {
  indicateur: Indicateur;
  selected: boolean;
  selectedIndicateurs?: Indicateur[] | null;
}): Indicateur[] => {
  if (selected) {
    return (
      selectedIndicateurs?.filter(
        i =>
          i.indicateur_id !== indicateur.indicateur_id ||
          i.indicateur_personnalise_id !== indicateur.indicateur_personnalise_id
      ) ?? []
    );
  } else {
    return [...(selectedIndicateurs ?? []), indicateur];
  }
};
