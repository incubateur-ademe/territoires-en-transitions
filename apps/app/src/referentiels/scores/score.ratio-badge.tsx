import { SizeVariant } from '@tet/design-tokens';
import { roundTo } from '@tet/domain/utils';
import { Badge, BadgeDouble } from '@tet/ui';
import classNames from 'classnames';
import { forwardRef } from 'react';
import { ActionListItem } from '../actions/use-list-actions';

type Props = {
  action?: ActionListItem;
  size?: SizeVariant;
  className?: string;
};

export const ScoreRatioBadge = forwardRef<HTMLDivElement, Props>(
  ({ action, size, className }, ref) => {
    if (!action || !action.score) {
      return null;
    }

    const { pointFait, pointPotentiel } = action.score;

    const roundPointFait = roundTo(pointFait, 1);
    const roundPointPotentiel = roundTo(pointPotentiel, 1);

    return (
      <div
        ref={ref}
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
  }
);

ScoreRatioBadge.displayName = 'ScoreRatioBadge';
