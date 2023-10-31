import classNames from 'classnames';
import {AnchorHTMLAttributes} from 'react';
import {ButtonSize, ButtonVariant, getTetButtonClassnames} from './utils';

type ButtonWithLinkProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  external?: boolean;
  fullWidth?: boolean;
} & AnchorHTMLAttributes<HTMLAnchorElement>;

const ButtonWithLink = ({
  children,
  href,
  variant = 'primary',
  size = 'normal',
  external = false,
  fullWidth = false,
  className,
  ...otherProps
}: ButtonWithLinkProps): JSX.Element => {
  return (
    <a
      {...otherProps}
      className={classNames(
        '!h-fit',
        {'!w-full': fullWidth},
        getTetButtonClassnames(variant, size),
        className,
      )}
      target={external ? '_blank' : undefined}
      rel={external ? 'noreferrer noopener' : undefined}
      href={href}
    >
      <span className="w-full text-center">{children}</span>
    </a>
  );
};

export default ButtonWithLink;
