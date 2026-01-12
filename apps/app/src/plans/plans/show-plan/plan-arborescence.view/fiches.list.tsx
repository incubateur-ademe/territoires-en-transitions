import FicheActionCard from '@/app/app/pages/collectivite/PlansActions/FicheAction/Carte/FicheActionCard';
import FicheActionCardSkeleton from '@/app/app/pages/collectivite/PlansActions/FicheAction/Carte/FicheActionCardSkeleton';
import { makeCollectiviteActionUrl } from '@/app/app/paths';
import {
  isFicheEditableByCollectiviteUser,
  isFicheSharedWithCollectivite,
} from '@/app/plans/fiches/share-fiche/share-fiche.utils';
import { useUser } from '@tet/api/users';
import { CollectiviteAccess } from '@tet/domain/users';
import { useListFiches } from '../../../fiches/list-all-fiches/data/use-list-fiches';

type Props = {
  ficheIds: number[];
  axeId: number;
  planId?: number;
  collectivite: CollectiviteAccess;
};

export const FichesList = ({
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
      <div className="grid grid-cols-2 gap-6">
        {ficheIds.map((id) => (
          <FicheActionCardSkeleton key={id} />
        ))}
      </div>
    );
  }

  return (
    <div className={'grid grid-cols-2 gap-6 my-2'}>
      {fiches.map((fiche) => {
        if (fiche.id < 0) {
          return <FicheActionCardSkeleton key={fiche.id} />;
        } else {
          const isReadonly =
            collectivite.isReadOnly ||
            !isFicheEditableByCollectiviteUser(fiche, collectivite, user.id) ||
            isFicheSharedWithCollectivite(fiche, collectivite.collectiviteId);
          return (
            <FicheActionCard
              currentCollectivite={collectivite}
              currentUserId={user.id}
              key={fiche.id}
              ficheAction={fiche}
              editKeysToInvalidate={[['axe_fiches', axeId, ficheIds]]}
              isEditable={!isReadonly}
              isMoveable
              link={
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
