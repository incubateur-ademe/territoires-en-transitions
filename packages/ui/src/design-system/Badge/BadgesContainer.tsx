import classNames from 'classnames';

import { Badge, BadgeProps } from '../Badge';
import { Tooltip } from '../Tooltip';

type BadgesContainerProps = {
  /** valeurs des badges à afficher */
  badges?: string[];
  badgeProps?: Omit<BadgeProps, 'title'>;
  maxDisplayedBadge?: {
    count: number;
    label?: string;
    state?: BadgeProps['state'];
  };
  endButtonBadge?: React.ReactNode;
  className?: string;
  resetFilters?: () => void;
};

/** Liste de badges représentant avec un nombre maximum de badges
 * optionnellement un bouton en fin de ligne. */
export const BadgesContainer = ({
  className,
  badges,
  badgeProps,
  endButtonBadge,
  maxDisplayedBadge,
}: BadgesContainerProps) => {
  if (!badges || badges.length === 0) {
    return null;
  }

  return (
    <div className={classNames('flex flex-wrap gap-x-4 gap-y-2', className)}>
      {badges.map((filter, i) => {
        if (!maxDisplayedBadge?.count || i < maxDisplayedBadge.count) {
          return (
            <Badge key={i} {...badgeProps} title={filter} uppercase={false} />
          );
        }
        return null;
      })}
      {maxDisplayedBadge?.count && badges.length > maxDisplayedBadge.count && (
        <Tooltip
          label={
            <div className="max-w-sm">
              <div
                className={classNames(
                  'flex flex-wrap gap-x-4 gap-y-2',
                  className
                )}
              >
                {badges.map((filter, i) => {
                  if (i >= maxDisplayedBadge.count) {
                    return (
                      <Badge
                        key={i}
                        {...badgeProps}
                        title={filter}
                        uppercase={false}
                      />
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          }
        >
          <div>
            <Badge
              key="more"
              {...badgeProps}
              state={maxDisplayedBadge.state || 'grey'}
              title={`+${badges.length - maxDisplayedBadge.count} ${
                maxDisplayedBadge.label || ''
              }`}
            />
          </div>
        </Tooltip>
      )}
      {endButtonBadge}
    </div>
  );
};
