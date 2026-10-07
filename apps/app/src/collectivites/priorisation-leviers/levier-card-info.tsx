import { JSX, ReactNode } from 'react';

export const LevierCardInfo = ({
  children,
}: {
  children: ReactNode;
}): JSX.Element => (
  <p className="mb-0 text-sm font-normal text-grey-8">{children}</p>
);
