'use client';

import { createContext, ReactNode, useContext } from 'react';

import { ReferentielId } from '@tet/domain/referentiels';
import { Dispatch, SetStateAction, useState } from 'react';

type ContextProps = {
  referentiels: ReferentielId[];
  setReferentiels: Dispatch<SetStateAction<ReferentielId[]>>;
};

const PersonnalisationContext = createContext<ContextProps | null>(null);

export const PersonnalisationProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [referentiels, setReferentiels] = useState<ReferentielId[]>([
    'cae',
    'eci',
  ]);

  return (
    <PersonnalisationContext value={{ referentiels, setReferentiels }}>
      {children}
    </PersonnalisationContext>
  );
};

const usePersonnalisationReferentielsContext = () => {
  const context = useContext(PersonnalisationContext);
  if (!context) {
    throw new Error(
      'usePersonnalisationReferentiels must be used within a PersonnalisationProvider'
    );
  }
  return context;
};

export const usePersonnalisationReferentiels = () => {
  const { referentiels, setReferentiels } =
    usePersonnalisationReferentielsContext();
  return { referentiels, setReferentiels };
};
