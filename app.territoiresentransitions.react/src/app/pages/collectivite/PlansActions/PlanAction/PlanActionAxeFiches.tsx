import {
  makeCollectivitePlanActionAxeFicheUrl,
  makeCollectivitePlanActionFicheUrl,
} from 'app/paths';
import FicheActionCard from '../FicheAction/FicheActionCard';
import {useAxeFiches} from './data/useAxeFiches';
import {ActionCardSkeleton} from '../components/ActionCard';

type Props = {
  isAxePage: boolean;
  ficheIds: number[];
  planId: number;
  axeId: number;
};

const PlanActionAxeFiches = ({isAxePage, ficheIds, planId, axeId}: Props) => {
  const {data, isLoading} = useAxeFiches({ficheIds, axeId});

  return (
    <div className="grid grid-cols-2 gap-4">
      {isLoading
        ? ficheIds.map(id => <ActionCardSkeleton key={id} />)
        : data &&
          data.map(fiche => (
            <FicheActionCard
              key={fiche.id}
              ficheAction={fiche}
              link={
                isAxePage
                  ? makeCollectivitePlanActionAxeFicheUrl({
                      collectiviteId: fiche.collectivite_id!,
                      planActionUid: planId.toString(),
                      ficheUid: fiche.id!.toString(),
                      axeUid: axeId.toString(),
                    })
                  : makeCollectivitePlanActionFicheUrl({
                      collectiviteId: fiche.collectivite_id!,
                      planActionUid: planId.toString(),
                      ficheUid: fiche.id!.toString(),
                    })
              }
            />
          ))}
    </div>
  );
};

export default PlanActionAxeFiches;
