/**
 * Affiche ...
 */

import {ReactNode} from 'react';

export type TBadgeProps = {
  className?: string;
  status: 'info' | 'success' | 'error' | 'warning' | 'new' | 'no-icon';
  children: ReactNode;
};

export const Badge = (props: TBadgeProps) => {
  const {className, status, children} = props;
  return (
    <p className={`fr-badge fr-badge--${status} ${className || ''}`}>
      {children}
    </p>
  );
};
