import { useCreateFicheResume } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/useCreateFicheResume';
import { useAddAxe } from '@/app/plans/plans/detailed-plan-action-view/data/useUpsertAxe';
import { PlanNode } from '@/app/plans/plans/types';
import { Button } from '@/ui';

type Props = {
  plan: PlanNode;
  axe: PlanNode;
  collectiviteId: number;
};

export const AxeActions = ({ plan, axe, collectiviteId }: Props) => {
  const { mutate: addAxe } = useAddAxe(axe.id, axe.depth, plan.id);
  const { mutate: createFicheResume } = useCreateFicheResume({
    collectiviteId,
    axeId: axe.id,
    planId: plan.id,
    axeFichesIds: axe.fiches,
  });

  return (
    <div className="flex items-center gap-6">
      <Button
        dataTest="AjouterAxe"
        size="xs"
        variant="outlined"
        onClick={() =>
          addAxe({ collectivite_id: collectiviteId, parent: axe.id })
        }
      >
        Ajouter un nouveau titre
      </Button>
      <Button size="xs" onClick={() => createFicheResume()}>
        Créer une fiche action
      </Button>
    </div>
  );
};
