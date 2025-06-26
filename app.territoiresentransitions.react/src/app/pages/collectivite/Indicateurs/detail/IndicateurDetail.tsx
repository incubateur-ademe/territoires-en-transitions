'use client';

import { INDICATEUR_TRAJECTOIRE_IDENTFIANTS } from '@/app/app/pages/collectivite/Trajectoire/constants';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
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
  useCalculTrajectoire({
    enabled:
      !isPerso &&
      !!definition?.identifiantReferentiel &&
      INDICATEUR_TRAJECTOIRE_IDENTFIANTS.includes(
        definition.identifiantReferentiel
      ) &&
      status === 'pret_a_calculer',
  });

  if (isLoading) return <SpinnerLoader />;
  if (!definition) return null;

  return <IndicateurLayout {...{ dataTest, definition, isPerso }} />;
};
