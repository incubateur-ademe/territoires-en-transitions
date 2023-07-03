import classNames from 'classnames';
import {CheckIcon} from 'ui/icons/CheckIcon';
import {toLocaleFixed} from 'utils/toFixed';
import {SuiviScoreRow} from '../data/useScoreRealise';

type ScoreDisplayProps = {
  score: SuiviScoreRow;
  legend?: string;
  size?: 'xs' | 'sm';
  className?: string;
};

/**
 * Affichage du score réalisé sur le score total possible
 * pour une action donnée
 */

const ScoreDisplay = ({
  score,
  legend,
  size,
  className,
}: ScoreDisplayProps): JSX.Element => {
  return !!score ? (
    <div
      className={classNames('flex items-center', {
        visible:
          score.points_realises !== null &&
          score.points_max_personnalises !== null,
        invisible:
          score.points_realises === null ||
          score.points_max_personnalises === null,
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
      {toLocaleFixed(score.points_realises, 2)} /{' '}
      {toLocaleFixed(score.points_max_personnalises, 2)} point
      {score.points_max_personnalises > 1 ? 's' : ''}
    </div>
  ) : (
    <></>
  );
};

export default ScoreDisplay;
