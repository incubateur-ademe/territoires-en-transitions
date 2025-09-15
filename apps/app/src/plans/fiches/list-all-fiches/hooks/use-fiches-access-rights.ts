import { FicheResume } from '@/domain/plans/fiches';



export const useFichesAccessRights = (
  isLecteur: boolean,
  isEditeur: boolean,
  isAdmin: boolean,
) => {

  // const isFeatureFlagEnabled = useIsFicheRightsManagementEnabled() ?? false;
  const isFeatureFlagEnabled = true;

  const canUserModifyFiche = (fiche: FicheResume) => {
    return !isFeatureFlagEnabled || (!isLecteur && (isAdmin || (isEditeur && fiche.canBeModifiedByCurrentUser)));
  };

  return {
    canUserModifyFiche,
  };
};
