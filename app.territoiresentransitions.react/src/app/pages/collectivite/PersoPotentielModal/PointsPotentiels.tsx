import {MouseEventHandler} from 'react';
import {ActionDefinitionSummary} from 'core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';
import {ActionScore} from 'types/ClientScore';
import {YellowHighlight} from 'ui/Highlight';
import {toLocaleFixed} from 'utils/toFixed';

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
        {getLabel(actionDef, actionScore)}
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
  const {point_referentiel, point_potentiel_perso, desactive} = actionScore;

  if (desactive) {
    return `Potentiel pour cette ${type} : 0 point`;
  }

  const value = point_potentiel_perso || point_referentiel;
  const points = toLocaleFixed(value, 2) + ' point' + (value > 1 ? 's' : '');

  const isModified =
    point_potentiel_perso !== undefined &&
    point_potentiel_perso !== point_referentiel;
  if (isModified) {
    const modifLabel =
      point_potentiel_perso! > point_referentiel ? 'augmenté' : 'réduit';
    return `Potentiel ${modifLabel} pour cette ${type} : ${points}`;
  }

  return `Potentiel pour cette ${type} : ${points}`;
};
