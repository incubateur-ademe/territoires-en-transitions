import classNames from 'classnames';
import {ActionDefinitionSummary} from 'core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';
import {CheckIcon} from 'ui/icons/CheckIcon';
import {toLocaleFixed} from 'utils/toFixed';
import {useScoreRealise} from '../data/useScoreRealise';

type ScoreDisplayProps = {
  action: ActionDefinitionSummary;
  legend?: string;
  size?: 'xs' | 'sm';
  className?: string;
};

/**
 * Affichage du score réalisé sur le score total possible
 * pour une action donnée
 */

const ScoreDisplay = ({
  action,
  legend,
  size,
  className,
}: ScoreDisplayProps): JSX.Element => {
  const {pointsRealises, pointsMax} = useScoreRealise(action);

  return (
    <span
      className={classNames({
        visible: pointsRealises !== null && pointsMax !== null,
        invisible: pointsRealises === null || pointsMax === null,
        'text-xs': size === 'xs',
        'text-sm': size === 'sm',
        'text-base': size === undefined,
        className,
      })}
    >
      <CheckIcon
        className={classNames('h-4 inline-block', {
          'mr-1': size === 'xs',
          'mr-2': size === 'sm',
        })}
      />
      {legend ? `${legend} : ` : ''}
      {toLocaleFixed(pointsRealises, 2)} / {toLocaleFixed(pointsMax, 2)} points
    </span>
  );
};

export default ScoreDisplay;
