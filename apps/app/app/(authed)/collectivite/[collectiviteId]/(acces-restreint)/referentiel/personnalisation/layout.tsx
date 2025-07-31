import { ReactNode } from 'react';

import { PersonnalisationProvider } from '../../../../../../../src/referentiels/personnalisations/personnalisation-referentiel.context';

export default function Layout({ children }: { children: ReactNode }) {
  return <PersonnalisationProvider>{children}</PersonnalisationProvider>;
}
