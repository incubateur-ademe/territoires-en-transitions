'use client';

import { useListIndicateurs } from '@/app/indicateurs/indicateurs/use-list-indicateurs';
import { useFichesActionLiees } from '@/app/referentiels/action.show/useFichesActionLiees';
import { useListDiscussions } from '@/app/referentiels/actions/comments/hooks/use-list-discussions';
import { useActionPreuvesCount } from '@/app/referentiels/preuves/usePreuves';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { getReferentielIdFromActionId } from '@tet/domain/referentiels';

type ActionMetadataCount = {
  documents: number | undefined;
  indicateurs: number | undefined;
  fiches: number | undefined;
  comments: number | undefined;
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

  const referentielId = getReferentielIdFromActionId(actionId);
  const { data: discussionsData } = useListDiscussions(referentielId, {
    actionId,
  });
  const comments = discussionsData?.discussions
    .filter((d) => d.status === 'ouvert')
    .reduce((acc, d) => acc + d.messages.length, 0);

  return { documents, indicateurs, fiches: fichesLiees.length, comments };
}
