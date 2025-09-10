'use client';
import { CurrentCollectivite } from '@/api/collectivites';
import { FicheAction } from '@/app/app/pages/collectivite/PlansActions/FicheAction/FicheAction';
import { useFichePilote } from '@/app/app/pages/collectivite/PlansActions/FicheAction/hooks/use-fiche-pilote';
import { useGetPlan } from '@/app/plans/plans/show-plan/data/use-get-plan';
import { Plan } from 'packages/domain/src/plans/plans/plans.schema';
import { Fiche, useGetFiche } from './data/use-get-fiche';

type FicheActionWrapperProps = {
  collectivite: CurrentCollectivite;
  fiche: Fiche;
  plan: Plan;
};

export const FicheActionWrapper = ({
  collectivite,
  fiche: initialFiche,
  plan: initialPlanData,
}: FicheActionWrapperProps) => {
  const { data: fiche } = useGetFiche({
    id: initialFiche.id,
    initialData: initialFiche,
  });

  const plan = useGetPlan(initialPlanData.id, {
    initialData: initialPlanData,
  });

  const { isUserPilote } = useFichePilote(plan, fiche);

  if (!fiche) {
    return null;
  }

  return (
    <>
      <FicheAction
        collectivite={collectivite}
        fiche={fiche}
        planId={plan.id}
        isEditable={isUserPilote || collectivite.niveauAcces === 'admin'}
      />
    </>
  );
};
