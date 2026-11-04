'use client';

import { useGetIndicateur } from '@/app/indicateurs/indicateurs/use-get-indicateur';
import { INDICATEUR_TRAJECTOIRE_IDENTFIANTS } from '@/app/indicateurs/trajectoires/trajectoire-constants';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { useCollectiviteId } from '@tet/api/collectivites';
import { isIndicateurPredefini } from '@tet/domain/indicateurs';
import { useGetStatutTrajectoire } from '../../Trajectoire/use-get-statut-trajectoire';
import { useGetTrajectoire } from '../../Trajectoire/use-trajectoire';
import IndicateurLayout from './IndicateurLayout';

type Props = {
  dataTest?: string;
  indicateurId: number | string;
};

export const IndicateurDetail = ({ dataTest, indicateurId }: Props) => {
  const collectiviteId = useCollectiviteId();

  const { data: indicateur, isLoading } = useGetIndicateur(
    indicateurId,
    collectiviteId
  );

  const { data: trajectoire } = useGetStatutTrajectoire(
    Boolean(
      indicateur?.identifiantReferentiel &&
        INDICATEUR_TRAJECTOIRE_IDENTFIANTS.includes(
          indicateur.identifiantReferentiel
        )
    )
  );
  const status = trajectoire?.status;

  // démarre le calcul de la trajectoire au chargement de la page
  useGetTrajectoire({
    enabled:
      !!indicateur &&
      isIndicateurPredefini(indicateur) &&
      INDICATEUR_TRAJECTOIRE_IDENTFIANTS.includes(
        indicateur.identifiantReferentiel
      ) &&
      status === 'pret_a_calculer',
  });

  if (isLoading) return <SpinnerLoader className="m-auto" />;
  if (!indicateur) return null;

  return <IndicateurLayout {...{ dataTest, indicateur }} />;
};
