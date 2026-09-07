import { CollectiviteType } from '../../collectivites';
import { type DemarchePcaetStatus } from './demarche-pcaet-status.enum.schema';
import { isDepotAvisOuvrable } from './workflow/demarche-pcaet-state';
import {
  getPerimetreInstructeur,
  isTypeInstructeur,
  PerimetreInstructeurEnum,
} from './pcaet-instructeur.rules';

/**
 * Les territoires de part et d'autre, en **listes** et non en codes uniques :
 * une collectivité peut couvrir plusieurs régions ou départements. Une DR ADEME
 * en pilote deux (l'Océan Indien couvre La Réunion et Mayotte), un EPCI
 * chevauche plusieurs départements (Redon Agglomération s'étale sur 44, 56 et
 * 35, donc sur deux régions).
 *
 * Chaque liste réunit le périmètre principal, porté par `collectivite`, et les
 * secondaires, portés par `collectivite_perimetre_secondaire`. Les codes
 * manquants n'y figurent pas : une liste vide dit « aucun territoire », ce qui ne
 * croise jamais rien.
 */
export type PerimetreInstructeurEntree = {
  instructeurType: CollectiviteType;
  instructeurRegionCodes: readonly string[];
  instructeurDepartementCodes: readonly string[];
  collectiviteRegionCodes: readonly string[];
  collectiviteDepartementCodes: readonly string[];
};

/** Deux territoires se rencontrent-ils ? Deux listes vides, jamais. */
const seCroisent = (
  instructeur: readonly string[],
  collectivite: readonly string[]
): boolean => instructeur.some((code) => collectivite.includes(code));

export const instructeurCouvreCollectivite = ({
  instructeurType,
  instructeurRegionCodes,
  instructeurDepartementCodes,
  collectiviteRegionCodes,
  collectiviteDepartementCodes,
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
    return seCroisent(instructeurRegionCodes, collectiviteRegionCodes);
  }
  if (perimetre === PerimetreInstructeurEnum.DEPARTEMENT) {
    return seCroisent(
      instructeurDepartementCodes,
      collectiviteDepartementCodes
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
