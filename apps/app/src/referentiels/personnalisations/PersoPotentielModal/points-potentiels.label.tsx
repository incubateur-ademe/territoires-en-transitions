import { toLocaleFixed } from '@/app/utils/to-locale-fixed';
import { ActionScoreFinal } from '@/domain/referentiels';
import { useScore } from '../../use-snapshot';

type ScorePartial = Pick<
  ActionScoreFinal,
  'pointReferentiel' | 'pointPotentiel' | 'pointPotentielPerso' | 'desactive'
>;

/** Affiche le potentiel de points (normal ou réduit) ainsi qu'un bouton
 * "Personnaliser" si nécessaire
 */
export function PointsPotentiels({ actionId }: { actionId: string }) {
  const score = useScore(actionId);

  if (!score) {
    return null;
  }

  return (
    <div data-test="PointsPotentiels">
      <div>{getLabel(score)}</div>
    </div>
  );
}

const getLabel = (actionScore: ScorePartial): string => {
  const { pointReferentiel, pointPotentiel, pointPotentielPerso, desactive } =
    actionScore;

  // affiche toujours le même libellé quand l'action est désactivée
  if (desactive) {
    return `Potentiel réduit : 0 point`;
  }

  // nombre de points courant
  const value = pointPotentielPerso ?? pointPotentiel ?? pointReferentiel;
  // formate le nombre de points courant
  const points = `${toLocaleFixed(value, 2)} point${value > 1 ? 's' : ''}`;

  // détermine si le score a été modifié (on vérifie un delta minimum
  // pour éviter les éventuelles erreurs d'arrondi dans le score reçu)
  const isModified = Math.abs(value - pointReferentiel) >= 0.1;

  // renvoi le libellé formaté suivant si le score a été augmenté ou réduit
  if (isModified) {
    const modifLabel = value > pointReferentiel ? 'augmenté' : 'réduit';
    return `Potentiel ${modifLabel} : ${points}`;
  }
  // ou est identique à la valeur initiale
  return `Potentiel : ${points}`;
};
