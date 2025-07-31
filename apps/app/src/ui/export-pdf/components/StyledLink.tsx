import { Link, LinkProps } from '@react-pdf/renderer';
import { tw } from '../utils';

type StyledLinkProps = LinkProps & {
  children: string;
  className?: string;
};
export const StyledLink = ({
  children,
  className,
  ...props
}: StyledLinkProps) => {
  const style = className ? ` ${className}` : '';

  return (
    <Link
      style={tw(`text-primary-10 text-xs font-normal leading-6${style}`)}
      {...props}
    >
      {children}
    </Link>
  );
};
