'use client';

import { useListIndicateurs } from '@/app/indicateurs/indicateurs/use-list-indicateurs';
import { useFichesActionLiees } from '@/app/referentiels/action.show/useFichesActionLiees';
import { useActionPreuvesCount } from '@/app/referentiels/preuves/usePreuves';
import { useCurrentCollectivite } from '@tet/api/collectivites';

type ActionMetadataCount = {
  documents: number | undefined;
  indicateurs: number | undefined;
  fiches: number | undefined;
};

export function useActionMetadataCount(actionId: string): ActionMetadataCount {
  const { collectiviteId } = useCurrentCollectivite();

  const documents = useActionPreuvesCount(actionId);

  const { data: { data: indicateursLies } = {} } = useListIndicateurs({
    collectiviteId,
    filters: { mesureId: actionId },
  });
  const indicateurs = indicateursLies?.length;

  const { data: fichesLiees } = useFichesActionLiees({
    actionId,
    collectiviteId,
  });

  return { documents, indicateurs, fiches: fichesLiees.length };
}
