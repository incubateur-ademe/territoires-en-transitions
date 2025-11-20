import { useTable } from '@/app/referentiels/ReferentielTable/useReferentiel';
import { phaseToLabel } from '@/app/referentiels/utils';
import { reduceActions } from '@tet/domain/referentiels';
import { ActionDetailed, useAction } from '../use-snapshot';

/**
 * Renvoie les données et paramètres de la table
 * de progression pour un référentiel donné et sans filtres
 * @deprecated
 */
export const useProgressionReferentiel = () => {
  const caeResult = useAction('cae');
  const eciResult = useAction('eci');

  const { table: caeTable, isLoading: isLoadingCaeTable } = useTable({
    referentielId: 'cae',
  });
  const { table: eciTable, isLoading: isLoadingEciTable } = useTable({
    referentielId: 'eci',
  });

  // Répartition par phase
  const caePhases = { bases: 0, 'mise en œuvre': 0, effets: 0 };
  const eciPhases = { bases: 0, 'mise en œuvre': 0, effets: 0 };

  const { data: cae, isLoading: isLoadingCae } = caeResult;
  const { data: eci, isLoading: isLoadingEci } = eciResult;

  const groupPointsParCategorie = (
    pointsParCategorie: typeof caePhases,
    action: ActionDetailed
  ) => {
    if (!action.categorie) {
      return pointsParCategorie;
    }

    return {
      ...pointsParCategorie,
      [action.categorie]:
        pointsParCategorie[action.categorie] + action.score.pointFait,
    };
  };

  const caePointsParCategorie = reduceActions(
    cae ? [cae] : [],
    caePhases,
    groupPointsParCategorie
  );

  const eciPointsParCategorie = reduceActions(
    eci ? [eci] : [],
    eciPhases,
    groupPointsParCategorie
  );

  const caeRepartitionPhases = [
    { id: phaseToLabel['bases'], value: caePointsParCategorie['bases'] },
    {
      id: phaseToLabel['mise en œuvre'],
      value: caePointsParCategorie['mise en œuvre'],
    },
    { id: phaseToLabel['effets'], value: caePointsParCategorie['effets'] },
  ];

  const eciRepartitionPhases = [
    { id: phaseToLabel['bases'], value: eciPointsParCategorie['bases'] },
    {
      id: phaseToLabel['mise en œuvre'],
      value: eciPointsParCategorie['mise en œuvre'],
    },
    { id: phaseToLabel['effets'], value: eciPointsParCategorie['effets'] },
  ];

  return {
    caeTable,
    eciTable,
    caeRepartitionPhases,
    eciRepartitionPhases,
    caePotentiel: cae?.score.pointPotentiel,
    eciPotentiel: eci?.score.pointPotentiel,
    isCaeLoading: isLoadingCae || isLoadingCaeTable,
    isEciLoading: isLoadingEci || isLoadingEciTable,
  };
};
