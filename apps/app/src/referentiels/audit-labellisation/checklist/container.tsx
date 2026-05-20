import { ReactElement, ReactNode } from 'react';

export const Container = ({
  children,
}: {
  children: ReactNode;
}): ReactElement => (
  <div className="p-6 bg-white rounded-lg border border-grey-3 flex flex-col">
    {children}
  </div>
);
