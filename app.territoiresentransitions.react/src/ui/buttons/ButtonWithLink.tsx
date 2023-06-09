import classNames from 'classnames';

type ButtonWithLinkProps = {
  children: React.ReactNode;
  href: string;
  rounded?: boolean;
  secondary?: boolean;
};

const ButtonWithLink = ({
  children,
  href,
  rounded = false,
  secondary = false,
}: ButtonWithLinkProps): JSX.Element => {
  return (
    <a
      className={classNames('fr-btn !w-full !h-fit', {
        'rounded-md': rounded,
        'fr-btn--secondary': secondary,
      })}
      href={href}
    >
      <span className="w-full text-center">{children}</span>
    </a>
  );
};

export default ButtonWithLink;
