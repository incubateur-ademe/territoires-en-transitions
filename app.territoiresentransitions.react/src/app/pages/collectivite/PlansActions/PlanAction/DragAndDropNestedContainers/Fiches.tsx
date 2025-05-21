import {
  makeCollectivitePlanActionAxeFicheUrl,
  makeCollectivitePlanActionFicheUrl,
} from '@/app/app/paths';
import classNames from 'classnames';
import FicheActionCardSkeleton from '../../FicheAction/Carte/FicheActionCardSkeleton';
import { useListFicheResumes } from '../../FicheAction/data/use-list-fiche-resumes';
import Fiche from './Fiche';

type Props = {
  /** est-ce qu'il y a une élément actif (drag) */
  isDndActive: boolean;
  isAxePage: boolean;
  ficheIds: number[];
  planId: number;
  axeId: number;
};

const Fiches = ({ isDndActive, isAxePage, ficheIds, planId, axeId }: Props) => {
  const { data, isLoading } = useListFicheResumes({
    filters: {
      ficheIds: ficheIds,
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
            <Fiche
              key={fiche.id}
              fiche={fiche}
              editKeysToInvalidate={[['axe_fiches', axeId, ficheIds]]}
              url={
                fiche.id
                  ? isAxePage
                    ? makeCollectivitePlanActionAxeFicheUrl({
                        collectiviteId: fiche.collectiviteId,
                        planActionUid: planId.toString(),
                        ficheUid: fiche.id.toString(),
                        axeUid: axeId.toString(),
                      })
                    : makeCollectivitePlanActionFicheUrl({
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

export default Fiches;
