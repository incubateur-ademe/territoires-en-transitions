import { JSX } from 'react';

export const Unit = ({ children }: { children: string }): JSX.Element => (
  <span className="text-xs font-normal text-grey-5">{children}</span>
);
