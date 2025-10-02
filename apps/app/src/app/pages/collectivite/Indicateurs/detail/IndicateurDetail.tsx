'use client';

import { useCollectiviteId } from '@/api/collectivites';
import { INDICATEUR_TRAJECTOIRE_IDENTFIANTS } from '@/app/indicateurs/trajectoires/trajectoire-constants';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { useStatutTrajectoire } from '../../Trajectoire/use-statut-trajectoire';
import { useGetTrajectoire } from '../../Trajectoire/use-trajectoire';
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
  useGetTrajectoire({
    enabled:
      !isPerso &&
      !!definition?.identifiantReferentiel &&
      INDICATEUR_TRAJECTOIRE_IDENTFIANTS.includes(
        definition.identifiantReferentiel
      ) &&
      status === 'pret_a_calculer',
  });

  if (isLoading) return <SpinnerLoader containerClassName="m-auto" />;
  if (!definition) return null;

  return <IndicateurLayout {...{ dataTest, definition, isPerso }} />;
};
