'use client';
import { useCreateFicheResume } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/useCreateFicheResume';
import { PlanNode } from '@/domain/plans';
import { Button, VisibleWhen } from '@/ui';
import { useUpsertAxe } from './data/use-upsert-axe';

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
  const { mutate: addAxe } = useUpsertAxe({
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
        onClick={() =>
          canAddAxe &&
          addAxe({
            collectivite_id: collectiviteId,
            parent: currentAxe?.id ?? plan.id,
          })
        }
      >
        Ajouter un nouveau titre/axe
      </Button>
      <VisibleWhen condition={availableActions.includes('createFicheResume')}>
        <Button size="xs" onClick={() => createFicheResume()}>
          Créer une fiche action
        </Button>
      </VisibleWhen>
    </div>
  );
};
