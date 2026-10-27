import { ReactNode } from 'react';

/**
 * Proposition : nouveau composant
 * Besoin : une page en deux colonnes 2/3 – 1/3 (contenu principal et colonne
 * latérale) qui s'empilent sous `lg` ; `Grid` ne sait pas faire de colonnes
 * de largeurs inégales.
 */
export const TwoColumns = ({
  main,
  aside,
}: {
  main: ReactNode;
  aside: ReactNode;
}) => (
  <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
    <div className="flex min-w-0 flex-col gap-6 lg:col-span-2">{main}</div>
    <aside className="flex min-w-0 flex-col gap-6">{aside}</aside>
  </div>
);
