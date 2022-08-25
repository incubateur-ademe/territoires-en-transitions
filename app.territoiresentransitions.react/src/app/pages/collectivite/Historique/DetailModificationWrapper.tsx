import {ReactNode} from 'react';

const wrapperClassName = 'max-w-full w-max p-2 border-2';

/*
 * À utiliser pour encadrer une modification dans les détails
 * Précédente: cadre rouge
 * Nouvelle: cadre vert
 */
export const DetailPrecedenteModificationWrapper = ({
  children,
}: {
  children: ReactNode;
}) => (
  <div data-test="prev" className={`${wrapperClassName} mb-4 border-red-400`}>
    {children}
  </div>
);

export const DetailNouvelleModificationWrapper = ({
  children,
}: {
  children: ReactNode;
}) => (
  <div data-test="new" className={`${wrapperClassName} border-green-400`}>
    {children}
  </div>
);
