import { CollectiviteType } from '../../collectivites';
import { type DemarchePcaetStatus } from './demarche-pcaet-status.enum.schema';
import { isDepotAvisOuvrable } from './workflow/demarche-pcaet-state';
import {
  getPerimetreInstructeur,
  isTypeInstructeur,
  PerimetreInstructeurEnum,
} from './pcaet-instructeur.rules';

export type PerimetreInstructeurEntree = {
  instructeurType: CollectiviteType;
  instructeurRegionCode: string | null;
  instructeurDepartementCode: string | null;
  collectiviteRegionCode: string | null;
  collectiviteDepartementCode: string | null;
};

export const instructeurCouvreCollectivite = ({
  instructeurType,
  instructeurRegionCode,
  instructeurDepartementCode,
  collectiviteRegionCode,
  collectiviteDepartementCode,
}: PerimetreInstructeurEntree): boolean => {
  if (!isTypeInstructeur(instructeurType)) {
    return false;
  }

  const perimetre = getPerimetreInstructeur(instructeurType);
  // Couvre même une collectivité dont les codes géographiques manquent.
  if (perimetre === PerimetreInstructeurEnum.NATIONAL) {
    return true;
  }
  if (perimetre === PerimetreInstructeurEnum.REGION) {
    return (
      Boolean(instructeurRegionCode) &&
      instructeurRegionCode === collectiviteRegionCode
    );
  }
  if (perimetre === PerimetreInstructeurEnum.DEPARTEMENT) {
    return (
      Boolean(instructeurDepartementCode) &&
      instructeurDepartementCode === collectiviteDepartementCode
    );
  }
  return false;
};

export type FenetreAvisEntree = {
  demarcheStatus: DemarchePcaetStatus;
  avisDeadlineAt: string | null;
};

export const fenetreAvisOuverte = (
  { demarcheStatus, avisDeadlineAt }: FenetreAvisEntree,
  now: Date
): boolean =>
  isDepotAvisOuvrable(demarcheStatus) &&
  avisDeadlineAt !== null &&
  now.getTime() < new Date(avisDeadlineAt).getTime();
