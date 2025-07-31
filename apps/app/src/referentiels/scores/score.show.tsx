import { toLocaleFixed } from '@/app/utils/to-locale-fixed';
import { Icon } from '@/ui';
import classNames from 'classnames';

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

const ScoreShow = ({
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
        <Icon icon="check-double-line" className="mr-1.5 text-success" />
      ) : (
        <Icon icon={icon} className="mr-1.5 text-primary" />
      )}

      <div>
        <span
          className={classNames('whitespace-pre-wrap', {
            'font-bold': bold === 'legend' || bold === 'all',
          })}
        >
          {legend ? `${legend}\u00A0: ` : '\u00A0'}
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
              )}\u00A0%`
            : `${toLocaleFixed(score ?? 0, 2)} / ${toLocaleFixed(
                scoreMax ?? 0,
                2
              )} point${scoreMax ?? 0 > 1 ? 's' : ''}`}
        </span>
      </div>
    </div>
  );
};

export default ScoreShow;
