import classNames from 'classnames';
import { Icon, IconSize } from '../Icon';
import { Tooltip, TooltipProps } from './Tooltip';

type InfoTooltipProps = Omit<TooltipProps, 'children'> & {
  size?: IconSize;
  iconClassName?: string;
};

/**
 * Icône info associée à une tooltip
 */

export const InfoTooltip = ({
  size = 'sm',
  iconClassName,
  ...tooltipProps
}: InfoTooltipProps) => {
  return (
    <Tooltip {...tooltipProps}>
      <Icon
        icon="information-line"
        size={size}
        className={classNames('text-grey-6', iconClassName, {
          'cursor-pointer': tooltipProps.activatedBy === 'click',
        })}
        onClick={(evt) => evt.stopPropagation()}
      />
    </Tooltip>
  );
};
