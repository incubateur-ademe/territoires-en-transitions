'use client';

import { Panier } from '@/api';
import {
  Dispatch,
  SetStateAction,
  createContext,
  useContext,
  useState,
} from 'react';

type PanierContextType = {
  panier: Panier | null;
  setPanier: Dispatch<SetStateAction<Panier | null>>;
};

const contextDefaultValue: PanierContextType = {
  panier: null,
  setPanier: (panier: SetStateAction<Panier | null>) => undefined,
};

/**
 * Contexte permettant de récupérer le panier
 */
export const PanierContext = createContext(contextDefaultValue);

export const usePanierContext = () => {
  return useContext(PanierContext);
};

/**
 * Provider pour le contexte du panier
 */
export const PanierProvider = ({ children }: { children: React.ReactNode }) => {
  const [panier, setPanier] = useState(contextDefaultValue.panier);

  return (
    <PanierContext.Provider value={{ panier, setPanier }}>
      {children}
    </PanierContext.Provider>
  );
};
