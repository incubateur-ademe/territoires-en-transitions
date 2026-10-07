import { CollectiviteType } from '../../collectivites';
import { type DemarchePcaetStatus } from './demarche-pcaet-status.enum.schema';
import { isDepotAvisOuvrable } from './workflow/demarche-pcaet-state';
import {
  getPerimetreInstructeur,
  isTypeInstructeur,
  PerimetreInstructeurEnum,
} from './pcaet-instructeur.rules';
import {
  PcaetPerimetreSaisineEnum,
  type PcaetPerimetreSaisine,
} from './pcaet-perimetre-saisine.enum.schema';

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

/**
 * Ce qu'il faut de plus pour dire *par quel* territoire le service atteint la
 * déposante : le siège de celle-ci, à part de ses territoires secondaires.
 */
export type PerimetreSaisineEntree = PerimetreInstructeurEntree & {
  collectiviteRegionCode: string | null;
  collectiviteDepartementCode: string | null;
};

/**
 * Par quel territoire de la déposante ce service l'atteint — `null` s'il ne la
 * couvre pas.
 *
 * Le pendant en mémoire du `case when` qui pose `perimetre` à la transmission :
 * principal quand le service couvre le **siège** de la déposante, secondaire
 * quand il ne l'atteint que par un territoire débordant. Le national est
 * principal par construction — il couvre le pays, pas un territoire qui
 * pourrait être secondaire.
 *
 * Sert là où aucune saisine ne porte encore le fait : un dépôt en élaboration,
 * que le service lit au titre de son périmètre.
 */
export const getPerimetreSaisine = (
  entree: PerimetreSaisineEntree
): PcaetPerimetreSaisine | null => {
  if (!instructeurCouvreCollectivite(entree)) {
    return null;
  }

  const perimetre = getPerimetreInstructeur(entree.instructeurType);
  if (perimetre === PerimetreInstructeurEnum.NATIONAL) {
    return PcaetPerimetreSaisineEnum.PRINCIPAL;
  }

  const siege =
    perimetre === PerimetreInstructeurEnum.REGION
      ? entree.collectiviteRegionCode
      : entree.collectiviteDepartementCode;
  const codes =
    perimetre === PerimetreInstructeurEnum.REGION
      ? entree.instructeurRegionCodes
      : entree.instructeurDepartementCodes;

  return siege !== null && codes.includes(siege)
    ? PcaetPerimetreSaisineEnum.PRINCIPAL
    : PcaetPerimetreSaisineEnum.SECONDAIRE;
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
