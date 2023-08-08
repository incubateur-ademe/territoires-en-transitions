import classNames from 'classnames';

type ButtonWithLinkProps = {
  children: React.ReactNode;
  href: string;
  secondary?: boolean;
  fullWidth?: boolean;
  className?: string;
};

const ButtonWithLink = ({
  children,
  href,
  secondary = false,
  fullWidth = false,
  className,
}: ButtonWithLinkProps): JSX.Element => {
  return (
    <a
      className={classNames('fr-btn !h-fit rounded-md', className, {
        'fr-btn--secondary': secondary,
        '!w-full': fullWidth,
      })}
      href={href}
    >
      <span className="w-full text-center">{children}</span>
    </a>
  );
};

export default ButtonWithLink;
