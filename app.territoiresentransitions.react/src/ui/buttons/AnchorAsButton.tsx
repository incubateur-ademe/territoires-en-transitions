import {AnchorHTMLAttributes} from 'react';

const AnchorAsButton = ({
  children,
  onClick,
  ...otherProps
}: AnchorHTMLAttributes<HTMLAnchorElement>) => {
  return (
    <a
      {...otherProps}
      href="/"
      onClick={evt => {
        evt.preventDefault();
        if (onClick) onClick(evt);
      }}
    >
      {children}
    </a>
  );
};

export default AnchorAsButton;
