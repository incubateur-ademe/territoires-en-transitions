'use client';

import { ReferentielId } from '@tet/domain/referentiels';
import { createContext, ReactNode, useContext } from 'react';
import {
  ReferentielDefinition,
  useGetReferentielDefinition,
} from './definitions/use-get-referentiel-definition';

type ContextProps = {
  referentielId: ReferentielId;
  referentielDefinition: ReferentielDefinition | undefined;
};

const ReferentielContext = createContext<ContextProps | null>(null);

export function ReferentielProvider({
  referentielId,
  children,
}: {
  referentielId: ReferentielId;
  children: ReactNode;
}) {
  const { data: referentielDefinition } = useGetReferentielDefinition({
    referentielId,
  });

  return (
    <ReferentielContext.Provider
      value={{ referentielId, referentielDefinition }}
    >
      {children}
    </ReferentielContext.Provider>
  );
}

function useReferentielContext() {
  const context = useContext(ReferentielContext);
  if (!context) {
    throw new Error('useReferentiel must be used within a ReferentielProvider');
  }
  return context;
}

export function useReferentielId() {
  return useReferentielContext().referentielId;
}

export function useGetReferentielDefinitionFromContext() {
  const context = useReferentielContext();
  return context.referentielDefinition;
}
