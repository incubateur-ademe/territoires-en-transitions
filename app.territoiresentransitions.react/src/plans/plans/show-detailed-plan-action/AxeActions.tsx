'use client';
import { useCreateFicheResume } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/useCreateFicheResume';
import { PlanNode } from '@/app/plans/plans/types';
import { Button } from '@/ui';
import { useAddAxe } from './data/useUpsertAxe';

type Props = {
  plan: PlanNode;
  currentAxe?: PlanNode;
  collectiviteId: number;
};

export const AxeActions = ({ plan, currentAxe, collectiviteId }: Props) => {
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
      <Button size="xs" onClick={() => createFicheResume()}>
        Créer une fiche action
      </Button>
    </div>
  );
};
