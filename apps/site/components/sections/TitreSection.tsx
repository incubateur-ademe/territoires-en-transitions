import classNames from 'classnames';
import { PropsWithChildren } from 'react';

export const TitreSection = ({
  children,
  className,
}: PropsWithChildren & { className?: string }) => (
  <h2 className={classNames('text-primary-10 text-center mb-4', className)}>
    {children}
  </h2>
);
