import classNames from 'classnames';
import {ActionDefinitionSummary} from 'core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';
import {CheckIcon} from 'ui/icons/CheckIcon';
import {useScoreRealise} from '../../../app/pages/collectivite/EtatDesLieux/Referentiel/data/useScoreRealise';

type ScoreDisplayProps = {
  action: ActionDefinitionSummary;
  size?: 'xs' | 'sm';
};

/**
 * Affichage du score réalisé sur le score total possible
 * pour une action donnée
 */

const ScoreDisplay = ({action, size}: ScoreDisplayProps): JSX.Element => {
  const {pointsRealises, pointsMax} = useScoreRealise(action);

  return (
    <div
      className={classNames({
        visible: pointsRealises !== null && pointsMax !== null,
        invisible: pointsRealises === null || pointsMax === null,
        'text-xs': size === 'xs',
        'text-sm': size === 'sm',
        'text-base': size === undefined,
      })}
    >
      <CheckIcon className="h-4 inline-block" />
      {pointsRealises} / {pointsMax} points
    </div>
  );
};

export default ScoreDisplay;
