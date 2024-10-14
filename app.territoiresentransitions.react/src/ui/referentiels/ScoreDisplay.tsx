import classNames from 'classnames';
import { IconDoubleCheck } from 'ui/icons/IconDoubleCheck';
import { toLocaleFixed } from 'utils/toFixed';

type ScoreDisplayProps = {
  score: number | null;
  scoreMax?: number | null;
  percent?: boolean;
  icon?: 'check' | string;
  iconColor?: string;
  legend?: string;
  size?: 'xs' | 'sm';
  bold?: 'value' | 'legend' | 'all' | undefined;
  className?: string;
};

/**
 * Affichage du score réalisé sur le score total possible
 */

const ScoreDisplay = ({
  score,
  scoreMax,
  percent = false,
  icon = 'check',
  legend,
  size,
  bold,
  className,
}: ScoreDisplayProps): JSX.Element => {
  return (
    <div
      className={classNames(
        'flex items-center',
        score !== null &&
          scoreMax !== null &&
          (scoreMax !== undefined || percent)
          ? 'visible'
          : 'invisible',
        {
          'text-xs': size === 'xs',
          'text-sm': size === 'sm',
          'text-base': size === undefined,
          className,
        }
      )}
    >
      {icon === 'check' ? (
        <IconDoubleCheck className="h-4 inline-block mr-1" />
      ) : (
        <div
          className={classNames(
            'h-4 inline-block scale-75 -mt-1 before:text-[#417DC4]',
            icon,
            'mr-1'
          )}
        />
      )}

      <div>
        <span
          className={classNames('whitespace-pre-wrap', {
            'font-bold': bold === 'legend' || bold === 'all',
          })}
        >
          {legend ? `${legend} : ` : ''}
        </span>
        <span
          className={classNames({
            'font-bold': bold === 'value' || bold === 'all',
          })}
        >
          {percent
            ? `${toLocaleFixed(
                Math.round((score ?? 0) * 10000) / 100,
                (score ?? 0) < 0.01 ? 2 : 0
              )} %`
            : `${toLocaleFixed(score ?? 0, 2)} / ${toLocaleFixed(
                scoreMax ?? 0,
                2
              )} point${scoreMax ?? 0 > 1 ? 's' : ''}`}
        </span>
      </div>
    </div>
  );
};

export default ScoreDisplay;
