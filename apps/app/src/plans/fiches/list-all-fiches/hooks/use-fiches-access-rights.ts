import { useIsFicheRightsManagementEnabled } from "@/app/app/pages/collectivite/PlansActions/FicheAction/hooks/use-fiche-rights-management-enabled";



export const useFichesAccessRights = (
  ficheResumes: any,
  isLecteur: boolean,
  isEditeur: boolean,
  isAdmin: boolean,
) => {

  const isFeatureFlagEnabled = useIsFicheRightsManagementEnabled() ?? false;

  const isPiloteOfFiche = (ficheId: number) => {
    return ficheResumes?.allIdsIAmPilote.includes(ficheId);
  };

  const hasUserAccessToFiche = (ficheId: number) => {
    return !isFeatureFlagEnabled || (!isLecteur && (isAdmin || (isEditeur && isPiloteOfFiche(ficheId))));
  };

  return {

    hasUserAccessToFiche,
    isPiloteOfFiche,
  };
};
