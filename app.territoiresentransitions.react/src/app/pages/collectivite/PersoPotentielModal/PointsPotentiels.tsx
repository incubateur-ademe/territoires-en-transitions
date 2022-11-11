import {MouseEventHandler} from 'react';
import {ActionDefinitionSummary} from 'core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';
import {ActionScore} from 'types/ClientScore';
import {YellowHighlight} from 'ui/Highlight';
import {toLocaleFixed} from 'utils/toFixed';
import {TweenText} from 'ui/shared/TweenText';

export type TPointsPotentielsProps = {
  /** Définition de l'action */
  actionDef: ActionDefinitionSummary;
  /** Détail du score associé à l'action */
  actionScore: ActionScore;
  /** Fonction appelée quand le bouton Personnaliser est cliqué (le bouton ne
   * s'affiche pas si absent) */
  onEdit?: MouseEventHandler;
};

/** Affiche le potentiel de points (normal ou réduit) ainsi qu'un bouton
 * "Personnaliser" si nécessaire */
export const PointsPotentiels = ({
  actionDef,
  actionScore,
  onEdit,
}: TPointsPotentielsProps) => {
  return (
    <YellowHighlight>
      <div data-test="PointsPotentiels" className="flex items-center">
        <TweenText text={getLabel(actionDef, actionScore)} align-left />
        {typeof onEdit === 'function' ? (
          <button
            className="fr-link fr-link--icon-left fr-fi-settings-line fr-ml-10v"
            onClick={onEdit}
          >
            Personnaliser
          </button>
        ) : null}
      </div>
    </YellowHighlight>
  );
};

const getLabel = (
  actionDef: ActionDefinitionSummary,
  actionScore: ActionScore
): string => {
  const {type} = actionDef;
  const {point_referentiel, point_potentiel, point_potentiel_perso, desactive} =
    actionScore;

  // affiche toujours le même libellé quand l'action est désactivée
  if (desactive) {
    return `Potentiel réduit pour cette ${type} : 0 point`;
  }

  // nombre de points initial
  const initial = point_referentiel;

  // nombre de points courant
  const value = point_potentiel_perso ?? point_potentiel ?? point_referentiel;
  // formate le nombre de points courant
  const points = toLocaleFixed(value, 2) + ' point' + (value > 1 ? 's' : '');

  // détermine si le score a été modifié (on vérifie un delta minimum
  // pour éviter les éventuelles erreurs d'arrondi dans le score reçu)
  const isModified = Math.abs(value - initial) >= 0.1;

  // renvoi le libellé formaté suivant si le score a été augmenté ou réduit
  if (isModified) {
    const modifLabel = value > initial ? 'augmenté' : 'réduit';
    return `Potentiel ${modifLabel} pour cette ${type} : ${points}`;
  }
  // ou est identique à la valeur initiale
  return `Potentiel pour cette ${type} : ${points}`;
};
