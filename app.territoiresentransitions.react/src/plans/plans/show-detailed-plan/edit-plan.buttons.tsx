'use client';
import { useCreateFicheAction } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/useCreateFicheAction';
import { PlanNode } from '@/app/plans/plans/types';
import { Button } from '@/ui';
import { useAddAxe } from './data/use-upsert-axe';

type Props = {
  plan: PlanNode;
  currentAxe?: PlanNode;
  collectiviteId: number;
};

export const EditPlanButtons = ({
  plan,
  currentAxe,
  collectiviteId,
}: Props) => {
  const { mutate: addAxe } = useAddAxe({
    parentAxe: currentAxe ?? plan,
    planActionId: plan.id,
  });

  const { mutate: createFicheAction } = useCreateFicheAction();

  return (
    <div className="flex items-center gap-6">
      <Button
        dataTest="AjouterAxe"
        size="xs"
        variant="outlined"
        onClick={() =>
          addAxe({
            collectivite_id: collectiviteId,
            parent: currentAxe?.id ?? plan.id,
          })
        }
      >
        Ajouter un nouveau titre/axe
      </Button>
      <Button size="xs" onClick={() => createFicheAction()}>
        Créer une fiche action
      </Button>
    </div>
  );
};
