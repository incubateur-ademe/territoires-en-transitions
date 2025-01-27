import { TweenText } from '@/app/ui/shared/TweenText';
import { toLocaleFixed } from '@/app/utils/toFixed';
import { ScoreFinal } from '@/domain/referentiels';

type ScorePartial = Pick<
  ScoreFinal,
  'pointReferentiel' | 'pointPotentiel' | 'pointPotentielPerso' | 'desactive'
>;

/** Affiche le potentiel de points (normal ou réduit) ainsi qu'un bouton
 * "Personnaliser" si nécessaire */
export const PointsPotentiels = ({ score }: { score: ScorePartial }) => {
  return (
    <div data-test="PointsPotentiels">
      <TweenText text={getLabel(score)} align-left />
    </div>
  );
};

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
