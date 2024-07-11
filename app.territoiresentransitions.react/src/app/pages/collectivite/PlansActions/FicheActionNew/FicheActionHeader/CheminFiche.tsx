import {Breadcrumbs} from '@tet/ui';
import {
  generateFilArianeLinks,
  usePlanActionChemin,
} from '../../PlanAction/data/usePlanActionChemin';
import {TAxeRow} from 'types/alias';
import {useHistory} from 'react-router-dom';

type CheminFicheProps = {
  titre: string;
  axeId: number;
  collectiviteId: number;
};

const CheminFiche = ({titre, axeId, collectiviteId}: CheminFicheProps) => {
  const history = useHistory();
  const {data} = usePlanActionChemin(axeId);

  return (
    <Breadcrumbs
      items={generateFilArianeLinks({
        collectiviteId,
        chemin: (data?.chemin ?? []) as TAxeRow[],
        titreFiche: titre,
      }).map(item => ({
        label: item.label,
        onClick: item.href ? () => history.push(item.href!) : undefined,
      }))}
    />
  );
};

export default CheminFiche;
