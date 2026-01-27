import NextLink, { LinkProps } from 'next/link';
import { HTMLAttributeAnchorTarget } from 'react';
import { cn } from '../../utils/cn';

type Props = LinkProps & {
  openInNewTab?: boolean;
  className?: string;
  target?: HTMLAttributeAnchorTarget;
  rel?: string;
  children?: React.ReactNode;
};

export const InlineLink = ({ openInNewTab, className, ...props }: Props) => {
  return (
    <NextLink
      {...props}
      target={openInNewTab ? '_blank' : props.target}
      rel={openInNewTab ? 'noreferrer noopener' : props.rel}
      className={cn(
        'underline underline-offset-4 hover:decoration-2',
        className
      )}
    >
      {props.children}{' '}
      {openInNewTab && <span className="ri-external-link-line" />}
    </NextLink>
  );
};
