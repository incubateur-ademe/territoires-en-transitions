import classNames from 'classnames';
import {ButtonHTMLAttributes} from 'react';
import {ButtonSize, ButtonVariant, getTetButtonClassnames} from './utils';

type ButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
} & ButtonHTMLAttributes<HTMLButtonElement>;

const Button = ({
  children,
  variant = 'primary',
  size = 'normal',
  className,
  ...otherProps
}: ButtonProps) => {
  return (
    <button
      {...otherProps}
      className={classNames(getTetButtonClassnames(variant, size), className)}
    >
      {children}
    </button>
  );
};

export default Button;
