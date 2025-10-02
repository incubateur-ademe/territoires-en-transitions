import { CurrentCollectivite } from '@/api/collectivites/fetch-current-collectivite';
import { makeCollectivitePlanActionFicheUrl } from '@/app/app/paths';
import classNames from 'classnames';
import FicheActionCardSkeleton from '../../../../app/pages/collectivite/PlansActions/FicheAction/Carte/FicheActionCardSkeleton';
import { useListFiches } from '../../../fiches/list-all-fiches/data/use-list-fiches';
import { DraggableFicheCard } from './draggable-fiche.card';

type Props = {
  /** est-ce qu'il y a une élément actif (drag) */
  isDndActive: boolean;
  ficheIds: number[];
  planId: number;
  axeId: number;
  collectivite: CurrentCollectivite;
};

export const FichesList = ({
  isDndActive,
  ficheIds,
  planId,
  axeId,
  collectivite,
}: Props) => {
  const { data, isLoading } = useListFiches(collectivite.collectiviteId, {
    filters: {
      ficheIds,
    },
    queryOptions: {
      sort: [{ field: 'titre', direction: 'asc' }],
    },
  });

  if (!data || isLoading) {
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
      {data.data.map((fiche) => {
        if (fiche.id < 0) {
          return <FicheActionCardSkeleton key={fiche.id} />;
        } else {
          return (
            <DraggableFicheCard
              collectivite={collectivite}
              key={fiche.id}
              fiche={fiche}
              editKeysToInvalidate={[['axe_fiches', axeId, ficheIds]]}
              url={
                fiche.id
                  ? makeCollectivitePlanActionFicheUrl({
                      collectiviteId: fiche.collectiviteId,
                      planActionUid: planId.toString(),
                      ficheUid: fiche.id.toString(),
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
