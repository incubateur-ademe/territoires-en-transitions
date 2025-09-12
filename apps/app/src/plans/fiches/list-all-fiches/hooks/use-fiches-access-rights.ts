import { useIsFicheRightsManagementEnabled } from "@/app/app/pages/collectivite/PlansActions/FicheAction/hooks/use-fiche-rights-management-enabled";
import { FicheResume } from '@/domain/plans/fiches';



export const useFichesAccessRights = (
  isLecteur: boolean,
  isEditeur: boolean,
  isAdmin: boolean,
) => {

  const isFeatureFlagEnabled = useIsFicheRightsManagementEnabled() ?? false;

  const canUserModifyFiche = (fiche: FicheResume) => {
    return !isFeatureFlagEnabled || (!isLecteur && (isAdmin || (isEditeur && fiche.canBeModifiedByCurrentUser)));
  };

  return {
    canUserModifyFiche,
  };
};
