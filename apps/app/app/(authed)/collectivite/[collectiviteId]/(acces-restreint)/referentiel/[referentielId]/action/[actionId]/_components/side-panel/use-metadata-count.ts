'use client';

import { useListIndicateurs } from '@/app/indicateurs/indicateurs/use-list-indicateurs';
import { useFichesActionLiees } from '@/app/referentiels/action.show/useFichesActionLiees';
import { useActionId } from '@/app/referentiels/actions/action-context';
import { useActionPreuvesCount } from '@/app/referentiels/preuves/usePreuves';
import { useCurrentCollectivite } from '@tet/api/collectivites';

type ActionMetadataCount = {
  documents: number | undefined;
  indicateurs: number | undefined;
  fiches: number | undefined;
};

export function useActionMetadataCount(
  actionDefinitionId: string
): ActionMetadataCount {
  const actionId = useActionId();
  const { collectiviteId } = useCurrentCollectivite();

  const documents = useActionPreuvesCount(actionDefinitionId);

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
