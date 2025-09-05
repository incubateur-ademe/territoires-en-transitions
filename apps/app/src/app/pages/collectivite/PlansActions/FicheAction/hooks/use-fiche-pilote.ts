import { useUser } from '@/api/users/user-provider';
import { Fiche } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/use-get-fiche';
import { useGetPlanById } from '@/app/plans/plans/show-plan/data/use-get-plan';
import { Plan } from 'packages/domain/src/plans/plans/plans.schema';
import { useEffect, useState } from 'react';


const isUserPiloteOfPlanOrFiche = (userId: string, fiche?: Fiche, plan?: Plan,) => (plan?.pilotes?.some((pilote) => pilote.userId === userId) || fiche?.pilotes?.some((pilote) => pilote.userId === userId)) ?? false

export const useFichePilote = (
  planId?: number,
  fiche?: Fiche,
): {
  isPilote: boolean;
} => {
  const { id: userId } = useUser();

  const plan = planId ? useGetPlanById(planId) : undefined;

  const [isPilote, setIsPilote] = useState(
    isUserPiloteOfPlanOrFiche(userId, fiche, plan)
  );

  useEffect(() => {
    setIsPilote(
      isUserPiloteOfPlanOrFiche(userId, fiche, plan)
    );
  }, [fiche]);

  return { isPilote };
};
