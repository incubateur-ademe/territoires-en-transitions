import {Icon, IconSize} from '@design-system/Icon';
import {Tooltip, TooltipProps} from '@design-system/Tooltip';
import classNames from 'classnames';

type InfoTooltipProps = Omit<TooltipProps, 'children'> & {
  size?: IconSize;
  className?: string;
};

/**
 * Icône info associée à une tooltip
 */

export const InfoTooltip = ({
  size = 'sm',
  className,
  ...tooltipProps
}: InfoTooltipProps) => {
  return (
    <Tooltip {...tooltipProps}>
      <Icon
        icon="information-line"
        size={size}
        className={classNames('text-grey-6', className, {
          'cursor-pointer': tooltipProps.activatedBy === 'click',
        })}
      />
    </Tooltip>
  );
};
