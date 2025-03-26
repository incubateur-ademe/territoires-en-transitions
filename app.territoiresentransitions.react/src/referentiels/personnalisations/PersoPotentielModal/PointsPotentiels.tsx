import { toLocaleFixed } from '@/app/utils/toFixed';
import { ScoreFinal } from '@/domain/referentiels';
import { useActionScore } from '../../DEPRECATED_score-hooks';
import { useScore } from '../../use-snapshot';

type ScorePartial = Pick<
  ScoreFinal,
  'pointReferentiel' | 'pointPotentiel' | 'pointPotentielPerso' | 'desactive'
>;

/** Affiche le potentiel de points (normal ou réduit) ainsi qu'un bouton
 * "Personnaliser" si nécessaire */
export const PointsPotentiels = ({ score }: { score: ScorePartial }) => {
  return (
    <div data-test="PointsPotentiels">
      <div>{getLabel(score)}</div>
    </div>
  );
};

export function NEW_PointsPotentiels({ actionId }: { actionId: string }) {
  const NEW_score = useScore(actionId);

  if (!NEW_score) {
    return null;
  }

  return <PointsPotentiels score={NEW_score} />;
}

export function DEPRECATED_PointsPotentiels({
  actionId,
}: {
  actionId: string;
}) {
  const DEPRECATED_actionScore = useActionScore(actionId, true);

  if (!DEPRECATED_actionScore) {
    return null;
  }

  return (
    <PointsPotentiels
      score={{
        pointPotentiel: DEPRECATED_actionScore.point_potentiel,
        pointPotentielPerso:
          DEPRECATED_actionScore.point_potentiel_perso === undefined
            ? null
            : DEPRECATED_actionScore.point_potentiel_perso,
        pointReferentiel: DEPRECATED_actionScore.point_referentiel,
        desactive: DEPRECATED_actionScore.desactive,
      }}
    />
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
