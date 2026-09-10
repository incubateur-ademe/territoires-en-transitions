import {
  CollectiviteSousTypeEnum,
  NATURE_TO_SOUS_TYPE,
} from '../../collectivites/identite-collectivite.schema';
import type { CollectiviteNatureType } from '../../collectivites/collectivite-banatic-type.enum';
import {
  DemarchePcaetObligationEnum,
  type DemarchePcaetObligation,
} from './demarche-pcaet-obligation.enum.schema';

/**
 * Seuil légal de l'obligation PCAET : au-delà, un EPCI à fiscalité propre doit
 * adopter un plan ; en deçà, il peut s'y engager volontairement.
 *
 * À ne pas confondre avec `PLUS_DE_45000`, qui est le seuil du plan local de
 * chaleur et de froid — intégré au PCAET, mais qui n'en déclenche pas
 * l'obligation.
 */
export const SEUIL_POPULATION_PCAET = 20_000;

/**
 * Les familles juridiques qui portent un PCAET : les EPCI à fiscalité propre.
 *
 * Les établissements publics territoriaux du Grand Paris en font partie, ce que
 * `NATURE_TO_SOUS_TYPE` dit déjà. La fonction SQL `stats.is_fiscalite_propre`
 * les exclut, comme BANATIC : cette divergence est antérieure et reste dans le
 * schéma `stats`, elle ne gouverne pas l'assujettissement.
 */
export const estNaturePorteusePcaet = (
  natureInsee: CollectiviteNatureType | null
): boolean =>
  natureInsee !== null &&
  NATURE_TO_SOUS_TYPE[natureInsee] === CollectiviteSousTypeEnum.EPCI_FP;

export type AssujettissementEntree = {
  natureInsee: CollectiviteNatureType | null;
  population: number | null;
};

/**
 * L'obligation qui se déduit de la collectivité elle-même, quand aucun dépôt ne
 * la porte : c'est ce qui permet à un service de l'État de distinguer, parmi
 * les collectivités qui n'ont rien déposé, celles qui le devraient.
 *
 * Rend `null` plutôt qu'une valeur par défaut dans deux cas où l'affirmer
 * serait faux :
 *
 * - la collectivité n'est pas d'une famille porteuse — un syndicat, un pôle ;
 * - sa population est inconnue (quatre EPCI de la base n'ont pas de millésime
 *   BANATIC). La ligne reste alors visible, sans badge : la faire disparaître
 *   d'une comparaison sur `null` serait le seul vrai défaut.
 *
 * Une démarche existante ne passe jamais ici : son `obligation` est déclarée
 * par la collectivité déposante et prime.
 */
export const getObligationAssujettissement = ({
  natureInsee,
  population,
}: AssujettissementEntree): DemarchePcaetObligation | null => {
  if (!estNaturePorteusePcaet(natureInsee)) {
    return null;
  }
  if (population === null) {
    return null;
  }
  return population > SEUIL_POPULATION_PCAET
    ? DemarchePcaetObligationEnum.OBLIGATOIRE
    : DemarchePcaetObligationEnum.VOLONTAIRE;
};
