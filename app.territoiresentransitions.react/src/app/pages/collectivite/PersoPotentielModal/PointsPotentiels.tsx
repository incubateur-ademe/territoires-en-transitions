import { ActionScore } from '@/app/referentiels/scores.types';
import { TweenText } from '@/app/ui/shared/TweenText';
import { toLocaleFixed } from '@/app/utils/toFixed';

export type TPointsPotentielsProps = {
  /** Détail du score associé à l'action */
  actionScore: ActionScore;
};

/** Affiche le potentiel de points (normal ou réduit) ainsi qu'un bouton
 * "Personnaliser" si nécessaire */
export const PointsPotentiels = ({ actionScore }: TPointsPotentielsProps) => {
  return (
    <div data-test="PointsPotentiels">
      <TweenText text={getLabel(actionScore)} align-left />
    </div>
  );
};

const getLabel = (actionScore: ActionScore): string => {
  const {
    point_referentiel,
    point_potentiel,
    point_potentiel_perso,
    desactive,
  } = actionScore;

  // affiche toujours le même libellé quand l'action est désactivée
  if (desactive) {
    return `Potentiel réduit : 0 point`;
  }

  // nombre de points courant
  const value = point_potentiel_perso ?? point_potentiel ?? point_referentiel;
  // formate le nombre de points courant
  const points = `${toLocaleFixed(value, 2)} point${value > 1 ? 's' : ''}`;

  // détermine si le score a été modifié (on vérifie un delta minimum
  // pour éviter les éventuelles erreurs d'arrondi dans le score reçu)
  const isModified = Math.abs(value - point_referentiel) >= 0.1;

  // renvoi le libellé formaté suivant si le score a été augmenté ou réduit
  if (isModified) {
    const modifLabel = value > point_referentiel ? 'augmenté' : 'réduit';
    return `Potentiel ${modifLabel} : ${points}`;
  }
  // ou est identique à la valeur initiale
  return `Potentiel : ${points}`;
};
