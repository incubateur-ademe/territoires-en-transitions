'use client';

import { INDICATEUR_TRAJECTOIRE_IDENTFIANTS } from '@/app/app/pages/collectivite/Trajectoire/constants';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { useEffect } from 'react';
import { useCalculTrajectoire } from '../../Trajectoire/useCalculTrajectoire';
import { useStatutTrajectoire } from '../../Trajectoire/useStatutTrajectoire';
import { useIndicateurDefinition } from '../Indicateur/useIndicateurDefinition';
import IndicateurLayout from './IndicateurLayout';

type Props = {
  dataTest?: string;
  indicateurId: number | string;
  isPerso?: boolean;
};

export const IndicateurDetail = ({
  dataTest,
  indicateurId,
  isPerso = false,
}: Props) => {
  const { data: definition, isLoading } = useIndicateurDefinition(indicateurId);

  const {
    mutate: calcul,
    isLoading: isLoadingTrajectoire,
    isIdle,
  } = useCalculTrajectoire();

  const { data: trajectoire } = useStatutTrajectoire(
    Boolean(
      definition?.identifiant &&
        INDICATEUR_TRAJECTOIRE_IDENTFIANTS.includes(definition.identifiant)
    )
  );
  const status = trajectoire?.status;

  // démarre le calcul de la trajectoire au chargement de la page
  useEffect(() => {
    if (
      !isPerso &&
      isIdle &&
      definition?.identifiant &&
      INDICATEUR_TRAJECTOIRE_IDENTFIANTS.includes(definition?.identifiant) &&
      status === 'pret_a_calculer' &&
      !isLoadingTrajectoire
    ) {
      calcul();
    }
  }, [calcul, isPerso, isIdle, isLoadingTrajectoire, status]);

  if (isLoading) return <SpinnerLoader />;
  if (!definition) return null;

  return <IndicateurLayout {...{ dataTest, definition, isPerso }} />;
};
