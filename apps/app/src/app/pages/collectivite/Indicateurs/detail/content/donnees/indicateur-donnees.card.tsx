import type { JSX, PropsWithChildren } from 'react';

export const IndicateurDonneesCard = ({
  children,
}: PropsWithChildren): JSX.Element => (
  <div className="flex flex-col gap-7 bg-white p-10 border border-grey-3 rounded-xl">
    {children}
  </div>
);
