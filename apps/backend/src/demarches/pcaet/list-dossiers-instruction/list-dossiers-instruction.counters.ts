import type { PcaetStatutInstruction } from '@tet/domain/demarches';
import {
  emptyCountByStatut,
  type DossiersInstructionStats,
} from './list-dossiers-instruction.output';

const MILLISECONDES_PAR_JOUR = 24 * 60 * 60 * 1000;

/**
 * Ce qu'une ligne apporte aux compteurs, et rien de plus : ni son libellé, ni
 * ses contacts, ni la collectivité qui la porte.
 */
export type LigneComptable = {
  statut: PcaetStatutInstruction;
  /**
   * Ce service est-il celui qui répond de cette ligne ?
   *
   * Deux façons d'en sortir, et il faut les deux : le dossier ne l'atteint que
   * par un périmètre secondaire — le service du siège répond —, ou il a été
   * transmis sans le saisir, si bien qu'il n'a aucune prise dessus. Une
   * collectivité qui n'a rien déposé, elle, relève bien de lui : c'est
   * précisément celle qu'il doit relancer.
   */
  relveDeSaCharge: boolean;
  transmittedAt: string | null;
  /** Validation du dernier avis rendu sur la saisine, `null` si aucun ne l'est. */
  dernierAvisValideLe: string | null;
};

/**
 * Les compteurs du périmètre, filtres ignorés : ils disent la charge du service,
 * là où la liste dit ce qu'il regarde.
 *
 * Un service qui se prononce ne compte que les lignes dont il répond : ce qu'un
 * territoire limitrophe lui donne à lire avance sans lui, comme un dossier
 * transmis sans le saisir, et les additionner lui ferait surestimer son travail.
 * Un service qui ne se prononce jamais — DDT, DR ADEME, national — compte tout :
 * son libellé dit « en instruction », c'est un suivi et non une charge.
 */
export const compterCharge = (
  lignes: readonly LigneComptable[],
  { serviceSePrononce }: { serviceSePrononce: boolean }
): {
  countByStatut: Record<PcaetStatutInstruction, number>;
  stats: DossiersInstructionStats;
} => {
  const charge = serviceSePrononce
    ? lignes.filter((ligne) => ligne.relveDeSaCharge)
    : lignes;

  const countByStatut = emptyCountByStatut();
  for (const ligne of charge) {
    countByStatut[ligne.statut] += 1;
  }

  return {
    countByStatut,
    // Le délai moyen souffrirait du même biais : une instruction menée par le
    // service du siège n'est pas une performance du service voisin.
    stats: { delaiMoyenJours: calculerDelaiMoyenJours(charge) },
  };
};

/**
 * Délai moyen d'instruction : le temps qu'il a fallu, de la transmission à
 * l'avis rendu.
 *
 * Seules les instructions abouties comptent — une instruction en cours n'a pas
 * encore de durée. `null` quand aucune n'a abouti : il n'y a alors rien à
 * moyenner, et l'écran n'affiche pas un zéro qui se lirait comme « instruit le
 * jour même ».
 */
const calculerDelaiMoyenJours = (
  lignes: readonly LigneComptable[]
): number | null => {
  const durees = lignes
    .filter(
      (ligne) =>
        ligne.transmittedAt !== null && ligne.dernierAvisValideLe !== null
    )
    .map((ligne) =>
      Math.max(
        0,
        Math.round(
          (new Date(ligne.dernierAvisValideLe as string).getTime() -
            new Date(ligne.transmittedAt as string).getTime()) /
            MILLISECONDES_PAR_JOUR
        )
      )
    );

  if (durees.length === 0) {
    return null;
  }

  return Math.round(
    durees.reduce((total, jours) => total + jours, 0) / durees.length
  );
};
