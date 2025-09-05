
import { useIsAdmin, useIsEditeur, useIsLecteur } from '@/api/collectivites/collectivite-context';


// TODO : maybe use useFichePilote ?
export const useFichesAccessRights = (
  ficheResumes: any,
) => {

  const isPiloteOfFiche = (ficheId: number) => {
    return ficheResumes?.allIdsIAmPilot.includes(ficheId);
  };

  const hasUserAccessToFiche = (ficheId: number) => {
    return !useIsLecteur() && (useIsAdmin() || (useIsEditeur() && isPiloteOfFiche(ficheId)))
  };

  return {

    hasUserAccessToFiche,
    isPiloteOfFiche,
  };
};
