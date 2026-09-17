import type { StatutDetailleAuPourcentage } from '@tet/domain/referentiels';
import { clamp } from 'es-toolkit';

/**
 * Dérive l'avancement détaillé au pourcentage d'une action à partir de son score
 * indicatif `fait`.
 *
 * Le score étant un taux de réalisation, il se réduit à une part faite et une
 * part pas faite : la part programmée est toujours nulle. Le score est bridé à
 * [0, 1] car la formule de calcul peut dépasser le plafond.
 *
 * Renvoie `null` lorsque le score n'est pas calculable : c'est à l'appelant de
 * décider quoi faire (en pratique, ne rien écrire).
 */
export function calculateAvancementFromScore(
  score: number | null | undefined
): StatutDetailleAuPourcentage | null {
  if (score === null || score === undefined || !Number.isFinite(score)) {
    return null;
  }

  const fait = clamp(score, 0, 1);

  return [fait, 0, 1 - fait];
}
