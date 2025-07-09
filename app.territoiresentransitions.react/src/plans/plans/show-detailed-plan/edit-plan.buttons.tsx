'use client';
import { useCreateFicheResume } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/useCreateFicheResume';
import { PlanNode } from '@/app/plans/plans/types';
import { Button } from '@/ui';
import { VisibleWhen } from '@/ui/design-system/VisibleWhen';
import { useAddAxe } from './data/use-upsert-axe';

type Props = {
  plan: PlanNode;
  currentAxe?: PlanNode;
  collectiviteId: number;
  availableActions?: ('addAxe' | 'createFicheResume')[];
};

export const EditPlanButtons = ({
  plan,
  currentAxe,
  collectiviteId,
  availableActions = ['addAxe', 'createFicheResume'],
}: Props) => {
  const { mutate: addAxe } = useAddAxe({
    parentAxe: currentAxe ?? plan,
    planActionId: plan.id,
  });
  const { mutate: createFicheResume } = useCreateFicheResume({
    collectiviteId,
    axeId: currentAxe?.id ?? plan.id,
    planId: plan.id,
    axeFichesIds: currentAxe?.fiches ?? plan.fiches,
  });

  return (
    <div className="flex items-center gap-6">
      <VisibleWhen condition={availableActions.includes('addAxe')}>
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
      </VisibleWhen>
      <VisibleWhen condition={availableActions.includes('createFicheResume')}>
        <Button size="xs" onClick={() => createFicheResume()}>
          Créer une fiche action
        </Button>
      </VisibleWhen>
    </div>
  );
};
