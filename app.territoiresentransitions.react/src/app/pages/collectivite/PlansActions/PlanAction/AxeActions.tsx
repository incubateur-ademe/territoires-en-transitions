import {useCreateFicheAction} from '../FicheAction/data/useUpsertFicheAction';
import {useAddAxe} from './data/useUpsertAxe';
import {PlanNode} from './data/types';
import {useCollectiviteId} from 'core-logic/hooks/params';

type Props = {
  plan: PlanNode;
  axe: PlanNode;
};

export const AxeActions = ({plan, axe}: Props) => {
  const collectivite_id = useCollectiviteId();

  const {mutate: createFiche} = useCreateFicheAction({axeId, planActionId});
  const {mutate: addAxe} = useAddAxe(axe.id, axe.depth, plan.id);

  return (
    <div className="flex items-center gap-6">
      <button
        data-test="AjouterAxe"
        className="fr-btn fr-btn--sm fr-btn--secondary"
        onClick={() =>
          addAxe({collectivite_id: collectivite_id!, parent: axe.id})
        }
      >
        Ajouter un nouveau titre
      </button>
      <button
        className="fr-btn fr-btn--sm fr-btn--primary"
        onClick={() => createFiche()}
      >
        Créer une fiche action
      </button>
    </div>
  );
};
