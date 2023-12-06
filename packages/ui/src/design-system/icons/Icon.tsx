import classNames from 'classnames';
import {IconSize} from './types';

type IconProps = {
  icon: JSX.Element | ((className: string) => JSX.Element) | string;
  size: IconSize;
  svgClassName?: string;
};

export const Icon = ({icon, size = 'md', svgClassName}: IconProps) => {
  if (typeof icon === 'string') {
    return (
      <div
        className={classNames(icon, 'before:block', {
          'h-3 w-3 before:h-3 before:w-3': size === 'xs',
          'h-3.5 w-3.5 before:h-3.5 before:w-3.5': size === 'sm',
          'h-4 w-4 before:h-4 before:w-4': size === 'md',
          'h-5 w-5 before:h-5 before:w-5': size === 'lg',
          'h-6 w-6 before:h-6 before:w-6': size === 'xl',
          'h-8 w-8 before:h-8 before:w-8': size === '2xl',
        })}
      />
    );
  } else if (typeof icon === 'function') {
    return icon(
      classNames(
        {
          'h-3 w-3': size === 'xs',
          'h-3.5 w-3.5': size === 'sm',
          'h-4 w-4': size === 'md',
          'h-5 w-5': size === 'lg',
          'h-6 w-6': size === 'xl',
          'h-8 w-8': size === '2xl',
        },
        svgClassName
      )
    );
  } else return icon;
};
