import { ReactNode } from 'react';

/**
 * Proposition : espacement hors échelle
 * Besoin : la maquette espace les cartes de statistique de 12px, entre
 * `space-sm` (8px) et `space-md` (16px). À trancher : adopter `space-md`
 * (le `gap` par défaut de `Grid`) ou ajouter un pas de 12px à l'échelle.
 */
export const StatRow = ({ children }: { children: ReactNode }) => (
  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">{children}</div>
);
