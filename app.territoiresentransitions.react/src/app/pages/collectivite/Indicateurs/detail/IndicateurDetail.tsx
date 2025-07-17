'use client';

import { useCollectiviteId } from '@/api/collectivites';
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
  const collectiviteId = useCollectiviteId();
  const { data: definition, isLoading } = useIndicateurDefinition(
    indicateurId,
    collectiviteId
  );
  const {
    mutate: calcul,
    isLoading: isLoadingTrajectoire,
    isIdle,
  } = useCalculTrajectoire();

  const { data: trajectoire } = useStatutTrajectoire(
    Boolean(
      definition?.identifiantReferentiel &&
        INDICATEUR_TRAJECTOIRE_IDENTFIANTS.includes(
          definition.identifiantReferentiel
        )
    )
  );
  const status = trajectoire?.status;

  // démarre le calcul de la trajectoire au chargement de la page
  useEffect(() => {
    if (
      !isPerso &&
      isIdle &&
      definition?.identifiantReferentiel &&
      INDICATEUR_TRAJECTOIRE_IDENTFIANTS.includes(
        definition?.identifiantReferentiel
      ) &&
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
