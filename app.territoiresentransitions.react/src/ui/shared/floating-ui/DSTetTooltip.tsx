import classNames from 'classnames';
import {TTooltipProps, Tooltip} from './Tooltip';

const DSTetTooltip = ({children, ...props}: TTooltipProps) => {
  return (
    <Tooltip
      {...props}
      className={classNames(
        '!p-2 !text-grey-8 border-t border-primary rounded bg-white shadow-lg',
        props.className
      )}
      offsetValue={props.offsetValue ?? 10}
      triggerDuration={props.triggerDuration ?? 500}
      withArrow
    >
      {children}
    </Tooltip>
  );
};

export default DSTetTooltip;
