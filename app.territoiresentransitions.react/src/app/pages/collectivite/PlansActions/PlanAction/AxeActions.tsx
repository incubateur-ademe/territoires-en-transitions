import { useCollectiviteId } from '@/app/core-logic/hooks/params';
import { useCreateFicheResume } from '../FicheAction/data/useCreateFicheResume';
import { PlanNode } from './data/types';
import { useAddAxe } from './data/useUpsertAxe';

type Props = {
  plan: PlanNode;
  axe: PlanNode;
};

export const AxeActions = ({ plan, axe }: Props) => {
  const collectivite_id = useCollectiviteId();

  const { mutate: addAxe } = useAddAxe(axe.id, axe.depth, plan.id);
  const { mutate: createFicheResume } = useCreateFicheResume({
    axeId: axe.id,
    planId: plan.id,
    axeFichesIds: axe.fiches,
  });

  return (
    <div className="flex items-center gap-6">
      <button
        data-test="AjouterAxe"
        className="fr-btn fr-btn--sm fr-btn--secondary"
        onClick={() =>
          addAxe({ collectivite_id: collectivite_id!, parent: axe.id })
        }
      >
        Ajouter un nouveau titre
      </button>
      <button
        className="fr-btn fr-btn--sm fr-btn--primary"
        onClick={() => createFicheResume()}
      >
        Créer une fiche action
      </button>
    </div>
  );
};
