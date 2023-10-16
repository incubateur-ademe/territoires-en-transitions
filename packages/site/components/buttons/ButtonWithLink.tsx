import classNames from 'classnames';

type ButtonWithLinkProps = {
  children: React.ReactNode;
  href: string;
  secondary?: boolean;
  tertiary?: boolean;
  external?: boolean;
  fullWidth?: boolean;
  className?: string;
};

const ButtonWithLink = ({
  children,
  href,
  secondary = false,
  tertiary = false,
  external = false,
  fullWidth = false,
  className,
}: ButtonWithLinkProps): JSX.Element => {
  return (
    <a
      className={classNames(
        'fr-btn !h-fit',
        {
          'fr-btn--tertiary': tertiary,
          'fr-btn--secondary': secondary,
          '!w-full': fullWidth,
        },
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
