import { CollectiviteType } from '../../collectivites';
import { type DemarchePcaetStatus } from './demarche-pcaet-status.enum.schema';
import { isActiveDemarchePcaetStatus } from './demarche-pcaet.workflow';
import {
  getCleGeoInstructeur,
  isTypeInstructeur,
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

  const cle = getCleGeoInstructeur(instructeurType);
  if (cle === 'regionCode') {
    return (
      Boolean(instructeurRegionCode) &&
      instructeurRegionCode === collectiviteRegionCode
    );
  }
  if (cle === 'departementCode') {
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
  isActiveDemarchePcaetStatus(demarcheStatus) &&
  avisDeadlineAt !== null &&
  now.getTime() < new Date(avisDeadlineAt).getTime();
