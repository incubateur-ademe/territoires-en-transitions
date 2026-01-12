import { makeCollectiviteActionUrl } from '@/app/app/paths';
import { useUser } from '@tet/api/users';
import { CollectiviteAccess } from '@tet/domain/users';
import classNames from 'classnames';
import FicheActionCardSkeleton from '../../../../app/pages/collectivite/PlansActions/FicheAction/Carte/FicheActionCardSkeleton';
import { useListFiches } from '../../../fiches/list-all-fiches/data/use-list-fiches';
import { DraggableFicheCard } from './draggable-fiche.card';

type Props = {
  /** est-ce qu'il y a une élément actif (drag) */
  isDndActive: boolean;
  ficheIds: number[];
  axeId: number;
  planId?: number;
  collectivite: CollectiviteAccess;
};

export const FichesList = ({
  isDndActive,
  ficheIds,
  axeId,
  planId,
  collectivite,
}: Props) => {
  const user = useUser();
  const { fiches, isLoading } = useListFiches(collectivite.collectiviteId, {
    filters: {
      axesId: [axeId],
    },
    queryOptions: {
      sort: [{ field: 'titre', direction: 'asc' }],
      limit: 'all',
    },
  });

  if (isLoading) {
    return (
      <div
        className={classNames('grid grid-cols-2 gap-6', {
          'my-2': !isDndActive,
        })}
      >
        {ficheIds.map((id) => (
          <FicheActionCardSkeleton key={id} />
        ))}
      </div>
    );
  }

  return (
    <div
      className={classNames('grid grid-cols-2 gap-6', { 'my-2': !isDndActive })}
    >
      {fiches.map((fiche) => {
        if (fiche.id < 0) {
          return <FicheActionCardSkeleton key={fiche.id} />;
        } else {
          return (
            <DraggableFicheCard
              collectivite={collectivite}
              currentUserId={user.id}
              key={fiche.id}
              fiche={fiche}
              editKeysToInvalidate={[['axe_fiches', axeId, ficheIds]]}
              url={
                fiche.id
                  ? makeCollectiviteActionUrl({
                      collectiviteId: fiche.collectiviteId,
                      ficheUid: fiche.id.toString(),
                      planId,
                    })
                  : undefined
              }
            />
          );
        }
      })}
    </div>
  );
};
