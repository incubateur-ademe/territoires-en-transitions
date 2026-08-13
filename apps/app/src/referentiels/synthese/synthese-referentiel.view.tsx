'use client';

import { referentielToName } from '@/app/app/labels';
import { ReferentielCard } from '@/app/referentiels/tableau-de-bord/referentiel.card';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { ReferentielId } from '@tet/domain/referentiels';

type Props = {
  referentielId: ReferentielId;
};

export const SyntheseReferentielView = ({ referentielId }: Props) => {
  const { collectiviteId, hasCollectivitePermission } =
    useCurrentCollectivite();

  const canMutateReferentiel = hasCollectivitePermission('referentiels.mutate');

  return (
    <ReferentielCard
      isReadonly={!canMutateReferentiel}
      collectiviteId={collectiviteId}
      referentiel={referentielId}
      title={referentielToName[referentielId]}
    />
  );
};
