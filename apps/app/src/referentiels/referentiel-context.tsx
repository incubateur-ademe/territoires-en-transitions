'use client';

import { ReferentielId } from '@/domain/referentiels';
import { createContext, ReactNode, useContext } from 'react';

type ContextProps = {
  referentielId: ReferentielId;
};

const ReferentielContext = createContext<ContextProps | null>(null);

export function ReferentielProvider({
  referentielId,
  children,
}: {
  referentielId: ReferentielId;
  children: ReactNode;
}) {
  return (
    <ReferentielContext.Provider value={{ referentielId }}>
      {children}
    </ReferentielContext.Provider>
  );
}

function useReferentiel() {
  const context = useContext(ReferentielContext);
  if (!context) {
    throw new Error('useReferentiel must be used within a ReferentielProvider');
  }
  return context;
}

export function useReferentielId() {
  return useReferentiel().referentielId;
}
