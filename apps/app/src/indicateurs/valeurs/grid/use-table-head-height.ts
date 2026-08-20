'use client';

import { RefObject, useEffect, useState } from 'react';

/**
 * Hauteur rendue du `<thead>`, en pixels : c'est le décalage dont les lignes
 * de secteur ont besoin pour se coller juste sous l'en-tête. Mesurée plutôt
 * que figée, parce qu'elle dépend du contenu (titre de l'indicateur sur
 * plusieurs lignes, badge « année de référence »).
 */
export const useTableHeadHeight = (
  tableRef: RefObject<HTMLTableElement | null>
): number => {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const head = tableRef.current?.tHead;
    if (!head) return;
    // jsdom n'implémente pas ResizeObserver : les tests de rendu de la grille
    // se contentent alors d'un décalage nul.
    if (typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(([entry]) => {
      setHeight(entry.target.getBoundingClientRect().height);
    });
    observer.observe(head);
    return () => observer.disconnect();
  }, [tableRef]);

  return height;
};
