'use client';

import type { PersonnalisationQuestionReponse } from '@tet/domain/collectivites';
import { createContext, type PropsWithChildren, useContext } from 'react';

type IndicateurPersonnalisationValue = {
  useListQuestionsReponses: () => PersonnalisationQuestionReponse[];
};

const IndicateurPersonnalisationContext =
  createContext<IndicateurPersonnalisationValue | null>(null);

export const IndicateurPersonnalisationProvider = ({
  value,
  children,
}: PropsWithChildren<{ value: IndicateurPersonnalisationValue }>) => (
  <IndicateurPersonnalisationContext.Provider value={value}>
    {children}
  </IndicateurPersonnalisationContext.Provider>
);

export const useIndicateurPersonnalisation =
  (): IndicateurPersonnalisationValue => {
    const context = useContext(IndicateurPersonnalisationContext);
    if (!context) {
      throw new Error(
        'useIndicateurPersonnalisation must be used within an IndicateurPersonnalisationProvider'
      );
    }
    return context;
  };
