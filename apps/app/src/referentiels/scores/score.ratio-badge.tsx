import { roundTo } from '@tet/domain/utils';
import { Badge, BadgeDouble, BadgeSize } from '@tet/ui';
import classNames from 'classnames';
import { ActionListItem } from '../actions/use-list-actions';

type Props = {
  action?: ActionListItem;
  size?: BadgeSize;
  className?: string;
};

export const ScoreRatioBadge = ({ action, size, className }: Props) => {
  if (!action || !action.score) {
    return null;
  }

  const { pointFait, pointPotentiel } = action.score;

  const roundPointFait = roundTo(pointFait, 1);
  const roundPointPotentiel = roundTo(pointPotentiel, 1);

  return (
    <div
      data-test={`scoreRatio-${action.actionId}`}
      className={classNames('flex', className)}
    >
      {pointPotentiel === 0 ? (
        <Badge
          title="0 point"
          variant="grey"
          type="outlined"
          uppercase={false}
          size={size}
        />
      ) : (
        <BadgeDouble
          variant="success"
          type="solid"
          size={size}
          badgeLeft={{
            title: `${roundTo((pointFait / pointPotentiel) * 100, 1)} %`,
            uppercase: false,
            trim: false,
          }}
          badgeRight={{
            title: `${roundPointFait} / ${roundPointPotentiel} points`,
            uppercase: false,
            trim: false,
          }}
        />
      )}
    </div>
  );
};
