'use client';
import { useCreateFicheResume } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/useCreateFicheResume';
import { PlanNode } from '@tet/domain/plans';
import { Button, VisibleWhen } from '@tet/ui';
import { useCreateAxe } from './data/use-create-axe';

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
  const { mutate: createAxe } = useCreateAxe({
    collectiviteId,
    parentAxe: currentAxe ?? plan,
    planId: plan.id,
  });
  const { mutate: createFicheResume } = useCreateFicheResume({
    collectiviteId,
    axeId: currentAxe?.id ?? plan.id,
    planId: plan.id,
    axeFichesIds: currentAxe?.fiches ?? plan.fiches,
  });
  const canAddAxe = availableActions.includes('addAxe');
  return (
    <div className="flex items-center gap-6">
      <Button
        disabled={!canAddAxe}
        dataTest="AjouterAxe"
        size="xs"
        variant="outlined"
        onClick={() => canAddAxe && createAxe()}
      >
        Ajouter un nouveau titre/axe
      </Button>
      <VisibleWhen condition={availableActions.includes('createFicheResume')}>
        <Button size="xs" onClick={() => createFicheResume()}>
          Créer une action
        </Button>
      </VisibleWhen>
    </div>
  );
};
