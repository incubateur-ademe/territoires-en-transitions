import { useUser } from '@/api/users/user-provider';
import { Fiche } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/use-get-fiche';
import { useIsFicheRightsManagementEnabled } from '@/app/app/pages/collectivite/PlansActions/FicheAction/hooks/use-fiche-rights-management-enabled';
import { Plan } from '@/domain/plans/plans';
import { useEffect, useState } from 'react';


const isUserPiloteOfPlanOrFiche = (userId: string, fiche?: Fiche, plan?: Plan,) => (plan?.pilotes?.some((pilote) => pilote.userId === userId) || fiche?.pilotes?.some((pilote) => pilote.userId === userId)) ?? false

export const useFichePilote = (
  plan?: Plan,
  fiche?: Fiche,
): {
  isPilote: boolean;
} => {
  const { id: userId } = useUser();

  const isFeatureFlagEnabled = useIsFicheRightsManagementEnabled() ?? false;


  const [isPilote, setIsPilote] = useState(
    !isFeatureFlagEnabled || isUserPiloteOfPlanOrFiche(userId, fiche, plan)
  );

  useEffect(() => {
    setIsPilote(
      !isFeatureFlagEnabled || isUserPiloteOfPlanOrFiche(userId, fiche, plan)
    );
  }, [fiche]);

  return { isPilote };
};
