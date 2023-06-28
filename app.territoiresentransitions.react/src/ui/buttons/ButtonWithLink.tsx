import classNames from 'classnames';

type ButtonWithLinkProps = {
  children: React.ReactNode;
  href: string;
  disabled?: boolean;
  rounded?: boolean;
  secondary?: boolean;
};

const ButtonWithLink = ({
  children,
  href,
  disabled = false,
  rounded = false,
  secondary = false,
}: ButtonWithLinkProps): JSX.Element => {
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (disabled) event.preventDefault();
  };

  return (
    <a
      className={classNames('fr-btn !w-full !h-fit', {
        'rounded-md': rounded,
        'fr-btn--secondary': secondary,
        '!bg-[#e5e5e5] !text-[#929292] cursor-not-allowed': disabled,
      })}
      href={href}
      onClick={handleClick}
    >
      <span className="w-full text-center">{children}</span>
    </a>
  );
};

export default ButtonWithLink;
