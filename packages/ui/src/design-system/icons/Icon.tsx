import classNames from 'classnames';
import {IconSize} from './types';

type IconProps = {
  icon: JSX.Element | ((className: string) => JSX.Element) | string;
  size?: IconSize;
  svgClassName?: string;
};

export const Icon = ({icon, size, svgClassName}: IconProps) => {
  const sizeClassnames = {
    'h-3 w-3': size === 'xs',
    'h-3.5 w-3.5': size === 'sm',
    'h-4 w-4': size === 'md',
    'h-5 w-5': size === 'lg',
    'h-6 w-6': size === 'xl',
    'h-8 w-8': size === '2xl',
  };

  if (typeof icon === 'string') {
    return (
      <div
        className={classNames(`ri-${icon}`, 'font-normal', sizeClassnames, {
          'text-xs leading-3': size === 'xs',
          'text-sm leading-3': size === 'sm',
          'text-base leading-4': size === 'md',
          'text-xl leading-5': size === 'lg',
          'text-2xl leading-6': size === 'xl',
          'text-3xl leading-8': size === '2xl',
        })}
      />
    );
  } else if (typeof icon === 'function') {
    return icon(classNames(sizeClassnames, svgClassName));
  } else return icon;
};
