'use client';

import { useCollectiviteId } from '@/api/collectivites';
import { useGetIndicateurDefinition } from '@/app/indicateurs/definitions/use-get-indicateur-definition';
import { INDICATEUR_TRAJECTOIRE_IDENTFIANTS } from '@/app/indicateurs/trajectoires/trajectoire-constants';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { useStatutTrajectoire } from '../../Trajectoire/use-statut-trajectoire';
import { useGetTrajectoire } from '../../Trajectoire/use-trajectoire';
import IndicateurLayout from './IndicateurLayout';

type Props = {
  dataTest?: string;
  indicateurId: number | string;
};

export const IndicateurDetail = ({ dataTest, indicateurId }: Props) => {
  const collectiviteId = useCollectiviteId();

  const { data: definition, isLoading } = useGetIndicateurDefinition(
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
      !definition?.estPerso &&
      !!definition?.identifiantReferentiel &&
      INDICATEUR_TRAJECTOIRE_IDENTFIANTS.includes(
        definition.identifiantReferentiel
      ) &&
      status === 'pret_a_calculer',
  });

  if (isLoading) return <SpinnerLoader className="m-auto" />;
  if (!definition) return null;

  return <IndicateurLayout {...{ dataTest, definition }} />;
};
