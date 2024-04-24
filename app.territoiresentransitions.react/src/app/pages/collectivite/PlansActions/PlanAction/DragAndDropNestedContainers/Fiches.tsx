import {ActionCardSkeleton} from '../../components/ActionCard';
import {
  makeCollectivitePlanActionAxeFicheUrl,
  makeCollectivitePlanActionFicheUrl,
} from 'app/paths';
import {useAxeFiches} from '../data/useAxeFiches';
import Fiche from './Fiche';
import classNames from 'classnames';

type Props = {
  /** est-ce qu'il y a une élément actif (drag) */
  isDndActive: boolean;
  isAxePage: boolean;
  ficheIds: number[];
  planId: number;
  axeId: number;
};

const Fiches = ({isDndActive, isAxePage, ficheIds, planId, axeId}: Props) => {
  const {data, isLoading} = useAxeFiches({ficheIds, axeId});

  return (
    <div
      className={classNames('grid grid-cols-2 gap-6', {'my-2': !isDndActive})}
    >
      {isLoading
        ? ficheIds.map(id => <ActionCardSkeleton key={id} />)
        : data &&
          data.map(fiche => {
            if (fiche.id! < 0) {
              return <ActionCardSkeleton key={fiche.id} />;
            } else {
              return (
                <Fiche
                  key={fiche.id}
                  axeId={axeId}
                  planId={planId}
                  fiche={fiche}
                  editKeysToInvalidate={[['axe_fiches', axeId, ficheIds]]}
                  url={
                    fiche.id
                      ? isAxePage
                        ? makeCollectivitePlanActionAxeFicheUrl({
                            collectiviteId: fiche.collectivite_id!,
                            planActionUid: planId.toString(),
                            ficheUid: fiche.id.toString(),
                            axeUid: axeId.toString(),
                          })
                        : makeCollectivitePlanActionFicheUrl({
                            collectiviteId: fiche.collectivite_id!,
                            planActionUid: planId.toString(),
                            ficheUid: fiche.id!.toString(),
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
