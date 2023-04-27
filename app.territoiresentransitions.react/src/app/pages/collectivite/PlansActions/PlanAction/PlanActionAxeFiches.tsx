import {makeCollectivitePlanActionFicheUrl} from 'app/paths';
import FicheActionCard from '../FicheAction/FicheActionCard';
import {useAxeFiches} from './data/useAxeFiches';
import {ActionCardSkeleton} from '../components/ActionCard';

type Props = {
  ficheIds: number[];
  axeId: number;
};

const PlanActionAxeFiches = ({ficheIds, axeId}: Props) => {
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
              link={makeCollectivitePlanActionFicheUrl({
                collectiviteId: fiche.collectivite_id!,
                planActionUid: axeId.toString(),
                ficheUid: fiche.id!.toString(),
              })}
            />
          ))}
    </div>
  );
};

export default PlanActionAxeFiches;
